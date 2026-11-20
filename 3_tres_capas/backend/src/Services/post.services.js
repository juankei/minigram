import bcrypt from 'bcrypt';
import db from '../database/database.js';
import fs from 'fs/promises';
import path from 'path';

export const createPost = async (req, res) => {
   if (!req.file) {
     return res.status(400).json({ success: false, message: 'Selecciona una imagen' });
   }

    const { caption } = req.body;
    // El usuario viene del JWT; la cookie se mantiene como respaldo para las vistas EJS
    const username = req.username || req.cookies.username;

    //consultamos el user_id del usuario que esta creando el post
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }
    //ahora guardamos el post en la base de datos
    await db.query('INSERT INTO posts (user_id, caption, image_filename) VALUES ($1, $2, $3)', [user.id, caption, req.file.filename]);

    res.status(201).json({
      success: true,
      message: 'Post creado correctamente',
      post: {
        caption,
        image_filename: req.file.filename
      }
    });
};
export const getFeed = async (req, res) => {
    // El usuario viene del JWT; la cookie se mantiene como respaldo
    const username = req.username || req.cookies.username;
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    const user = userResult.rows[0];
    const userId = user ? user.id : null;

    const postsResult = await db.query(`
        SELECT posts.*, users.username, users.avatar_filename
        FROM posts 
        JOIN users ON posts.user_id = users.id 
        ORDER BY posts.created_at DESC
    `);
    const posts = postsResult.rows;

    const postsWithDetails = await Promise.all(posts.map(async post => {
        // Contar likes y verificar si dio like (como ya tenías)
        const countResultQuery = await db.query('SELECT COUNT(*)::int AS count FROM likes WHERE post_id = $1', [post.id]);
        const countResult = countResultQuery.rows[0];
        let hasLiked = false;
        if (userId) {
            const likeCheckResult = await db.query('SELECT * FROM likes WHERE post_id = $1 AND user_id = $2', [post.id, userId]);
            const likeCheck = likeCheckResult.rows[0];
            hasLiked = !!likeCheck;
        }

        // Obtener los comentarios del post con su respectivo username
        const commentsResult = await db.query(`
            SELECT comments.*, users.username, users.avatar_filename
            FROM comments 
            JOIN users ON comments.user_id = users.id 
            WHERE comments.post_id = $1
            ORDER BY comments.created_at ASC
        `, [post.id]);
        const comments = commentsResult.rows;

        return {
            ...post,
            likes: countResult.count,
            hasLiked: hasLiked,
            comments: comments // <-- Añadimos los comentarios aquí
        };
    }));

    res.json({ posts: postsWithDetails });
};
// Ruta para eliminar un post.
export const deletePost = async (req, res) => {
   // Capturamos el ID de la URL y el usuario autenticado (JWT)
   const { id } = req.params;
   const username = req.username;

   if (!username) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
   }

   // Buscamos el post específico que se quiere eliminar
   const postResult = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
   const post = postResult.rows[0];

   if (!post) {
      return res.status(404).json({ success: false, message: 'Post no encontrado' });
   }

   // Buscamos al usuario en la base de datos para comparar ID's.
   const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
   const user = userResult.rows[0];

   // Revisamos que el post pertenezca al usuario
   if (!user || post.user_id !== user.id) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar este post' });
   }

   // Si todo funciona bien se elimina correctamente de la base de datos.
   await db.query('DELETE FROM posts WHERE id = $1', [id]);

   // Borramos también la imagen (likes y comentarios se eliminan por CASCADE)
   try {
      await fs.unlink(path.join('uploads', post.image_filename));
   } catch (error) {
      console.error('No se pudo borrar la imagen del post:', error.message);
   }

   // La SPA espera JSON; las vistas EJS siguen redirigiendo al feed
   if (req.accepts(['json', 'html']) === 'html') {
      return res.redirect('/posts/feed');
   }

   res.json({ success: true, message: 'Post eliminado correctamente' });
};
