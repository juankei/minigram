# Minigram — Dos capas

Versión **2** de Minigram: la interfaz y la lógica siguen juntas en una aplicación Express con vistas EJS, pero la **base de datos se separa en otro servidor** (PostgreSQL en su propio contenedor). Por eso se considera una arquitectura de **dos capas**:

```
┌─────────────────────────────┐
│ Cliente (navegador)         │
└──────────────┬──────────────┘
               │ HTTP (HTML + JSON, cookie)
┌──────────────▼──────────────┐
│ Capa aplicación + presentación │  backend/  →  http://localhost:3000
│ Express 5 + vistas EJS         │
└──────────────┬──────────────┘
               │ SQL (pg Pool)
┌──────────────▼──────────────┐
│ Capa datos: PostgreSQL       │  bbdd/  →  puerto 5432 (red interna)
└─────────────────────────────┘
```

Es el paso intermedio entre [1_monolito-postgres](../1_monolito-postgres/) (todo en un contenedor) y [3_tres_capas](../3_tres_capas/) (SPA Angular + API + PostgreSQL).

**Documentación por capa:** [Backend](backend/README.md) · [Base de datos](bbdd/README.md)

---

## Tecnologías

| Capa | Tecnologías |
| --- | --- |
| Aplicación + presentación | Node.js 24, Express 5, EJS, `cookie-parser`, `bcrypt`, `multer` |
| Datos | PostgreSQL 18, `pg` |
| Infraestructura | Docker, Docker Compose |

---

## Estructura

```
2_dos_capas/
├── docker-compose.yml     # Servicios backend y bbdd
├── backend/               # Aplicación Express + vistas EJS
│   ├── Dockerfile
│   ├── package.json
│   ├── uploads/
│   └── src/
│       ├── server.js
│       ├── database/
│       ├── middlewares/
│       ├── routers/
│       ├── Services/
│       └── views/
└── bbdd/                  # Solo schema.sql (sin seed)
```

---

## Puesta en marcha

Desde la raíz de esta carpeta:

```bash
docker compose up --build -d
```

| Servicio | URL / puerto |
| --- | --- |
| Aplicación | <http://localhost:3000> |
| PostgreSQL | `bbdd:5432` (solo en la red de Docker) |

Credenciales de la BD:

| Variable | Valor |
| --- | --- |
| `POSTGRES_USER` | `usuario` |
| `POSTGRES_PASSWORD` | `123456` |
| `POSTGRES_DB` | `monolito` |

Para parar:

```bash
docker compose down
```

Para borrar también los datos:

```bash
docker compose down -v
```

---

## Autenticación

No hay JWT: registro y login guardan una cookie `httpOnly` con el nombre de usuario (`username`, 15 minutos). `isAuth` comprueba únicamente que la cookie exista. En el navegador están disponibles `GET /auth/login` y `GET /auth/register`.

---

## Cómo comprobar que funciona (capa por capa)

### 1. Base de datos

```bash
docker ps --format "{{.Names}} {{.Status}}"
docker exec bbdd psql -U usuario -d monolito -c "\dt"
docker exec bbdd psql -U usuario -d monolito -c "SELECT COUNT(*) FROM users;"
```

✅ Esperado: `bbdd` arrancado, cuatro tablas y `0` usuarios al principio (no hay seed).

👉 Detalles: [bbdd/README.md](bbdd/README.md)

### 2. Backend

```bash
docker logs backend --tail 30
```

✅ Esperado: `Example app listening on port http://localhost:3000`.

Comprueba en el navegador que `/` muestra la bienvenida y que `/protected` redirige al login si no hay cookie.

Prueba de registro + login + feed con PowerShell:

```powershell
$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$user = 'test2capas' + (Get-Random -Maximum 9999)
$body = @{ username=$user; email="$user@test.com"; password='123456' }
Invoke-WebRequest -Uri http://localhost:3000/auth/register -Method Post -Body $body -WebSession $s -UseBasicParsing
Invoke-WebRequest -Uri http://localhost:3000/auth/login -Method Post -Body @{ username=$user; password='123456' } -WebSession $s -UseBasicParsing
Invoke-WebRequest -Uri http://localhost:3000/posts/feed -WebSession $s -UseBasicParsing
Invoke-RestMethod -Uri http://localhost:3000/likes/switchLike/1 -WebSession $s
```

✅ Esperado: 200 en las tres peticiones y el like alterna `hasLiked`. Para el like necesitas crear antes un post desde `/posts/create-post`.

👉 Detalles: [backend/README.md](backend/README.md)

### 3. Prueba de extremo a extremo

1. Registrar usuario → aparece en `SELECT * FROM users` dentro de `bbdd`.
2. Login → se crea la cookie `username`.
3. `/posts/feed` → el backend consulta PostgreSQL y renderiza el feed.
4. `GET /likes/switchLike/:id` → se inserta/borra una fila en `likes`.
5. `POST /comments/create/:id` → se inserta en `comments` y aparece al recargar el feed.

Si algo falla, revisa los logs en este orden: `docker logs backend`, `docker logs bbdd`.

---

## Limitaciones

- La "presentación" son plantillas EJS dentro del backend: no hay SPA separada.
- Autenticación por cookie sin firmar; `isAuth` no valida el contenido.
- No hay datos de ejemplo.
- El backend no monta el código como volumen: los cambios requieren reconstruir la imagen.
- PostgreSQL no tiene volumen persistente.
- `GET /comments/delete/:id` usa `GET` para borrar.
