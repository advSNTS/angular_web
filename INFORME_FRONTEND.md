# Informe — Frontend Angular (Editor multiempresa)

## Resumen

Se alineó el cliente en `angular_web/` con la API Spring Boot del proyecto (`proyecto_web`): modelos DTO, query `nitEmpresa`, JWT en cabecera `Authorization`, guards por rol, layout con empresa y navegación condicional, registro público de empresa, gestión de usuarios y roles funcionales, lista/detalle/editor de procesos con sincronización de nodos/actividades/gateways/arcos, pestañas de historial, compartición y mensajes.

## Componentes creados

| Ruta / uso | Componente |
|------------|------------|
| `/registro` | `RegistroEmpresaComponent` |
| Shell autenticado | `MainLayoutComponent` (nombre empresa, rol, menú, toast global) |
| `/admin/usuarios` | `UsuariosEmpresaComponent` |
| `/admin/pool` | `PoolAdminComponent` (solo lectura vía API actual) |
| `/roles-proceso` | `RolesProcesoPageComponent` |

## Componentes modificados

| Archivo | Cambios principales |
|---------|---------------------|
| `login.component.*` | Enlace a registro; redirección post-login a `/` (layout → procesos). |
| `lista-procesos.*` | Datos reales de API; filtros categoría/estado; acciones Ver/Editar/Eliminar según rol. |
| `editor-proceso.*` | Estado `BORRADOR` / `PUBLICADO` / `INACTIVO`; nodos temporales negativos; creación de `Nodo` vía API antes de actividad/gateway; arcos con `nitEmpresa`. |
| `detalle-proceso.*` | Pestañas Flujo, Diagrama, Historial, Compartir (admin), Mensajes (throw/catch/integración). |
| `dashboard.component.ts` | Cierre de sesión hacia `/login`. |
| `app.routes.ts` | Rutas públicas `login`/`registro`; layout protegido; `roleGuard` en rutas sensibles. |
| `auth.service.ts` | JWT: roles desde claims; helper `getNitEmpresa`; login por `buildApiPath('/empleados/login')`. |

## Servicios

| Servicio | Endpoints base (`buildApiPath`) |
|----------|----------------------------------|
| `AuthService` | `POST /empleados/login` |
| `EmpresaService` | `/empresas` |
| `EmpleadoEmpresaService` | `/empleados` |
| `ProcesoService` | `/procesos` (+ historial, compartir) |
| `NodoService` | `/nodos` |
| `ActividadService` | `/actividades` |
| `GatewayService` | `/gateways` |
| `ArcoService` | `/arcos` |
| `PoolService` | `/pools` |
| `LaneService` | `/lanes` |
| `RolProcesoService` | `/roles-proceso` |
| `RolXEmpleadoService` | `/rol-empleado` |
| `MensajeThrowService` | `/mensajes-throw` |
| `MensajeCatchService` | `/mensajes-catch` |
| `MensajeExternoService` | `/mensajes-externos` |
| `TareaIntegracionService` | `/tareas-integracion` |
| `NotificationService` | Toasts en memoria (consumido por `MainLayoutComponent`) |

## Rutas y guards

- **`authGuard`**: sesión requerida para el layout principal; redirección a `/login`.
- **`roleGuard(['ADMIN','EDITOR'])`**: crear/editar proceso, roles de proceso.
- **`roleGuard(['ADMIN'])`**: usuarios de empresa, pool, compartición (detalle comprueba además `esAdministradorEmpresa`).

Rutas públicas: `/login`, `/registro`. Área autenticada bajo `''` + `MainLayout`: `/procesos`, `/procesos/nuevo`, `/procesos/:id/detalle`, `/procesos/:id/editar`, `/roles-proceso`, `/admin/usuarios`, `/admin/pool`, `/dashboard`.

## Entorno y proxy

- Desarrollo: `environment.apiUrl = '/api'`; `proxy.conf.json` reescribe `/api` → backend.
- Auth y REST usan `buildApiPath()` para prefijo `/api` en dev y `environment.apiUrl + ruta` en producción.
- Login corregido a **`/api/empleados/login`** (antes `/empleados/login` no pasaba por el proxy).

## Interceptor

- `authInterceptor`: añade `Authorization: Bearer <token>` si la sesión tiene JWT.

## Roles de sistema

- Derivados del JWT (`authorities` → `ROLE_ADMIN`, etc.), no vienen en el JSON de login.
- **Cambio de rol de sistema** (ADMIN/EDITOR/READER): no hay endpoints REST en el backend revisado; la UI documenta que los nuevos usuarios quedan como **READER** por defecto (`EmpleadoService.crearEmpleado`).

## Pendientes / limitaciones

1. **Pool**: `PoolController` solo expone GET; la pantalla administra información en solo lectura hasta existir `PUT`.
2. **Diagrama**: vista simplificada en secuencia (sin librería gráfica ni persistencia avanzada de coordenadas); lanes mostrados como fichas, sin drag-and-drop real sobre canvas.
3. **Posiciones de nodos**: el backend admite `coordenadaX/Y`; el editor no las envía aún (layout automático implícito).
4. **`ng test`**: el proyecto usa Vitest sin navegador instalado para pruebas e2e del runner; el spec existente `estudiantes.service.spec.ts` no fue eliminado.
5. **Capturas de pantalla**: no incluidas en este informe (entorno local).

## Verificación

- `ng build --configuration development`: correcto.
- `ng serve`: servidor local en `http://127.0.0.1:<puerto>/front` (según consola).
