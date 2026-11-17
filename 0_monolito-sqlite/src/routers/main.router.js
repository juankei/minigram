import { Router } from 'express';
import { isAuth } from '../middlewares/auth.js';

const mainRouter = Router();

// Página principal
mainRouter.get('/', (req, res) => {
  res.render('index');
});

// Ruta protegida de ejemplo
mainRouter.get('/protected', isAuth, (req, res) => {
  res.send('Ruta protegida');
});

export default mainRouter;