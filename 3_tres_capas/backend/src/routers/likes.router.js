import { Router } from 'express';
import { isAuth } from '../middlewares/auth.js';
import db from '../database/database.js';
import { countLikes, switchLike, verificarLike } from '../Services/likes.service.js';

const likesRouter = Router();

// Nos devuelve un contador de likes para un post específico (devuelve JSON)
likesRouter.get('/countLikes/:postId', isAuth, countLikes);

// Nos permite verificar si el usuario actual ha dado like a un post específico
likesRouter.get('/verificarLike/:postId', isAuth, verificarLike);

// Método para alternar el like (si ya lo tiene lo quita, si no lo tiene lo pone)
likesRouter.get('/switchLike/:postId', isAuth, switchLike);

export default likesRouter;