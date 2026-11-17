import bcrypt from 'bcrypt';
import db from '../database/database.js';
import jwt from 'jsonwebtoken';
import authrouter from '../routers/auth.router.js';
const jwtSecret = 'patata';

const isAuth = (req, res, next) => {
  
  const authHeader = req.headers.authorization;
 console.log('Authorization header:', authHeader);

 const token = authHeader && authHeader.split(' ')[1];
 if (!token) {
   return res.status(401).json({ message: 'No token provided' });
 }

 jwt.verify(token, jwtSecret, (err, user) => {
   if (err) {
     return res.status(403).json({ message: 'Failed to authenticate token' });
   }
   console.log('Authenticated user:', user);
   req.username = user.username;
   next();
 });

  
};

const addUserToLocals = (req, res, next) => {
  const username = req.cookies.username;
  if (username) {
    res.locals.username = username;
  }
  next();
};

export { isAuth, addUserToLocals, jwtSecret };
