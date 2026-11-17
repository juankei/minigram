import express from 'express';
import bcrypt from 'bcrypt';
import db from './database/database.js';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import {randomUUID} from 'crypto'; 
import path from 'path';
import mainRouter from './routers/main.router.js';
import authRouter from './routers/auth.router.js';
import postRouter from './routers/post.router.js';
import likesRouter from './routers/likes.router.js';
import commentsRouter from './routers/comments.router.js';
import { addUserToLocals } from './middlewares/auth.js';
import cors from 'cors';
const app = express()
const port = 3000

app.set('view engine', 'ejs');
app.set('views', './src/views');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(addUserToLocals);
app.use('/uploads', express.static('uploads')); 
app.use('/', mainRouter);
app.use('/auth', authRouter);
app.use('/posts', postRouter);
app.use('/likes', likesRouter);
app.use('/comments', commentsRouter);

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});