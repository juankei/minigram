import { Router } from 'express';
import { isAuth } from '../middlewares/auth.js';
import db from '../database/database.js';
import { listComments, createComment, deleteComment } from '../Services/comments.service.js';
const commentsRouter = Router();

// Nos devuelve todos los comentarios de un post especifico.
commentsRouter.get('/list/:postId', isAuth, listComments);

// Método para crear un comentario para un post específico (Devuelve JSON)
commentsRouter.post('/create/:postId', isAuth, createComment);

// Método para eliminar un comentario específico
commentsRouter.get('/delete/:commentId', isAuth, deleteComment);

export default commentsRouter;