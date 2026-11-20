
import bcrypt from 'bcrypt';
import db from '../database/database.js';

export const logout = (req, res) => {
  res.clearCookie('username');
  res.redirect('/auth/login');
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const checkUser = db.prepare(
      'SELECT * FROM users WHERE username = ? OR email = ?'
    ).get(username, email);

    if (checkUser) {
      return res.status(400).send(
        'El usuario o email ya está en la base de datos'
      );
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const insertUser = db.prepare(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
    );

    insertUser.run(username, email, hashedPassword);

    res.cookie('username', username, {
      maxAge: 900000,
      httpOnly: true
    });

    res.send(`
      <p>Bien registrado</p>
      <p><a href="/posts/feed">Ir al home</a> · <a href="/">Volver al inicio</a></p>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al registrar el usuario');
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = db.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).get(username);

    if (user && await bcrypt.compare(password, user.password)) {
      res.cookie('username', username, {
        maxAge: 900000,
        httpOnly: true
      });

      return res.send(`
        <p>Logueado correctamente</p>
        <p><a href="/posts/feed">Ir al home</a> · <a href="/">Volver al inicio</a></p>
      `);
    }

    res.status(401).send('Credenciales incorrectas');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al iniciar sesión');
  }
};