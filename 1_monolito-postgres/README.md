# Minigram — Monolito con PostgreSQL

Versión **1**: sigue siendo un **monolito** (una sola aplicación Express con vistas EJS), pero la base de datos pasa a ser **PostgreSQL**. En esta versión PostgreSQL se instala **dentro del mismo contenedor** que la aplicación, por lo que sigue habiendo un único servicio.

Es el paso intermedio entre [0_monolito-sqlite](../0_monolito-sqlite/) y [2_dos_capas](../2_dos_capas/).

---

## Tecnologías

- Node.js 24, Express 5 (ES modules).
- `pg` (pool de conexiones a PostgreSQL).
- PostgreSQL (instalado en la imagen Docker mediante `apk`).
- EJS, `cookie-parser`, `bcrypt`, `multer`.

---

## Estructura

```
1_monolito-postgres/
├── docker-compose.yml      # Un servicio: monolito (app + PostgreSQL)
├── Dockerfile              # Instala PostgreSQL, crea usuario/BD y arranca todo
├── minigram.db             # Fichero antiguo de la versión SQLite (no se usa)
├── uploads/
├── package.json
└── src/
    ├── server.js           # Express en el puerto 3000
    ├── database/
    │   ├── database.js     # Pool de pg con variables DB_*
    │   ├── schema.sql      # CREATE TABLE IF NOT EXISTS
    │   └── init.js         # Ejecuta schema.sql (npm run db-init)
    ├── middlewares/        # auth.js (cookie) y upload.js (Multer)
    ├── routers/            # main, auth, posts, likes, comments
    ├── Services/           # Lógica de negocio
    └── views/              # Plantillas EJS
```

---

## Modelo de datos

```
users (id SERIAL, username, email, password, avatar_filename, created_at)
  │
  ├──< posts (id, user_id, caption, image_filename, created_at)
  │      ├──< comments (id, post_id, user_id, comment, created_at)
  │      └──< likes (post_id, user_id, created_at)
  └──< comments / likes
```

`likes` tiene clave primaria `(post_id, user_id)`: un usuario solo puede dar un like por publicación. Los borrados son en cascada.

---

## Configuración

`src/database/database.js` lee estas variables de entorno:

| Variable | Por defecto | Docker Compose |
| --- | --- | --- |
| `DB_USER` | `postgres` | `usuario` |
| `DB_PASSWORD` | `1234` | `123456` |
| `DB_NAME` | `postgres` | `monolito` |
| `DB_HOST` | `localhost` | `localhost` |
| `DB_PORT` | `5432` | `5432` |

> `DB_HOST=localhost` porque PostgreSQL corre **dentro del mismo contenedor** que Node. En la versión de dos capas, en cambio, vale `bbdd`.

El `Dockerfile` hace lo siguiente al construir la imagen:

1. Instala PostgreSQL en la imagen `node:24-alpine`.
2. Ejecuta `initdb` y crea el usuario `usuario` y la BD `monolito`.
3. Arranca PostgreSQL, ejecuta `npm run db-init` (crea las tablas) y luego `npm start`.

No hay `seed.sql`: las tablas se crean vacías.

---

## Autenticación

Igual que en la versión SQLite: **sin JWT**. Registro y login crean una cookie `httpOnly` `username` con 15 minutos de validez. `isAuth` comprueba solo que la cookie exista y, si no, redirige a `/auth/login`.

Están activas las rutas `GET /auth/login` y `GET /auth/register`, que renderizan las vistas EJS.

---

## Puesta en marcha

### Con Docker (recomendado)

```bash
docker compose up --build -d
```

Un único contenedor llamado `monolito` expone el puerto `3000`.

### En local

Necesitas un PostgreSQL accesible en `localhost:5432` con el usuario y la BD indicados. Luego:

```bash
npm install
npm run db-init
npm start
```

Ejemplo en PowerShell para apuntar a una BD local:

```powershell
$env:DB_USER="usuario"
$env:DB_PASSWORD="123456"
$env:DB_NAME="monolito"
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
npm run db-init
npm start
```

### Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Arranca con nodemon. |
| `npm start` | Arranca con nodemon (`nodemon src/server.js`). |
| `npm run db-init` | Ejecuta `schema.sql` para crear las tablas. |

---

## API

