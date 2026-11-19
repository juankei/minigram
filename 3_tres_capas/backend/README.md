# Capa de aplicación — Backend (Express 5)

Este directorio contiene la **API REST** de [Minigram](../README.md). Es la capa intermedia: recibe peticiones HTTP del frontend, valida el JWT, aplica la lógica de negocio y consulta PostgreSQL.

También conserva algunas vistas EJS antiguas, pero la aplicación real es la SPA de Angular.

---

## Tecnologías

- Node.js 24, Express 5 (ES modules, `"type": "module"`).
- `pg` (pool de conexiones a PostgreSQL).
- `jsonwebtoken` (JWT), `bcrypt` (hash de contraseñas).
- `multer` (subida de imágenes), `cookie-parser`, `cors`, EJS.

---

## Estructura

```
backend/
├── Dockerfile
├── package.json
├── uploads/                  # Imágenes servidas en /uploads
└── src/
    ├── server.js             # Punto de entrada: middlewares y montaje de routers
    ├── database/
    │   └── database.js       # Pool de pg con variables DB_*
    ├── middlewares/
    │   ├── auth.js           # isAuth (JWT) y addUserToLocals
    │   └── upload.js         # Configuración de Multer
    ├── routers/
    │   ├── main.router.js    # / y /protected
    │   ├── auth.router.js    # /auth
    │   ├── post.router.js    # /posts
    │   ├── likes.router.js   # /likes
    │   └── comments.router.js# /comments
    ├── Services/
    │   ├── auth.services.js  # register y login
    │   ├── post.services.js  # feed, crear y borrar posts
    │   ├── likes.service.js  # contar, verificar y alternar likes
    │   └── comments.service.js# listar, crear y borrar comentarios
    └── views/                # Plantillas EJS (legado)
```

---

## Configuración

La conexión a la base de datos se lee de variables de entorno en `src/database/database.js`:

| Variable | Por defecto (local) | Docker Compose |
| --- | --- | --- |
| `DB_USER` | `postgres` | `usuario` |
| `DB_PASSWORD` | `1234` | `123456` |
| `DB_HOST` | `localhost` | `bbdd` |
| `DB_NAME` | `postgres` | `monolito` |
| `DB_PORT` | `5432` | `5432` |

El secreto JWT es una constante en `src/middlewares/auth.js`:

```js
const jwtSecret = 'patata';
```

---

## Autenticación

`isAuth` lee la cabecera `Authorization: Bearer <token>`, verifica el JWT con `patata` y guarda el usuario en **`req.username`**:

```js
req.username = user.username;
```

Es la única convención usada en los servicios (`comments.service.js`, `likes.service.js` y `post.services.js`). No se guarda `req.user`.

- `POST /auth/login` genera un token con `{ username }` y validez de **1 hora**.
- Las rutas protegidas responden `401` si no hay token y `403` si el token no es válido.

### Rutas

Todas las rutas marcadas con **JWT** requieren:

```
Authorization: Bearer <token>
```

#### Autenticación

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | — | Registra usuario (`username`, `email`, `password`). |
| `POST` | `/auth/login` | — | Devuelve `{ success: true, token }`. |
| `GET` | `/auth/logout` | — | Borra la cookie `username` y redirige a `/auth/login`. |

> `GET /auth/login` está **comentado** en `auth.router.js`. Por eso al abrir esa URL en el navegador sale `Cannot GET /auth/login`. El login real se hace desde `http://localhost:4200/login`.

#### Publicaciones

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `GET` | `/posts/feed` | JWT | Devuelve `{ posts: [...] }` con autor, likes y comentarios. |
| `GET` | `/posts/create-post` | JWT | Formulario EJS para crear un post. |
| `POST` | `/posts/create-post` | JWT | Crea un post (`multipart/form-data`: `image`, `caption`). |
| `GET` | `/posts/delete-post/:id` | JWT | Borra un post propio. |

#### Likes

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `GET` | `/likes/countLikes/:postId` | JWT | `{ likesCount }`. |
| `GET` | `/likes/verificarLike/:postId` | JWT | `{ hasLiked }`. |
| `GET` | `/likes/switchLike/:postId` | JWT | Alterna el like: `{ hasLiked, newLikesCount }`. |

