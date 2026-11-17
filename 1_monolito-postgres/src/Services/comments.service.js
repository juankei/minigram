
import db from '../database/database.js';


// Nos devuelve todos los comentarios de un post especifico.
const listComments = async (req, res) => {
    const { postId } = req.params;

    // Verificamos si el post existe.
    const postResult = await db.query(
      'SELECT * FROM posts WHERE id = $1',
      [postId]
    );
    const post = postResult.rows[0];
    if (!post) {
        return res.status(404).json({ error: 'Post no encontrado'});
    }

    // Consulta corregida (unión correcta con users y filtro por post_id)
    const commentsResult = await db.query(
      `
        SELECT comments.*, users.username
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.post_id = $1
        ORDER BY comments.created_at ASC
      `,
      [postId]
    );
    
    res.json(commentsResult.rows);
};

// Método para crear un comentario para un post específico (Devuelve JSON)
const createComment = async (req, res) => {
    const { postId } = req.params;
    const { comment } = req.body;
    const username = req.cookies.username;

    if (!comment || comment.trim() === '') {
        return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    }

    // Buscamos el ID del usuario
    const userResult = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    const user = userResult.rows[0];
    if (!user) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Verificamos que el post exista
    const postResult = await db.query(
      'SELECT id FROM posts WHERE id = $1',
      [postId]
    );
    const post = postResult.rows[0];
    if (!post) {
        return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Insertamos el comentario y obtenemos su ID generado
    const insertResult = await db.query(
      'INSERT INTO comments (post_id, user_id, comment) VALUES ($1, $2, $3) RETURNING id',
      [postId, user.id, comment]
    );
    const newCommentId = insertResult.rows[0].id;

    // ¡Clave! Devolvemos un JSON con los datos para que el script los pinte al instante
    res.json({
        id: newCommentId,
        username: username,
        comment: comment
    });
};

// Método para eliminar un comentario específico
const deleteComment = async (req, res) => {
    const { commentId } = req.params;
    const username = req.cookies.username;

    const userResult = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    const user = userResult.rows[0];
    if (!user) {
        return res.status(401).send('Usuario no encontrado');
    }

    const commentResult = await db.query(
      'SELECT * FROM comments WHERE id = $1',
      [commentId]
    );
    const comment = commentResult.rows[0];
    if (!comment) {
        return res.status(404).send('Comentario no encontrado');
    }

    if (comment.user_id !== user.id) {
        return res.status(403).send('No tienes permiso para eliminar este comentario');
    }

    await db.query(
      'DELETE FROM comments WHERE id = $1',
      [commentId]
    );

    res.redirect('/posts/feed');
};

export { listComments, createComment, deleteComment };  