import { Router } from 'express';
import { isAuth } from '../middlewares/auth.js';
import db from '../database/database.js';

// Nos devuelve un contador de likes para un post específico (devuelve JSON)
 const countLikes = async (req, res) => {
    const { postId } = req.params;
    const result = await db.query('SELECT COUNT(*) as count FROM likes WHERE post_id = $1', [postId]);
    res.json({ likesCount: result.rows[0] ? result.rows[0].count : 0 });
};

// Nos permite verificar si el usuario actual ha dado like a un post específico
 const verificarLike = async    (req, res) => {
    const { postId } = req.params;
    const username = req.cookies.username;

    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    const user = userResult.rows[0];
    if (!user) {
        return res.json({ hasLiked: false });
    }

    const likeResult = await db.query('SELECT * FROM likes WHERE post_id = $1 AND user_id = $2', [postId, user.id]);
    const like = likeResult.rows[0];
    res.json({ hasLiked: !!like }); // Devuelve true o false en formato JSON
};

// Método para alternar el like (si ya lo tiene lo quita, si no lo tiene lo pone)
 const switchLike = async (req, res) => {
    const { postId } = req.params;
    const username = req.cookies.username;

    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    const user = userResult.rows[0];
    if (!user) return res.status(401).json({ error: 'No autorizado' });

    const existingLikeResult = await db.query('SELECT * FROM likes WHERE post_id = $1 AND user_id = $2', [postId, user.id]);
    const existingLike = existingLikeResult.rows[0];

    let hasLiked = false;
    if (existingLike) {
        await db.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [postId, user.id]);
        hasLiked = false;
    } else {
        await db.query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2)', [postId, user.id]);
        hasLiked = true;
    }

    // Contar el total actualizado de likes
    const countResultQuery = await db.query('SELECT COUNT(*) as count FROM likes WHERE post_id = $1', [postId]);
    const countResult = countResultQuery.rows[0];   

    // Devolvemos JSON en lugar de redirect
    res.json({ hasLiked, newLikesCount: countResult.count });
};

export { countLikes, verificarLike, switchLike };