#### Comentarios

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `GET` | `/comments/list/:postId` | JWT | Lista de comentarios del post. |
| `POST` | `/comments/create/:postId` | JWT | Crea un comentario (`{ comment }`). |
| `DELETE` | `/comments/delete/:commentId` | JWT | Borra un comentario propio. |

#### Otros

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/` | Página EJS de bienvenida. |
| `GET` | `/protected` | Ruta de ejemplo protegida. |
| `GET` | `/uploads/:archivo` | Imágenes subidas. |

---

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Arranca con `nodemon` y recarga al cambiar `.js`/`.ejs`. |
| `npm start` | Arranca con `node src/server.js`. |

---

## Arranque

Con Docker, desde la raíz:

```bash
docker compose up --build backend
```

Sin Docker:

```bash
cd backend
npm install
npm run dev
```

> Si cambias código con Docker, reconstruye la imagen (`docker compose up -d --build backend`): el contenedor no monta el código como volumen.

---

## Cómo comprobar que esta capa funciona

### 1. Que el código sea válido

```bash
cd backend
node --check src/server.js
node --check src/Services/likes.service.js
node --check src/Services/post.services.js
```

Sin salida = sintaxis correcta.

### 2. Que arranque y conecte con la BD

```bash
npm start
```

Debes ver:

```
Example app listening on port http://localhost:3000
```

Abre <http://localhost:3000/>: debe cargar la página EJS. Si el backend no puede conectar con PostgreSQL, saldrá un error de `ECONNREFUSED` en la consola.

### 3. Prueba de la API (PowerShell)

Los usuarios del `seed.sql` tienen hashes falsos, así que conviene crear uno nuevo.

**Registrar un usuario:**

```powershell
$body = @{ username='prueba'; email='prueba@test.com'; password='123456' } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/auth/register -Method Post -ContentType 'application/json' -Body $body
```

**Hacer login y guardar el token:**

```powershell
$body = @{ username='prueba'; password='123456' } | ConvertTo-Json
$login = Invoke-RestMethod -Uri http://localhost:3000/auth/login -Method Post -ContentType 'application/json' -Body $body
$token = $login.token
$h = @{ Authorization = "Bearer $token" }
$login | ConvertTo-Json
```

Resultado esperado: `{ "success": true, "token": "eyJ..." }`.

**Comprobar el feed:**

```powershell
Invoke-RestMethod -Uri http://localhost:3000/posts/feed -Headers $h | ConvertTo-Json -Depth 6
```

Resultado esperado: `{ "posts": [ ... ] }` con `likes`, `hasLiked` y `comments` en cada post.

**Comprobar likes (dos veces):**

```powershell
Invoke-RestMethod -Uri http://localhost:3000/likes/switchLike/1 -Headers $h
Invoke-RestMethod -Uri http://localhost:3000/likes/switchLike/1 -Headers $h
```

Resultado esperado:

```json
{ "hasLiked": true, "newLikesCount": 1 }
{ "hasLiked": false, "newLikesCount": 0 }
```

**Comprobar comentarios:**

```powershell
Invoke-RestMethod -Uri http://localhost:3000/comments/create/1 -Method Post -Headers $h -ContentType 'application/json' -Body '{"comment":"Probando el backend"}'
$comments = Invoke-RestMethod -Uri http://localhost:3000/comments/list/1 -Headers $h
$comments | ConvertTo-Json -Depth 4
```

### 4. Comprobar que la autenticación protege

```powershell
Invoke-RestMethod -Uri http://localhost:3000/posts/feed
```

Sin cabecera debe dar **401**. Con un token manipulado debe dar **403**.

También puedes revisar las trazas:

```bash
docker logs backend --tail 50
```

---

## Limitaciones conocidas

- `GET /auth/login` está comentado: al abrirlo en el navegador sale `Cannot GET /auth/login`.
- El secreto JWT (`patata`) está en el código; en producción debe ir en una variable de entorno.
- Autenticación mixta: `getFeed`, likes y comentarios leen `req.username` del JWT, pero `createPost` y `deletePost` siguen leyendo la cookie `username`, que el login de la API no establece.
- `GET /auth/logout` redirige a `/auth/login`, que actualmente no existe como `GET`.
- Las contraseñas del seed son marcadores de posición y no permiten entrar.
