import bcrypt from 'bcrypt';
import db from '../database/database.js';

export const createPost = (req, res) => {
   if (!req.file) {
     return res.status(400).send('Selecciona una imagen');
   }

    const { caption } = req.body;
    const username = req.cookies.username;

    //consultamos el user_id del usuario que esta creando el post
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    const userId = user.id;
    //ahora guardamos el post en la base de datos
    const insertPost = db.prepare('INSERT INTO posts (user_id, caption, image_filename) VALUES (?, ?, ?)');
    insertPost.run(userId, caption, req.file.filename);

    res.send('Post creado correctamente');
};
export const getFeed = (req, res) => {
    const username = req.cookies.username;
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    const userId = user ? user.id : null;

    const posts = db.prepare(`
        SELECT posts.*, users.username 
        FROM posts 
        JOIN users ON posts.user_id = users.id 
        ORDER BY posts.created_at DESC
    `).all();

    const postsWithDetails = posts.map(post => {
        // Contar likes y verificar si dio like (como ya tenías)
        const countResult = db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').get(post.id);
        let hasLiked = false;
        if (userId) {
            const likeCheck = db.prepare('SELECT * FROM likes WHERE post_id = ? AND user_id = ?').get(post.id, userId);
            hasLiked = !!likeCheck;
        }

        // Obtener los comentarios del post con su respectivo username
        const comments = db.prepare(`
            SELECT comments.*, users.username 
            FROM comments 
            JOIN users ON comments.user_id = users.id 
            WHERE comments.post_id = ? 
            ORDER BY comments.created_at ASC
        `).all(post.id);

        return {
            ...post,
            likes: countResult.count,
            hasLiked: hasLiked,
            comments: comments // <-- Añadimos los comentarios aquí
        };
    });

    res.render('posts/feed', { posts: postsWithDetails });
};
// Ruta para eliminar un post.
export const deletePost = (req, res) => {
   // Capturamos el ID de la URL y el usuario de la cookie
   const { id } = req.params;
   const username = req.cookies.username;

   // Buscamos el post específico que se quiere eliminar
   const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);

   if (!post) {
      return res.status(404).send('Post no encontrado');
   }

   // Buscamos al usuario en la base de datos para comparar ID's.
   const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

   // Revisamos que el post pertenezca al usuario
   if (!user || post.user_id !== user.id) {
      return res.status(403).send('No tienes permiso para eliminar este post');
   }

   // Si todo funciona bien se elimina correctamente de la base de datos.
   db.prepare('DELETE FROM posts WHERE id = ?').run(id);

   // redirigir a la feed.
   res.redirect('/posts/feed');
};
