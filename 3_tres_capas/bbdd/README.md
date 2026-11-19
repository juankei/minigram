# Capa de datos — PostgreSQL

Este directorio define la **base de datos** de [Minigram](../README.md). Es la capa más baja: guarda usuarios, publicaciones, comentarios y likes. El backend se conecta a ella con `pg`.

---

## Archivos

| Archivo | Contenido |
| --- | --- |
| `schema.sql` | Crea las cuatro tablas si no existen. |
| `seed.sql` | Inserta usuarios, publicaciones, comentarios y likes de ejemplo. |

Docker los monta en `/docker-entrypoint-initdb.d/`, así que PostgreSQL los ejecuta automáticamente **la primera vez** que se crea el contenedor (directorio de datos vacío).

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

Detalles importantes:

- `users.username` y `users.email` son `UNIQUE`.
- `likes` tiene clave primaria compuesta `(post_id, user_id)`: un usuario solo puede dar **un** like por publicación.
- Todas las claves foráneas usan `ON DELETE CASCADE`: al borrar un usuario o un post se borran sus comentarios y likes.
- `avatar_filename` puede ser `NULL`; el frontend muestra la inicial del usuario en ese caso.

---

## Configuración en Docker

Definida en `docker-compose.yml`:

| Variable | Valor |
| --- | --- |
| `POSTGRES_USER` | `usuario` |
| `POSTGRES_PASSWORD` | `123456` |
| `POSTGRES_DB` | `monolito` |
| Imagen | `postgres:18.6-alpine3.24` |
| Red | `dos_capas_network` |

El puerto `5432` **no está publicado** en el host: solo es accesible desde los contenedores de la misma red. El backend llega con `DB_HOST=bbdd`.

> No hay volumen persistente: si haces `docker compose down -v`, se pierden los datos y el init vuelve a ejecutar los scripts.

---

## Cómo conectarse

Desde el host, usando el contenedor:

```bash
docker exec -it bbdd psql -U usuario -d monolito
```

O una consulta concreta sin entrar al prompt:

```bash
docker exec bbdd psql -U usuario -d monolito -c "SELECT * FROM users;"
```

---

## Cómo comprobar que esta capa funciona

### 1. Que el contenedor esté levantado

```bash
docker ps --format "{{.Names}} {{.Status}}"
```

Debe aparecer `bbdd` con estado `Up`.

### 2. Que las tablas existan

```bash
docker exec bbdd psql -U usuario -d monolito -c "\dt"
```

Resultado esperado: `comments`, `likes`, `posts`, `users`.

### 3. Que los scripts se ejecutaron (datos de ejemplo)

```bash
docker exec bbdd psql -U usuario -d monolito -c "SELECT (SELECT COUNT(*) FROM users) AS usuarios, (SELECT COUNT(*) FROM posts) AS posts, (SELECT COUNT(*) FROM comments) AS comentarios, (SELECT COUNT(*) FROM likes) AS likes;"
```

Resultado esperado en una BD recién creada:

| usuarios | posts | comentarios | likes |
| --- | --- | --- | --- |
| 4 | 4 | 4 | 5 |

Puede haber más usuarios si has registrado algunos desde la API.

### 4. Que la integridad funciona

Consultar los likes del post 1:

```bash
docker exec bbdd psql -U usuario -d monolito -c "SELECT p.caption, COUNT(l.user_id) AS likes FROM posts p LEFT JOIN likes l ON l.post_id = p.id GROUP BY p.id, p.caption ORDER BY p.id;"
```

Comprobar que no se puede duplicar un like:

```bash
docker exec bbdd psql -U usuario -d monolito -c "INSERT INTO likes (post_id, user_id) VALUES (1, 2);"
```

Debe fallar con `duplicate key value violates unique constraint "likes_pkey"` (si ese par ya existe). Eso confirma que la restricción está activa.

Comprobar el borrado en cascada (en una copia de la BD, no en la real):

```bash
docker exec bbdd psql -U usuario -d monolito -c "BEGIN; DELETE FROM posts WHERE id = 1; SELECT COUNT(*) FROM comments WHERE post_id = 1; ROLLBACK;"
```

El `COUNT` debe ser `0`. El `ROLLBACK` deshace el cambio.

### 5. Que el backend realmente la usa

Desde la raíz del proyecto:

```powershell
$body = @{ username='prueba2'; email='prueba2@test.com'; password='123456' } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/auth/register -Method Post -ContentType 'application/json' -Body $body
docker exec bbdd psql -U usuario -d monolito -c "SELECT id, username, email FROM users ORDER BY id;"
```

El nuevo usuario debe aparecer en la consulta. Eso demuestra que el backend escribe en esta base de datos.

---

## Reiniciar los datos desde cero

```bash
docker compose down -v
docker compose up --build
```

Se recrea el contenedor, se vuelven a ejecutar `schema.sql` y `seed.sql` y se pierden todos los datos anteriores.

---

## Limitaciones conocidas

- Los hashes del `seed.sql` (`$2b$10$HASH_ANA`, etc.) son marcadores de posición, no contraseñas reales. `seed.sql` además los sobreescribe al final con `$2b$10$TU_HASH_GENERADO`. Para poder entrar con esos usuarios hay que generar un hash real:

  ```bash
  cd backend
  node -e "const b=require('bcrypt'); b.hash('123456',10).then(console.log)"
  ```

  Y sustituir el valor en `UPDATE users SET password = ...`.

- El contenedor no tiene volumen persistente.
- No hay migraciones: `schema.sql` usa `CREATE TABLE IF NOT EXISTS` y no actualiza tablas ya existentes.
