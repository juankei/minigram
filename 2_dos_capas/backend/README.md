# Backend — Minigram de dos capas

Esta carpeta contiene la **aplicación Express** de [2_dos_capas](../README.md). Incluye tanto la interfaz (vistas EJS) como la lógica de negocio y las rutas de la API. La base de datos está en un contenedor distinto (`bbdd`).

---

## Tecnologías

- Node.js 24, Express 5 (ES modules).
- EJS para las vistas.
- `pg` para conectarse a PostgreSQL.
- `bcrypt`, `cookie-parser`, `multer`.

---

## Estructura

```
backend/
├── Dockerfile
├── package.json
├── uploads/                # Imágenes servidas en /uploads
└── src/
    ├── server.js           # Express en el puerto 3000
    ├── database/database.js# Pool de pg (DB_HOST=bbdd)
    ├── middlewares/
    │   ├── auth.js         # isAuth basado en cookie
    │   └── upload.js       # Multer
    ├── routers/            # main, auth, posts, likes, comments
    ├── Services/           # register/login, posts, likes, comments
    └── views/              # Plantillas EJS
```

---

## Configuración

`src/database/database.js`:

| Variable | Por defecto | Docker Compose |
| --- | --- | --- |
| `DB_USER` | `postgres` | `usuario` |
| `DB_PASSWORD` | `1234` | `123456` |
| `DB_NAME` | `postgres` | `monolito` |
| `DB_HOST` | `localhost` | `bbdd` |
| `DB_PORT` | `5432` | `5432` |

> `DB_HOST=bbdd` porque PostgreSQL está en el otro contenedor de la red `dos_capas_network`.

---

## Autenticación

No hay JWT. El registro y el login crean una cookie `httpOnly` `username` de 15 minutos:

```js
res.cookie('username', username, { maxAge: 900000, httpOnly: true });
```

`isAuth` solo comprueba que la cookie exista; si no está, redirige a `/auth/login`. Los servicios leen `req.cookies.username` para identificar al usuario.

Las rutas `GET /auth/login` y `GET /auth/register` están activas y renderizan sus vistas EJS.

---

## Rutas

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `GET` | `/` | — | Página de bienvenida. |
| `GET` | `/protected` | cookie | Ruta protegida de ejemplo. |
| `GET` | `/auth/register` | — | Formulario de registro. |
| `POST` | `/auth/register` | — | Registra usuario y pone la cookie. |
| `GET` | `/auth/login` | — | Formulario de login. |
| `POST` | `/auth/login` | — | Verifica la contraseña y pone la cookie. |
| `GET` | `/auth/logout` | — | Borra la cookie. |
| `GET` | `/posts/feed` | cookie | Renderiza el feed con likes y comentarios. |
| `GET` | `/posts/create-post` | cookie | Formulario para crear un post. |
| `POST` | `/posts/create-post` | cookie | Crea un post (`multipart/form-data`). |
| `GET` | `/posts/delete-post/:id` | cookie | Borra un post propio. |
| `GET` | `/likes/countLikes/:postId` | cookie | `{ likesCount }`. |
| `GET` | `/likes/verificarLike/:postId` | cookie | `{ hasLiked }`. |
| `GET` | `/likes/switchLike/:postId` | cookie | Alterna el like. |
| `GET` | `/comments/list/:postId` | cookie | Lista de comentarios. |
| `POST` | `/comments/create/:postId` | cookie | Crea un comentario. |
| `GET` | `/comments/delete/:commentId` | cookie | Borra un comentario propio (es `GET`, no `DELETE`). |

---

## Arranque y scripts

Desde la raíz de `2_dos_capas`:

```bash
docker compose up --build -d
```

Solo el backend:

```bash
cd backend
npm install
npm start     # node src/server.js
npm run dev   # nodemon
```

> El contenedor no monta el código como volumen: tras cambiar archivos hay que reconstruir con `docker compose up -d --build backend`.

---

## Cómo comprobar que funciona

### 1. Que arranque y conecte con la BD

```bash
docker logs backend --tail 30
```

Resultado esperado: `Example app listening on port http://localhost:3000`. Si PostgreSQL no está listo, aparecerá `ECONNREFUSED bbdd`.

### 2. Que el servidor responde

Abre <http://localhost:3000>. Comprueba también:

| URL | Resultado esperado |
| --- | --- |
| `/auth/register` | Formulario de registro. |
| `/auth/login` | Formulario de login. |
| `/protected` sin cookie | Redirige a `/auth/login`. |

### 3. Prueba completa (PowerShell)

```powershell
$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$user = 'testdos' + (Get-Random -Maximum 9999)
$body = @{ username=$user; email="$user@test.com"; password='123456' }
Invoke-WebRequest -Uri http://localhost:3000/auth/register -Method Post -Body $body -WebSession $s -UseBasicParsing
Invoke-WebRequest -Uri http://localhost:3000/auth/login -Method Post -Body @{ username=$user; password='123456' } -WebSession $s -UseBasicParsing
$feed = Invoke-WebRequest -Uri http://localhost:3000/posts/feed -WebSession $s -UseBasicParsing
$feed.StatusCode
```

Resultado esperado: 200 en las tres peticiones y HTML del feed.

Para probar likes y comentarios necesitas un post; créalo en `/posts/create-post` desde el navegador y luego:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/likes/switchLike/1 -WebSession $s
Invoke-RestMethod -Uri http://localhost:3000/comments/create/1 -Method Post -WebSession $s -ContentType 'application/json' -Body '{"comment":"Hola desde PowerShell"}'
Invoke-RestMethod -Uri http://localhost:3000/comments/list/1 -WebSession $s
```

Resultado esperado: el like alterna `hasLiked` y el comentario aparece en la lista.

### 4. Verificar que se escribió en la BD

```bash
docker exec bbdd psql -U usuario -d monolito -c "SELECT id, username FROM users;"
docker exec bbdd psql -U usuario -d monolito -c "SELECT * FROM comments;"
```

Más detalles en [bbdd/README.md](../bbdd/README.md).

---

## Limitaciones

- La cookie contiene solo el nombre de usuario y no está firmada: `isAuth` no valida su contenido.
- No hay CORS configurado: la API está pensada para consumirse desde las propias vistas EJS.
- No hay seed de datos: las tablas se crean vacías.
- `GET /comments/delete/:id` usa `GET` para una operación de borrado (no es REST idiomático).
- El código no se monta como volumen en Docker.