Todas las rutas marcadas como cookie requieren la cookie `username` (obtenida con el login).

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `GET` | `/` | — | Página de bienvenida EJS. |
| `GET` | `/protected` | cookie | Ruta de ejemplo protegida. |
| `GET` | `/auth/register` | — | Formulario de registro. |
| `POST` | `/auth/register` | — | Registra usuario y pone la cookie. |
| `GET` | `/auth/login` | — | Formulario de login. |
| `POST` | `/auth/login` | — | Verifica contraseña y pone la cookie. |
| `GET` | `/auth/logout` | — | Borra la cookie. |
| `GET` | `/posts/feed` | cookie | Renderiza el feed con likes y comentarios. |
| `GET` | `/posts/create-post` | cookie | Formulario para crear un post. |
| `POST` | `/posts/create-post` | cookie | Crea un post (multipart/form-data). |
| `GET` | `/posts/delete-post/:id` | cookie | Borra un post propio. |
| `GET` | `/likes/countLikes/:postId` | cookie | `{ likesCount }`. |
| `GET` | `/likes/verificarLike/:postId` | cookie | `{ hasLiked }`. |
| `GET` | `/likes/switchLike/:postId` | cookie | Alterna el like. |
| `GET` | `/comments/list/:postId` | cookie | Lista de comentarios. |
| `POST` | `/comments/create/:postId` | cookie | Crea un comentario. |
| `GET` | `/comments/delete/:commentId` | cookie | Borra un comentario propio. |

---

## Cómo comprobar que funciona

### 1. Que arranque el contenedor

```bash
docker compose up --build -d
docker ps --format "{{.Names}} {{.Status}}"
docker logs monolito --tail 30
```

Resultado esperado: `monolito` arrancado y logs con `Example app listening on port http://localhost:3000`.

### 2. Que PostgreSQL y las tablas existen (dentro del contenedor)

```bash
docker exec -u postgres monolito psql -U usuario -d monolito -c "\dt"
docker exec -u postgres monolito psql -U usuario -d monolito -c "SELECT COUNT(*) FROM users;"
```

Resultado esperado: tablas `users`, `posts`, `comments`, `likes` y `0` usuarios al empezar (no hay seed).

Si `db-init` falló, no aparecerán las tablas; vuelve a ejecutarlo:

```bash
docker exec monolito sh -c "npm run db-init"
```

### 3. Que el servidor responde

Abre <http://localhost:3000>: debe aparecer "Bienvenido a Minigram". Comprueba también que `/auth/login` y `/auth/register` muestran sus formularios y que `/protected` redirige al login si no hay cookie.

### 4. Prueba completa (PowerShell)

```powershell
$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$user = 'testpg' + (Get-Random -Maximum 9999)
$body = @{ username=$user; email="$user@test.com"; password='123456' }
Invoke-WebRequest -Uri http://localhost:3000/auth/register -Method Post -Body $body -WebSession $s -UseBasicParsing
Invoke-WebRequest -Uri http://localhost:3000/auth/login -Method Post -Body @{ username=$user; password='123456' } -WebSession $s -UseBasicParsing
$feed = Invoke-WebRequest -Uri http://localhost:3000/posts/feed -WebSession $s -UseBasicParsing
$feed.StatusCode
```

Resultado esperado: 200 en registro, login y feed.

Para probar los likes necesitas un post. Créalo desde `/posts/create-post` con el navegador (o inserta una fila con `psql`) y luego:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/likes/switchLike/1 -WebSession $s
Invoke-RestMethod -Uri http://localhost:3000/likes/switchLike/1 -WebSession $s
```

Resultado esperado: `{"hasLiked":true,"newLikesCount":N}` y luego `{"hasLiked":false,...}`.

Verifica que PostgreSQL cambió:

```bash
docker exec -u postgres monolito psql -U usuario -d monolito -c "SELECT username FROM users;"
docker exec -u postgres monolito psql -U usuario -d monolito -c "SELECT * FROM likes;"
```

### 5. Si falla

| Síntoma | Causa probable |
| --- | --- |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL no arrancó dentro del contenedor. Revisa `docker logs monolito`. |
| No existen tablas | `npm run db-init` no se ejecutó; lánzalo a mano. |
| `/posts/feed` redirige al login | Falta la cookie `username`. |
| `401` en los likes | La cookie no se envió o el usuario no existe en `users`. |

---

## Limitaciones

- Aunque usa PostgreSQL, sigue siendo un monolito: interfaz, lógica y datos comparten proceso y contenedor.
- PostgreSQL no tiene volumen persistente: al borrar el contenedor se pierden los datos.
- La autenticación es una cookie con el nombre de usuario sin firmar; `isAuth` no valida su contenido.
- No hay datos de ejemplo: hay que registrar usuarios y crear posts.
- Queda un `minigram.db` de la versión SQLite que ya no se utiliza.
- `npm start` usa nodemon también en producción.
