import bcrypt from 'bcrypt';
import db from '../database/database.js';

export const createPost = async (req, res) => {
   if (!req.file) {
     return res.status(400).send('Selecciona una imagen');
   }

    const { caption } = req.body;
    const username = req.cookies.username;

    //consultamos el user_id del usuario que esta creando el post
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    const user = userResult.rows[0];
    const userId = user.id;
    //ahora guardamos el post en la base de datos
    await db.query('INSERT INTO posts (user_id, caption, image_filename) VALUES ($1, $2, $3)', [userId, caption, req.file.filename]);

    res.send('Post creado correctamente');
};
export const getFeed = async         (req, res) => {
    const username = req.cookies.username;
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    const user = userResult.rows[0];
    const userId = user ? user.id : null;

    const postsResult = await db.query(`
        SELECT posts.*, users.username 
        FROM posts 
        JOIN users ON posts.user_id = users.id 
        ORDER BY posts.created_at DESC
    `);
    const posts = postsResult.rows;

    const postsWithDetails = await Promise.all(posts.map(async post => {
        // Contar likes y verificar si dio like (como ya tenías)
        const countResultQuery = await db.query('SELECT COUNT(*) as count FROM likes WHERE post_id = $1', [post.id]);
        const countResult = countResultQuery.rows[0];
        let hasLiked = false;
        if (userId) {
            const likeCheckResult = await db.query('SELECT * FROM likes WHERE post_id = $1 AND user_id = $2', [post.id, userId]);
            const likeCheck = likeCheckResult.rows[0];
            hasLiked = !!likeCheck;
        }

        // Obtener los comentarios del post con su respectivo username
        const commentsResult = await db.query(`
            SELECT comments.*, users.username 
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

    res.render('posts/feed', { posts: postsWithDetails });
};
// Ruta para eliminar un post.
export const deletePost = async (req, res) => {
   // Capturamos el ID de la URL y el usuario de la cookie
   const { id } = req.params;
   const username = req.cookies.username;

   // Buscamos el post específico que se quiere eliminar
   const postResult = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
   const post = postResult.rows[0];

   if (!post) {
      return res.status(404).send('Post no encontrado');
   }

   // Buscamos al usuario en la base de datos para comparar ID's.
   const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
   const user = userResult.rows[0];

   // Revisamos que el post pertenezca al usuario
   if (!user || post.user_id !== user.id) {
      return res.status(403).send('No tienes permiso para eliminar este post');
   }

   // Si todo funciona bien se elimina correctamente de la base de datos.
   await db.query('DELETE FROM posts WHERE id = $1', [id]);

   // redirigir a la feed.
   res.redirect('/posts/feed');
};
