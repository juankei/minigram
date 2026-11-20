
import bcrypt from 'bcrypt';
import db from '../database/database.js';
import jwt from 'jsonwebtoken';
import { jwtSecret as secret } from '../middlewares/auth.js';
export const logout = (req, res) => {
  res.clearCookie('username');
  res.redirect('/auth/login');
};

export const register = async (req, res) => {
  const wantsJson = req.accepts(['json', 'html']) === 'json';

  try {
    const { username, email, password } = req.body;

    const checkUser = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (checkUser.rows.length > 0) {
      if (wantsJson) {
        return res.status(400).json({
          success: false,
          message: 'El usuario o email ya está en la base de datos'
        });
      }
      return res.status(400).send(
        'El usuario o email ya está en la base de datos'
      );
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const sentence = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)';
    const values = [username, email, hashedPassword];
    const insertUser = await db.query(sentence, values);

    res.cookie('username', username, {
      maxAge: 900000,
      httpOnly: true
    });

    if (wantsJson) {
      return res.json({ success: true, username });
    }

    res.send(`
      <p>Bien registrado</p>
      <p><a href="/posts/feed">Ir al home</a> · <a href="/">Volver al inicio</a></p>
    `);
  } catch (error) {
    console.error(error);
    if (wantsJson) {
      return res.status(500).json({
        success: false,
        message: 'Error al registrar el usuario'
      });
    }
    res.status(500).send('Error al registrar el usuario');
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Usuario recibido:', username);

    const userResult = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    const user = userResult.rows[0];

    console.log('Usuario encontrado:', !!user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log('Comprobando contraseña...');

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    console.log('Contraseña válida:', validPassword);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }

    const token = jwt.sign(
      { username: user.username },
      secret,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      success: true,
      token
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  }
};