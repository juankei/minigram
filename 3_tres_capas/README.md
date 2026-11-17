# Minigram

Minigram es una red social de fotos inspirada en Instagram, construida con una arquitectura de **tres capas**:

- **Frontend**: SPA en Angular 19 con Angular Material.
- **Backend**: API REST en Node.js + Express 5 (también incluye algunas vistas EJS).
- **Base de datos**: PostgreSQL 18.

Los usuarios pueden iniciar sesión, ver un feed de publicaciones con imagen y descripción, dar "me gusta" y comentar las publicaciones.

---

## Arquitectura

```
┌─────────────────────────┐
│  Frontend (Angular)     │  http://localhost:4200
│  fronted/               │
└───────────┬─────────────┘
            │ HTTP + JWT (Authorization: Bearer)
┌───────────▼─────────────┐
│  Backend (Express)      │  http://localhost:3000
│  backend/               │
└───────────┬─────────────┘
            │ SQL (pg Pool)
┌───────────▼─────────────┐
│  PostgreSQL             │  puerto 5432 (red interna)
│  bbdd/                  │
└─────────────────────────┘
```

### Estructura del proyecto

```
3_tres_capas/
├── docker-compose.yml        # Orquestación de los tres servicios
├── bbdd/
│   ├── schema.sql            # Creación de tablas
│   └── seed.sql              # Datos de ejemplo
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── uploads/              # Imágenes subidas por los usuarios
│   └── src/
│       ├── server.js         # Punto de entrada de Express
│       ├── database/         # Conexión a PostgreSQL (pool)
│       ├── middlewares/      # Autenticación JWT y subida de archivos (Multer)
│       ├── routers/          # Rutas de auth, posts, likes y comments
│       ├── Services/         # Lógica de negocio
│       └── views/            # Vistas EJS
└── fronted/                  # (sic) Aplicación Angular
    ├── Dockerfile
    ├── angular.json
    └── src/app/
        ├── pages/            # login y home
        ├── components/       # post y comments
        └── services/         # RestApiServiceService
```

---

## Tecnologías

| Capa | Tecnologías |
| --- | --- |
| Frontend | Angular 19, Angular Material 19, TypeScript 5.7, RxJS |
| Backend | Node.js 24, Express 5, `pg`, `bcrypt`, `jsonwebtoken`, `multer`, `cookie-parser`, `cors`, EJS |
| Base de datos | PostgreSQL 18 |
| Infraestructura | Docker, Docker Compose |

---

## Requisitos

