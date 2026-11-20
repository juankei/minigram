# Minigram

Minigram es una red social de fotos inspirada en Instagram, evolucionada en cuatro arquitecturas.

**Repositorio:** <https://github.com/juankei/minigram>

## Carpetas

| Carpeta | Arquitectura | Base de datos | Documentación |
|---|---|---|---|
| [`0_monolito-sqlite/`](0_monolito-sqlite/) | Monolito Node.js + Express, vistas EJS | SQLite (fichero local) | [README](0_monolito-sqlite/README.md) |
| [`1_monolito-postgres/`](1_monolito-postgres/) | Monolito Node.js + Express, vistas EJS | PostgreSQL dentro del mismo contenedor | [README](1_monolito-postgres/README.md) |
| [`2_dos_capas/`](2_dos_capas/) | Aplicación y base de datos en contenedores separados | PostgreSQL en contenedor propio | [README](2_dos_capas/README.md) |
| [`3_tres_capas/`](3_tres_capas/) | SPA Angular + API Express + PostgreSQL | PostgreSQL en contenedor propio | [README](3_tres_capas/README.md) |

Cada carpeta tiene su propio `docker-compose.yml`. Las fases 0, 1 y 2 se abren en <http://localhost:3000>. En la fase 3 el frontend está en <http://localhost:4200> y la API en <http://localhost:3000>.

## Puesta en marcha

Basta con clonar, entrar en la carpeta de la fase y ejecutar estos dos comandos:

```bash
git clone https://github.com/juankei/minigram.git
cd minigram/3_tres_capas        # o 0_monolito-sqlite, 1_monolito-postgres, 2_dos_capas
docker compose build
docker compose up -d
```

Para parar: `docker compose down` dentro de la carpeta de la fase.

## Funcionalidades

Registro e inicio de sesión, feed de publicaciones, crear y eliminar los propios posts, dar y quitar likes, y crear y eliminar comentarios. La fase 3 usa JWT; las anteriores usan una cookie de sesión.

## Cómo iniciar sesión

**Se entra con el nombre de usuario, no con el correo.** El correo solo se pide al registrarse.

| Fase | Cómo entrar |
|---|---|
| 3 capas | Abre <http://localhost:4200>, pulsa **Login** y usa `ana`, `carlos`, `lucia` o `miguel` con contraseña `123456`. Para crear otro, pulsa **Register** en la SPA y entra después con ese `username`. |
| 0, 1 y 2 | Regístrate en <http://localhost:3000/auth/register> con un `username`, un `email` y una contraseña; luego entra en <http://localhost:3000/auth/login> con ese `username` y esa contraseña. |

En la fase 3, el registro se hace desde la propia SPA pulsando **Register**; al terminar vuelve al login para que la SPA guarde el token JWT (el registro por sí solo no lo genera). El backend mantiene además su formulario EJS en `/auth/register`.
