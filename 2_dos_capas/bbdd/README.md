# Base de datos — Minigram de dos capas

Esta carpeta contiene el `schema.sql` del servicio PostgreSQL de [2_dos_capas](../README.md). Es la **capa de datos**: corre en su propio contenedor (`bbdd`) y el backend se conecta a ella por la red interna de Docker.

---

## Archivos

| Archivo | Contenido |
| --- | --- |
| `schema.sql` | Crea las tablas `users`, `posts`, `comments` y `likes`. |

No hay `seed.sql`: la base de datos se crea **vacía**.

Docker monta el archivo en `/docker-entrypoint-initdb.d/schema.sql`, así que PostgreSQL lo ejecuta automáticamente la primera vez que se crea el contenedor.

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

- `username` y `email` son `UNIQUE`.
- `likes` tiene clave primaria `(post_id, user_id)`: un usuario solo puede dar un like por publicación.
- Las claves foráneas usan `ON DELETE CASCADE`.

---

## Configuración

Definida en `../docker-compose.yml`:

| Variable | Valor |
| --- | --- |
| `POSTGRES_USER` | `usuario` |
| `POSTGRES_PASSWORD` | `123456` |
| `POSTGRES_DB` | `monolito` |
| Imagen | `postgres:18.6-alpine3.24` |
| Red | `dos_capas_network` |

El backend llega con `DB_HOST=bbdd` y `DB_PORT=5432`. El puerto **no está publicado** en el host: solo se accede desde la red de Docker.

No hay volumen persistente: `docker compose down -v` borra los datos y vuelve a ejecutar el schema.

---

## Cómo conectarse

```bash
docker exec -it bbdd psql -U usuario -d monolito
```

O una consulta puntual:

```bash
docker exec bbdd psql -U usuario -d monolito -c "SELECT * FROM users;"
```

---

## Cómo comprobar que funciona

### 1. Que el contenedor está arrancado

```bash
docker ps --format "{{.Names}} {{.Status}}"
```

Debe aparecer `bbdd` como `Up`.

### 2. Que el schema se aplicó

```bash
docker exec bbdd psql -U usuario -d monolito -c "\dt"
```

Resultado esperado: `comments`, `likes`, `posts`, `users`.

### 3. Que está vacía al principio

```bash
docker exec bbdd psql -U usuario -d monolito -c "SELECT (SELECT COUNT(*) FROM users) AS usuarios, (SELECT COUNT(*) FROM posts) AS posts, (SELECT COUNT(*) FROM comments) AS comentarios, (SELECT COUNT(*) FROM likes) AS likes;"
```

Resultado esperado: `0 | 0 | 0 | 0` en una BD recién creada.

### 4. Que el backend escribe en esta BD

Registra un usuario desde la web (<http://localhost:3000/auth/register>) o con PowerShell:

```powershell
$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$user = 'testbbdd' + (Get-Random -Maximum 9999)
Invoke-WebRequest -Uri http://localhost:3000/auth/register -Method Post -Body @{ username=$user; email="$user@test.com"; password='123456' } -WebSession $s -UseBasicParsing
docker exec bbdd psql -U usuario -d monolito -c "SELECT id, username, email FROM users ORDER BY id;"
```

El usuario nuevo debe aparecer en la consulta.

### 5. Que las restricciones funcionan

Primero crea un post desde `/posts/create-post` en el navegador. Después:

```bash
docker exec bbdd psql -U usuario -d monolito -c "SELECT id, caption FROM posts;"
docker exec bbdd psql -U usuario -d monolito -c "SELECT * FROM likes;"
```

Tras dar like desde la web debe existir una fila en `likes` con ese `post_id` y el `user_id` del usuario logueado. Un segundo like del mismo usuario **no** añade otra fila: actualiza/elimina la existente porque la clave primaria impide duplicados.

### 6. Reiniciar desde cero

```bash
docker compose down -v
docker compose up --build -d
```

---

## Limitaciones

- No hay datos de ejemplo ni script de seed.
- No hay volumen persistente.
- `schema.sql` usa `CREATE TABLE IF NOT EXISTS`: no actualiza tablas que ya existan.
- Para probar desde el host hay que hacerlo con `docker exec`, porque el puerto 5432 no se publica.