- [Docker](https://www.docker.com/) y Docker Compose (recomendado).
- Para ejecución local sin Docker:
  - Node.js 24+
  - PostgreSQL 18+
  - npm

---

## Puesta en marcha con Docker

Desde la raíz del proyecto:

```bash
docker compose up --build
```

Servicios disponibles:

| Servicio | URL / puerto |
| --- | --- |
| Frontend | http://localhost:4200 |
| Backend | http://localhost:3000 |
| PostgreSQL | `bbdd:5432` (solo dentro de la red de Docker) |

Credenciales de la base de datos definidas en `docker-compose.yml`:

| Variable | Valor |
| --- | --- |
| `POSTGRES_USER` | `usuario` |
| `POSTGRES_PASSWORD` | `123456` |
| `POSTGRES_DB` | `monolito` |

Al arrancar por primera vez, PostgreSQL ejecuta automáticamente `bbdd/schema.sql` y `bbdd/seed.sql`.

Para detener los servicios:

```bash
docker compose down
```

Para detener y borrar también los datos de la base de datos (los datos no se guardan en un volumen persistente):

```bash
docker compose down -v
```

---

## Puesta en marcha en local (sin Docker)

### 1. Base de datos

Crea la base de datos y ejecuta los scripts:

```bash
createdb monolito
psql -d monolito -f bbdd/schema.sql
psql -d monolito -f bbdd/seed.sql
```

### 2. Backend

```bash
cd backend
npm install
npm run dev     # con recarga automática (nodemon)
# o
npm start       # modo normal
```

El backend escucha en `http://localhost:3000`.

Variables de entorno admitidas (con sus valores por defecto):

| Variable | Por defecto | Descripción |
| --- | --- | --- |
| `DB_USER` | `postgres` | Usuario de PostgreSQL |
| `DB_PASSWORD` | `1234` | Contraseña de PostgreSQL |
| `DB_HOST` | `localhost` | Host de PostgreSQL |
| `DB_NAME` | `postgres` | Nombre de la base de datos |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |

Ejemplo en PowerShell:

```powershell
$env:DB_USER="usuario"
$env:DB_PASSWORD="123456"
$env:DB_NAME="monolito"
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
npm run dev
```

> La carpeta `backend/uploads/` debe existir para que Multer pueda guardar las imágenes. Si no existe, créala antes de subir publicaciones.

### 3. Frontend

```bash
cd fronted
npm install
npm start
```

La aplicación queda disponible en `http://localhost:4200`. La URL de la API está fijada en `fronted/src/app/services/rest-api.service.service.ts` como `http://localhost:3000`.

---

## API REST

Todas las rutas marcadas como **JWT** requieren la cabecera:

```
Authorization: Bearer <token>
```

El token se obtiene en `POST /auth/login` y tiene una validez de **1 hora**.

### Autenticación

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | — | Registra un usuario (`username`, `email`, `password`). |
| `POST` | `/auth/login` | — | Inicia sesión y devuelve `{ success, token }`. |
| `GET` | `/auth/logout` | — | Borra la cookie `username` y redirige al login. |

### Publicaciones

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `GET` | `/posts/feed` | JWT | Devuelve `{ posts: [...] }` con autor, likes y comentarios. |
| `GET` | `/posts/create-post` | JWT | Formulario EJS para crear una publicación. |
| `POST` | `/posts/create-post` | JWT | Crea una publicación (`multipart/form-data`: `image`, `caption`). |
| `GET` | `/posts/delete-post/:id` | JWT | Elimina una publicación del usuario autenticado. |

### Likes

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `GET` | `/likes/countLikes/:postId` | JWT | Número de likes de una publicación. |
| `GET` | `/likes/verificarLike/:postId` | JWT | Indica si el usuario actual dio like. |
| `GET` | `/likes/switchLike/:postId` | JWT | Alterna el like y devuelve el nuevo contador. |

### Comentarios

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `GET` | `/comments/list/:postId` | JWT | Lista los comentarios de una publicación. |
| `POST` | `/comments/create/:postId` | JWT | Crea un comentario (`{ comment }`). |
| `DELETE` | `/comments/delete/:commentId` | JWT | Elimina un comentario propio. |

### Otros

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/` | Página de bienvenida renderizada con EJS. |
| `GET` | `/protected` | Ruta de ejemplo protegida con JWT. |
| `GET` | `/uploads/:archivo` | Sirve las imágenes subidas. |

---

## Modelo de datos

```
users (id, username, email, password, avatar_filename, created_at)
  │
  ├──< posts (id, user_id, caption, image_filename, created_at)
  │      │
  │      ├──< comments (id, post_id, user_id, comment, created_at)
  │      └──< likes (post_id, user_id, created_at)
  │
  └──< comments / likes
```

- `users.username` y `users.email` son únicos.
- `likes` tiene clave primaria compuesta `(post_id, user_id)`, por lo que un usuario solo puede dar un like por publicación.
- Los borrados en cascada eliminan publicaciones, comentarios y likes asociados.

---

## Scripts disponibles

### Backend (`backend/`)

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Arranca con `nodemon` y recarga al cambiar `.js`/`.ejs`. |
| `npm start` | Arranca el servidor con Node. |

### Frontend (`fronted/`)

| Comando | Descripción |
| --- | --- |
| `npm start` | Servidor de desarrollo en `http://localhost:4200`. |
| `npm run build` | Compila la aplicación en `dist/fronted/`. |
| `npm test` | Ejecuta los tests unitarios con Karma. |

---

## Flujo de uso

1. Abre `http://localhost:4200`.
2. Inicia sesión con un usuario existente (ver nota sobre el seed más abajo).
3. Se guarda el JWT en `localStorage` y se navega a `/home`.
4. El feed muestra las publicaciones con su autor, imagen, descripción y comentarios.
5. Desde el componente de comentarios se pueden añadir comentarios a cada publicación.

---

## Notas y limitaciones conocidas

- **Usuarios del seed sin contraseña válida**: `bbdd/seed.sql` inserta hashes de ejemplo (`$2b$10$HASH_ANA`, etc.), por lo que esos usuarios **no pueden iniciar sesión** hasta reemplazar el hash por uno real generado con bcrypt. Para generar uno:

  ```bash
  cd backend
  node -e "const b=require('bcrypt'); b.hash('123456',10).then(console.log)"
  ```

- **Autenticación mixta**: el middleware `isAuth` valida el JWT; `getFeed`, los likes y los comentarios ya obtienen el usuario del token (con la cookie como respaldo), pero `createPost` y `deletePost` todavía leen el usuario de la cookie `username`, que el login de la API no establece. Para que esas operaciones funcionen correctamente conviene unificar ambos mecanismos.
- **Secreto JWT en código**: el secreto está definido como `patata` en `backend/src/middlewares/auth.js`. En un entorno real debería moverse a una variable de entorno.
- **Sin pantalla de registro en el frontend**: el backend expone `POST /auth/register`, pero la SPA solo incluye la vista de login.
- **Sin volumen persistente para PostgreSQL**: al eliminar el contenedor se pierden los datos.
- **Flag de build obsoleto**: el `Dockerfile` del frontend usa `npm run build --prod`; en Angular 19 lo recomendado es `npm run build -- --configuration production`.
- **Nombre de la carpeta `fronted`**: es un typo mantenido en las rutas del `Dockerfile`, `docker-compose.yml` y la configuración del proyecto.

---

## Posibles mejoras

- Unificar la autenticación (solo JWT o solo cookies) y mover el secreto a `.env`.
- Añadir registro de usuarios en Angular.
- Implementar la interacción de likes en el frontend.
- Añadir un volumen de Docker para PostgreSQL.
- Incorporar validaciones de entrada y manejo de errores centralizado.
- Añadir tests para los endpoints principales.
