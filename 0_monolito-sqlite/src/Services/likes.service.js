import { Router } from 'express';
import { isAuth } from '../middlewares/auth.js';
import db from '../database/database.js';

// Nos devuelve un contador de likes para un post específico (devuelve JSON)
 const countLikes = (req, res) => {
    const { postId } = req.params;
    const result = db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').get(postId);
    res.json({ likesCount: result ? result.count : 0 });
};

// Nos permite verificar si el usuario actual ha dado like a un post específico
 const verificarLike = (req, res) => {
    const { postId } = req.params;
    const username = req.cookies.username;

    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (!user) {
        return res.json({ hasLiked: false });
    }

    const like = db.prepare('SELECT * FROM likes WHERE post_id = ? AND user_id = ?').get(postId, user.id);
    res.json({ hasLiked: !!like }); // Devuelve true o false en formato JSON
};

// Método para alternar el like (si ya lo tiene lo quita, si no lo tiene lo pone)
 const switchLike = (req, res) => {
    const { postId } = req.params;
    const username = req.cookies.username;

    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (!user) return res.status(401).json({ error: 'No autorizado' });

    const existingLike = db.prepare('SELECT * FROM likes WHERE post_id = ? AND user_id = ?').get(postId, user.id);

    let hasLiked = false;
    if (existingLike) {
        db.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').run(postId, user.id);
        hasLiked = false;
    } else {
        db.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').run(postId, user.id);
        hasLiked = true;
    }

    // Contar el total actualizado de likes
    const countResult = db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').get(postId);

    // Devolvemos JSON en lugar de redirect
    res.json({ hasLiked, newLikesCount: countResult.count });
};

export { countLikes, verificarLike, switchLike };