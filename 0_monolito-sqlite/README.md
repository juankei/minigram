# Minigram — Monolito con SQLite

Versión **0**: toda la aplicación (interfaz, lógica y datos) vive en **un solo proceso**. No hay servidor de base de datos externo: los datos se guardan en el fichero `minigram.db` con SQLite.

Es el punto de partida de la evolución del proyecto:

| Versión | Arquitectura | Base de datos |
| --- | --- | --- |
| [0_monolito-sqlite](../0_monolito-sqlite/) | Monolito | SQLite (fichero local) |
| [1_monolito-postgres](../1_monolito-postgres/) | Monolito | PostgreSQL dentro del mismo contenedor |
| [2_dos_capas](../2_dos_capas/) | Dos capas | PostgreSQL en contenedor aparte |
| [3_tres_capas](../3_tres_capas/) | Tres capas | PostgreSQL + SPA Angular |

---

## Tecnologías

- Node.js 24 y Express 5 (ES modules).
- `better-sqlite3` (SQLite síncrono).
- EJS para las vistas, `cookie-parser`, `bcrypt`, `multer`.

---

## Estructura

```
0_monolito-sqlite/
├── docker-compose.yml      # Usa la imagen preconstruida monolito:1
├── Dockerfile              # node:24 + npm ci
├── minigram.db             # Base de datos SQLite
├── minigram.db-wal / -shm  # Archivos auxiliares del modo WAL
├── uploads/                # Imágenes subidas
├── package.json
└── src/
    ├── server.js           # Express: middlewares, routers y puerto 3000
    ├── database/
    │   ├── database.js     # new Database('minigram.db')
    │   ├── schema.sql      # CREATE TABLE IF NOT EXISTS
    │   └── init.js         # Ejecuta schema.sql (npm run db-init)
    ├── middlewares/
    │   ├── auth.js         # isAuth basado en cookie
    │   └── upload.js       # Multer
    ├── routers/            # main, auth, posts, likes, comments
    ├── Services/           # Lógica de negocio
    └── views/              # Plantillas EJS
```

---

## Modelo de datos

```
users ──< posts ──< comments
  │        └──────< likes
  └───────────────< comments / likes
```

`likes` tiene clave primaria `(post_id, user_id)`, así que un usuario solo puede dar un like por publicación. Las claves foráneas usan `ON DELETE CASCADE` (excepto en `likes`, donde la referencia no especifica cascada).

---

## Autenticación

No hay JWT. El login y el registro ponen una cookie `httpOnly` llamada `username` con 15 minutos de validez:

```js
res.cookie('username', username, { maxAge: 900000, httpOnly: true });
```

`isAuth` solo comprueba que esa cookie exista; si no está, redirige a `/auth/login`. El resto de servicios leen `req.cookies.username` para saber quién actúa.

Hay rutas `GET /login` y `GET /register` que renderizan las vistas EJS (a diferencia de la versión de tres capas, donde `GET /login` está comentado).

---

## Puesta en marcha

### En local

```bash
npm install
npm run db-init
npm start
```

Abre <http://localhost:3000>.

> `database.js` abre `minigram.db` relativo al directorio de trabajo, así que hay que ejecutar los comandos desde la raíz de esta carpeta.

### Con Docker

El `docker-compose.yml` usa `image: monolito:1` (no construye la imagen). Si quieres usar tu código, constrúyela antes:

```bash
docker build -t monolito:1 .
docker compose up -d
```

### Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Arranca con nodemon. |
| `npm start` | Arranca con nodemon (`nodemon src/server.js`). |
| `npm run db-init` | Crea las tablas si no existen. |

---

## Cómo comprobar que funciona

### 1. Que el código y la BD son válidos

```bash
node --check src/server.js
node --check src/Services/auth.services.js
npm run db-init
```

Resultado esperado: sin errores de sintaxis y el mensaje `base de datos iniciada correctamnete` (tal cual, con el typo del código).

### 2. Que las tablas y los datos existen

```powershell
node -e "const D=require('better-sqlite3'); const db=new D('minigram.db',{readonly:true}); console.log(db.prepare('SELECT name FROM sqlite_master WHERE type = ?').all('table'));"
node -e "const D=require('better-sqlite3'); const db=new D('minigram.db',{readonly:true}); for (const t of ['users','posts','comments','likes']) console.log(t, db.prepare('SELECT COUNT(*) n FROM '+t).get().n);"
```

Resultado esperado: las cuatro tablas (`users`, `posts`, `comments`, `likes`) y recuentos. En el fichero actual hay 11 usuarios, 4 posts, 6 comentarios y 4 likes; en una BD recién inicializada todos estarían a 0.

### 3. Que el servidor responde

```bash
npm start
```

Abre <http://localhost:3000>: debe aparecer "Bienvenido a Minigram". Comprueba también:

| URL | Resultado esperado |
| --- | --- |
| `/auth/register` | Formulario de registro. |
| `/auth/login` | Formulario de login. |
| `/protected` sin cookie | Redirige a `/auth/login`. |

### 4. Prueba completa con cookie (PowerShell)

```powershell
$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$user = 'testsqlite' + (Get-Random -Maximum 9999)
$body = @{ username=$user; email="$user@test.com"; password='123456' }
Invoke-WebRequest -Uri http://localhost:3000/auth/register -Method Post -Body $body -WebSession $s -UseBasicParsing
Invoke-WebRequest -Uri http://localhost:3000/auth/login -Method Post -Body @{ username=$user; password='123456' } -WebSession $s -UseBasicParsing
$feed = Invoke-WebRequest -Uri http://localhost:3000/posts/feed -WebSession $s -UseBasicParsing
$feed.StatusCode
Invoke-RestMethod -Uri http://localhost:3000/likes/switchLike/1 -WebSession $s
```

Resultado esperado: registro y login dan 200, el feed carga HTML y el like devuelve `{"hasLiked":true,"newLikesCount":N}`; al repetirlo, `{"hasLiked":false,...}`.

Comprueba que se escribió en SQLite:

```powershell
node -e "const D=require('better-sqlite3'); const db=new D('minigram.db',{readonly:true}); console.log(db.prepare('SELECT username FROM users WHERE username LIKE ?').all('testsqlite%'));"
```

### 5. Si falla

| Síntoma | Causa probable |
| --- | --- |
| `SQLITE_CANTOPEN` | Estás ejecutando desde otra carpeta; `minigram.db` se busca en el directorio actual. |
| Redirección al login en `/posts/feed` | Falta la cookie; haz login primero con la misma sesión. |
| `401 {"error":"No autorizado"}` en el like | La cookie no se envió o el usuario no existe. |
| `Cannot GET /...` | Ruta inexistente o método equivocado (por ejemplo, `GET /comments/delete/:id` sí existe aquí, pero no en la versión de tres capas). |

---

## Limitaciones

- Todo está acoplado en un único proceso: no hay separación de capas.
- La sesión es solo una cookie con el nombre de usuario: cualquiera puede falsificarla y `isAuth` no valida su contenido.
- `minigram.db` está dentro del proyecto: si se borra, se pierden los datos. Con Docker, el `docker-compose.yml` no define volumen.
- `docker-compose.yml` usa una imagen preconstruida; los cambios de código requieren `docker build -t monolito:1 .`.
- En `schema.sql`, `likes` declara a la vez `PRIMARY KEY (post_id, user_id)` y `UNIQUE(post_id, user_id)`: es redundante.
