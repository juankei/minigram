

import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import db from '../database/database.js';


export const storage = multer.diskStorage({
  // Carpeta donde se guardarán las imágenes
  destination: 'uploads/',

  // Genera un nombre único para el archivo
  filename: (req, file, cb) => {
    // Obtenemos la extensión original en minúsculas
    const extension = path.extname(file.originalname).toLowerCase();

    // Generamos un nombre único
    cb(null, `${randomUUID()}${extension}`);
  }
});

// Creamos la configuración de Multer
export const upload = multer({ storage });

// Exportamos upload para usarlo en las rutas
export default upload;