# Minigram

Minigram es una red social de fotos inspirada en Instagram, construida con una arquitectura de **tres capas**:

- **Frontend**: SPA en Angular 19 con Angular Material.
- **Backend**: API REST en Node.js + Express 5 (también incluye algunas vistas EJS).
- **Base de datos**: PostgreSQL 18.

Los usuarios pueden iniciar sesión, ver un feed de publicaciones con imagen y descripción, dar "me gusta" y comentar las publicaciones.

**Documentación por capa:** [Frontend](fronted/README.md) · [Backend](backend/README.md) · [Base de datos](bbdd/README.md)

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

---

## Cómo iniciar sesión

El login se hace **con el nombre de usuario, no con el correo**.

| Usuario | Contraseña |
|---|---|
| `ana` | `123456` |
| `carlos` | `123456` |
| `lucia` | `123456` |
| `miguel` | `123456` |

1. Abre <http://localhost:4200> y pulsa **Login** en la barra superior.
2. Escribe el usuario (por ejemplo `ana`) y la contraseña `123456`.
3. Para crear otro usuario, pulsa **Register** en la barra superior o en el login: el formulario de registro está dentro de la SPA y pide `username`, `email` y `password`. Al terminar vuelve al login y entras con ese `username`.

> El `email` del registro **no sirve para entrar**. El campo de usuario del login espera siempre el `username`.

---

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

- **Usuarios del seed con contraseña de prueba**: `ana`, `carlos`, `lucia` y `miguel` tienen la contraseña **`123456`** (hash bcrypt real en `bbdd/seed.sql`). Puedes entrar con ellos directamente o registrar un usuario nuevo desde **Register** en la SPA.

- **Autenticación**: el middleware `isAuth` valida el JWT; las rutas de posts, likes y comentarios obtienen el usuario del token. La cookie `username` se mantiene solo como respaldo para las vistas EJS.
- **Secreto JWT en código**: el secreto está definido como `patata` en `backend/src/middlewares/auth.js`. En un entorno real debería moverse a una variable de entorno.
- **Registro en la SPA**: la vista `/register` llama a `POST /auth/register` y vuelve al login para obtener el JWT. El backend conserva su formulario EJS en `/auth/register`.
- **Sin volumen persistente para PostgreSQL**: al eliminar el contenedor se pierden los datos.
- **Flag de build obsoleto**: el `Dockerfile` del frontend usa `npm run build --prod`; en Angular 19 lo recomendado es `npm run build -- --configuration production`.
- **Nombre de la carpeta `fronted`**: es un typo mantenido en las rutas del `Dockerfile`, `docker-compose.yml` y la configuración del proyecto.

---

## Posibles mejoras

- Unificar la autenticación (solo JWT o solo cookies) y mover el secreto a `.env`.
- Mostrar los errores de los likes en la interfaz, no solo en la consola.
- Añadir un volumen de Docker para PostgreSQL.
- Incorporar validaciones de entrada y manejo de errores centralizado.
- Añadir tests para los endpoints principales.

---

## Cómo comprobar que funciona (capa por capa)

Hay un README específico para cada capa con los pasos detallados. Esta es una guía rápida.

### 1. Base de datos

```bash
docker ps --format "{{.Names}} {{.Status}}"
docker exec bbdd psql -U usuario -d monolito -c "\dt"
docker exec bbdd psql -U usuario -d monolito -c "SELECT (SELECT COUNT(*) FROM users) AS usuarios, (SELECT COUNT(*) FROM posts) AS posts, (SELECT COUNT(*) FROM comments) AS comentarios, (SELECT COUNT(*) FROM likes) AS likes;"
```

Esperado: contenedor `bbdd` arrancado, tablas `users`, `posts`, `comments` y `likes`, y datos de ejemplo (4/4/4/5 en una BD recién creada).

Detalles: [bbdd/README.md](bbdd/README.md)

### 2. Backend

```bash
cd backend
node --check src/server.js
npm start
```

Después, registrar un usuario y hacer login:

```powershell
$body = @{ username='prueba'; email='prueba@test.com'; password='123456' } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/auth/register -Method Post -ContentType 'application/json' -Body $body
$login = Invoke-RestMethod -Uri http://localhost:3000/auth/login -Method Post -ContentType 'application/json' -Body $body
$token = $login.token
$h = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri http://localhost:3000/posts/feed -Headers $h
Invoke-RestMethod -Uri http://localhost:3000/likes/switchLike/1 -Headers $h
```

Esperado: login devuelve `{ success: true, token }`, el feed devuelve `posts` y el like alterna entre `{"hasLiked":true,...}` y `{"hasLiked":false,...}`. Sin token, `/posts/feed` debe dar 401.

Detalles: [backend/README.md](backend/README.md)

### 3. Frontend

```bash
cd fronted
npm run build
npm start
```

Abre <http://localhost:4200>, entra con el usuario creado y comprueba en el navegador:

| Acción | Resultado esperado |
| --- | --- |
| Login | Navega a `/home`; en Network, `/auth/login` y `/posts/feed` dan 200. |
| Feed | Aparecen las publicaciones con imagen y comentarios. |
| Corazón | Cambia a rojo y el contador sube/baja. |
| Avión (`send`) | Publica el comentario. |
| Papelera (`delete`) | Borra solo los comentarios propios. |

Esperado: `npm run build` termina sin errores y no hay 401 en la consola.

Detalles: [fronted/README.md](fronted/README.md)

### 4. Prueba de extremo a extremo

1. Registrar usuario → se inserta en `users` (comprobar con `psql`).
2. Login en Angular → `localStorage.token` queda guardado.
3. Feed → el backend consulta PostgreSQL y devuelve los posts.
4. Like → se inserta/borra una fila en `likes` y el corazón cambia.
5. Comentario → se inserta en `comments` y aparece en pantalla; borrarlo elimina la fila.

Si algo falla, revisa los logs en orden: `docker logs frontend`, `docker logs backend`, `docker logs bbdd`.

