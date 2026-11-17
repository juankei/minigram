
import db from '../database/database.js';


// Nos devuelve todos los comentarios de un post especifico.
const listComments = (req, res) => {
    const { postId } = req.params;

    // Verificamos si el post existe.
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    if (!post) {
        return res.status(404).json({ error: 'Post no encontrado'});
    }

    // Consulta corregida (unión correcta con users y filtro por post_id)
    const comments = db.prepare(`
        SELECT comments.*, users.username
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.post_id = ?
        ORDER BY comments.created_at ASC
    `).all(postId);
    
    res.json(comments);
};

// Método para crear un comentario para un post específico (Devuelve JSON)
const createComment = (req, res) => {
    const { postId } = req.params;
    const { comment } = req.body;
    const username = req.cookies.username;

    if (!comment || comment.trim() === '') {
        return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    }

    // Buscamos el ID del usuario
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (!user) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Verificamos que el post exista
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
        return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Insertamos el comentario y obtenemos su ID generado
    const result = db.prepare('INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)').run(postId, user.id, comment);
    const newCommentId = result.lastInsertRowid;

    // ¡Clave! Devolvemos un JSON con los datos para que el script los pinte al instante
    res.json({
        id: newCommentId,
        username: username,
        comment: comment
    });
};

// Método para eliminar un comentario específico
const deleteComment = (req, res) => {
    const { commentId } = req.params;
    const username = req.cookies.username;

    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (!user) {
        return res.status(401).send('Usuario no encontrado');
    }

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
    if (!comment) {
        return res.status(404).send('Comentario no encontrado');
    }

    if (comment.user_id !== user.id) {
        return res.status(403).send('No tienes permiso para eliminar este comentario');
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);

    res.redirect('/posts/feed');
};

export { listComments, createComment, deleteComment };  