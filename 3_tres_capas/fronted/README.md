# Capa de presentación — Frontend (Angular 19)

Este directorio contiene la **interfaz de usuario** de [Minigram](../README.md). Es una SPA de Angular que se encarga de:

- Mostrar el formulario de login.
- Pedir el feed de publicaciones al backend.
- Pintar cada publicación con imagen, autor, descripción, likes y comentarios.
- Permitir dar/quitar "me gusta" y publicar/borrar comentarios.

La carpeta se llama `fronted` (sin la "t") por un typo que se ha mantenido en `docker-compose.yml` y en el `Dockerfile`.

---

## Tecnologías

- Angular 19 (standalone components, signals, router).
- Angular Material 19 (botones, tarjetas, iconos, formularios).
- TypeScript 5.7 y RxJS 7.8.

---

## Estructura

```
fronted/
├── Dockerfile                 # Build + http-server en el puerto 4200
├── angular.json
├── package.json
└── src/
    ├── index.html             # Fuentes: Roboto y Material Icons
    └── app/
        ├── app.component.*    # Componente raíz (router-outlet)
        ├── app.config.ts      # provideRouter + provideHttpClient
        ├── app.routes.ts      # /login, /home y redirecciones
        ├── pages/
        │   ├── login/         # Formulario de acceso
        │   └── home/          # Lista de publicaciones
        ├── components/
        │   ├── post/          # Tarjeta de publicación + botón de like
        │   └── comments/      # Lista de comentarios + formulario
        └── services/
            └── rest-api.service.service.ts   # Todas las llamadas HTTP
```

---

## Rutas de la SPA

Definidas en `src/app/app.routes.ts`:

| Ruta | Vista | Descripción |
| --- | --- | --- |
| `/login` | `LoginComponent` | Formulario de usuario y contraseña. Es la ruta por defecto. |
| `/register` | `RegisterComponent` | Formulario de registro dentro de la SPA. |
| `/home` | `HomeComponent` | Feed con las publicaciones. |
| `/crear-post` | `CreatePostComponent` | Formulario para publicar una imagen. |
| `''` | redirect | Redirige a `/login`. |
| `**` | redirect | Cualquier ruta desconocida vuelve a `/login`. |

---

## Comunicación con el backend

La URL de la API está escrita a mano en `src/app/services/rest-api.service.service.ts`:

```ts
private apiUrl = 'http://localhost:3000';
```

Métodos disponibles en el servicio:

| Método del servicio | Petición HTTP | Uso |
| --- | --- | --- |
| `login(username, password)` | `POST /auth/login` | Guarda el JWT en `localStorage`. |
| `register(username, email, password)` | `POST /auth/register` | Crea un usuario y vuelve al login. |
| `listPosts()` | `GET /posts/feed` | Carga las publicaciones. |
| `getComments(postId)` | `GET /comments/list/:postId` | Carga los comentarios de un post. |
| `createComment(postId, comment)` | `POST /comments/create/:postId` | Publica un comentario. |
| `deleteComment(commentId)` | `DELETE /comments/delete/:commentId` | Borra un comentario propio. |
| `switchLike(postId)` | `GET /likes/switchLike/:postId` | Alterna el like y devuelve el contador. |
| `createPost(caption, image)` | `POST /posts/create-post` | Publica una imagen con JWT. |
| `deletePost(postId)` | `GET /posts/delete-post/:id` | Borra un post propio. |
| `logout()` | — | Borra `token` y `username` de `localStorage`. |

### Autenticación

Tras un login correcto se guardan dos claves en el navegador:

```js
localStorage.setItem('token', data.token);
localStorage.setItem('username', username);
```

Todas las peticiones posteriores envían la cabecera:

```
Authorization: Bearer <token>
```

Al recargar la página, el estado `isloggedIn` se recupera comprobando si existe `localStorage.token`.

---

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm start` | Servidor de desarrollo en `http://localhost:4200`. |
| `npm run build` | Compila en `dist/fronted/browser/`. |
| `npm run watch` | Compila en modo desarrollo y vigila cambios. |
| `npm test` | Tests unitarios con Karma/Jasmine. |

En Docker, el `Dockerfile` ejecuta `npm run build --prod` y sirve `dist/fronted/browser` con `http-server`. En Angular 19 la forma recomendada sería `npm run build -- --configuration production`.

---

## Arranque

Con Docker, desde la raíz del proyecto:

```bash
docker compose up --build frontend
```

Sin Docker:

```bash
cd fronted
npm install
npm start
```

> El backend debe estar levantado en `http://localhost:3000`, si no las peticiones darán error de conexión.

---

## Cómo comprobar que esta capa funciona

### 1. Que compile

```bash
cd fronted
npm run build
```

Resultado esperado: termina con ✔ y sin errores de TypeScript.

### 2. Que arranque

Abre <http://localhost:4200>. Debes ver la pantalla de login con los campos de usuario y contraseña en una sola fila.

### 3. Prueba funcional en el navegador

Usa un usuario del `seed.sql`: **`ana`**, **`carlos`**, **`lucia`** o **`miguel`**, todos con contraseña **`123456`**. El login es con el **usuario**, no con el correo. Para crear otro, pulsa **Register** en la SPA y entra después con ese `username`.

| Acción | Resultado esperado |
| --- | --- |
| Introducir usuario/contraseña y pulsar Login | Navega a `/home`. En DevTools → Network, `POST /auth/login` da **200** y `GET /posts/feed` da **200**. |
| Mirar `localStorage` en DevTools → Application | Aparecen `token` y `username`. |
| Observar el feed | Se ven las publicaciones con imagen, autor, descripción, corazón y comentarios. |
| Pulsar el corazón | Pasa de `favorite_border` a `favorite` (rojo) y el contador sube 1. Otra pulsación lo baja. Network: `GET /likes/switchLike/:id` → 200. |
| Escribir un comentario y pulsar el avión (`send`) | El comentario aparece en la lista con el avatar del usuario. Network: `POST /comments/create/:id` → 200/201. |
| Pulsar la papelera (`delete`) en un comentario propio | El comentario desaparece. Network: `DELETE /comments/delete/:id` → 200. La papelera solo aparece en los comentarios propios. |

### 4. Si algo falla

| Síntoma | Causa probable |
| --- | --- |
| `401 Unauthorized` en el feed o en los likes | No hay token, caducó (1 hora) o no se envió la cabecera. Vuelve a hacer login. |
| Error de conexión / `ERR_CONNECTION_REFUSED` | El backend no está levantado en `:3000`. |
| Los iconos salen como texto (`send`, `delete`, `favorite`) | Falta la hoja de `Material Icons` en `src/index.html`. |
| `Cannot GET /auth/login` | Estás abriendo la URL del backend en el navegador. Entra por <http://localhost:4200> y pulsa **Login** en el menú. |
| `404` de `com.chrome.devtools.json` | Ruido de Chrome DevTools en `localhost`, no afecta a la app. |

---

## Limitaciones

- El registro se hace en la SPA (`/register`); al terminar vuelve a `/login`. El backend sigue teniendo su formulario EJS en `/auth/register` para quien lo abra directamente.
- La URL del backend está fijada en el código; para otro entorno habría que usar una variable de configuración.
- No hay guardas de ruta: `/home` es accesible aunque no haya token, aunque las peticiones fallarán con 401.
