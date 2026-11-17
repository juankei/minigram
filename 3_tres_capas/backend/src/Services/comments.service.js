import db from '../database/database.js';

// Obtener todos los comentarios de un post específico
const listComments = async (req, res) => {
  try {
    const { postId } = req.params;

    // Comprobar que existe el post
    const postResult = await db.query(
      'SELECT id FROM posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Post no encontrado'
      });
    }

    // Obtener los comentarios junto con el username y el avatar del autor
    const commentsResult = await db.query(
      `SELECT comments.id,
              comments.post_id,
              comments.user_id,
              comments.comment,
              comments.created_at,
              users.username,
              users.avatar_filename
       FROM comments
       JOIN users ON comments.user_id = users.id
       WHERE comments.post_id = $1
       ORDER BY comments.created_at ASC`,
      [postId]
    );

    return res.status(200).json(commentsResult.rows);

  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    return res.status(500).json({
      error: 'Error al obtener los comentarios'
    });
  }
};


// Crear un comentario para un post específico
const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { comment } = req.body;

    // El usuario ahora viene del JWT
    const username = req.username;

    if (!username) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({
        error: 'El comentario no puede estar vacío'
      });
    }

    // Buscar el usuario (incluimos el avatar para devolverlo en la respuesta)
    const userResult = await db.query(
      'SELECT id, username, avatar_filename FROM users WHERE username = $1',
      [username]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }

    // Comprobar que existe el post
    const postResult = await db.query(
      'SELECT id FROM posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Post no encontrado'
      });
    }

    // Insertar comentario
    const insertResult = await db.query(
      `INSERT INTO comments (post_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING id, post_id, user_id, comment`,
      [postId, user.id, comment.trim()]
    );

    return res.status(201).json({
      ...insertResult.rows[0],
      username: user.username,
      avatar_filename: user.avatar_filename
    });

  } catch (error) {
    console.error('Error al crear comentario:', error);
    return res.status(500).json({
      error: 'Error al crear el comentario'
    });
  }
};


// Eliminar un comentario específico
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const username = req.username;

    if (!username) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }

    // Buscar el usuario
    const userResult = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }

    // Buscar el comentario
    const commentResult = await db.query(
      'SELECT id, user_id FROM comments WHERE id = $1',
      [commentId]
    );

    const comment = commentResult.rows[0];

    if (!comment) {
      return res.status(404).json({
        error: 'Comentario no encontrado'
      });
    }

    // Comprobar que el comentario pertenece al usuario
    if (Number(comment.user_id) !== Number(user.id)) {
      return res.status(403).json({
        error: 'No tienes permiso para eliminar este comentario'
      });
    }

    // Eliminar comentario
    await db.query(
      'DELETE FROM comments WHERE id = $1',
      [commentId]
    );

    return res.status(200).json({
      success: true,
      message: 'Comentario eliminado correctamente'
    });

  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    return res.status(500).json({
      error: 'Error al eliminar el comentario'
    });
  }
};

export { listComments, createComment, deleteComment };