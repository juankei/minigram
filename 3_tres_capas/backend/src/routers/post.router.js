import { Router } from 'express';
import express from 'express';
import bcrypt from 'bcrypt';
import db from '../database/database.js';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import {createPost,getFeed, deletePost } from '../Services/post.services.js';
import { isAuth } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { storage } from '../middlewares/upload.js';
import {randomUUID} from 'crypto'; 
import path from 'path';

const postrouter = Router()

// Ruta para ver el feed.
postrouter.get('/feed', isAuth, getFeed);

// Ruta para mostrarel formulario para crear posts.
postrouter.get('/create-post', isAuth, (req, res) => {
   res.render('posts/create-post')
})

// Ruta para procesar la creación de un post.
postrouter.post('/create-post', isAuth, upload.single('image'), createPost);

// Ruta para eliminar un post.
postrouter.get('/delete-post/:id', isAuth, deletePost);

export default postrouter;