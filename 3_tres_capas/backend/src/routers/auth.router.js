

import { Router } from 'express';
import express from 'express';
import bcrypt from 'bcrypt';
import db from '../database/database.js';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { register, login } from '../Services/auth.services.js';
import { isAuth } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { storage } from '../middlewares/upload.js';
import {randomUUID} from 'crypto'; 
import path from 'path';

const authrouter = Router()
//registro
authrouter.get('/register', (req, res) => {
    res.render('auth/register')
})
/*
authrouter.get('/login', (req, res) => {
    res.render('auth/login')
})*/

authrouter.post('/register', register);
authrouter.post('/login', login);

authrouter.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.redirect('/auth/login');
});

export default authrouter;