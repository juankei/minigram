import bcrypt from 'bcrypt';
import db from '../database/database.js';

const isAuth = (req, res, next) => {
  const username = req.cookies.username;

  if (username) {
    next();
  } else {
    res.redirect('/auth/login');
  }
};

const addUserToLocals = (req, res, next) => {
  const username = req.cookies.username;
  if (username) {
    res.locals.username = username;
  }
  next();
};

export { isAuth, addUserToLocals };
