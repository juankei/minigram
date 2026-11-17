import fs from 'node:fs';
import db from './database.js';

const schema = fs.readFileSync(
    new URL ('./schema.sql', import.meta.url),
    'utf8'
)

db.query(schema)
.then(() => {
    console.log("base de datos iniciada correctamente");
})
.catch((err) => {
    console.error("Error al inicializar la base de datos:", err);
});