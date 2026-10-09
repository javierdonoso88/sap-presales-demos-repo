# Arquitectura — SAP Presales Demo Repository

## Visión general

Aplicación interna desplegada en **SAP BTP Cloud Foundry** para gestionar el catálogo de demos del equipo de Presales Spain. Combina un servidor **Express + CAP (CDS)** con una **React SPA**, autenticación **XSUAA**, base de datos **HANA Cloud** y almacenamiento de ficheros en **SAP Object Store (S3)**.

---

## Diagrama de componentes

```
┌──────────────────────────────────────────────────────────────────────┐
│                        SAP BTP Cloud Foundry                         │
│                                                                      │
│   Navegador                                                          │
│      │                                                               │
│      │  HTTPS                                                        │
│      ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     App Router (approuter/)                  │    │
│  │              @sap/approuter v16 · 256 MB                     │    │
│  │                                                              │    │
│  │  xs-app.json: todas las rutas requieren xsuaa auth           │    │
│  │  → inicia OAuth2 PKCE con XSUAA si no hay sesión             │    │
│  │  → inyecta Bearer JWT y hace proxy a srv-api                 │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                             │ Bearer JWT                             │
│                             ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │             Servidor Express + CAP  (srv/)                    │   │
│  │                     Node.js ≥ 18 · 512 MB                     │   │
│  │                                                               │   │
│  │  authMiddleware ──── passport + @sap/xssec JWTStrategy        │   │
│  │       │                                                        │   │
│  │       ├── /api/*           → rutas Express personalizadas     │   │
│  │       │     demos, clients, dashboard, comments,              │   │
│  │       │     attachments, share, admin, me                     │   │
│  │       │                                                        │   │
│  │       ├── /api/systems     → CAP REST adapter (DemoService)   │   │
│  │       │                                                        │   │
│  │       └── /*               → React SPA (srv/public/)          │   │
│  │                                                                │   │
│  └──────────┬──────────────────────────────────────┬────────────┘   │
│             │ @sap/hana-client (pool 2–10)         │ @aws-sdk/s3     │
│             ▼                                       ▼                │
│  ┌────────────────────┐               ┌─────────────────────────┐   │
│  │    HANA Cloud      │               │   SAP Object Store      │   │
│  │   HDI Container    │               │   (S3-compatible)       │   │
│  │                    │               │                         │   │
│  │  SAP_PRESALES_     │               │  /attachments/          │   │
│  │  DEMOS_* tables    │               │  (PDF, Office, images)  │   │
│  └────────────────────┘               └─────────────────────────┘   │
│                                                                      │
│  ┌────────────────────┐                                             │
│  │       XSUAA        │  ← autenticación + autorización            │
│  │  (sap-presales-    │     OAuth2, JWT signing, roles             │
│  │   demos-auth)      │                                             │
│  └────────────────────┘                                             │
│                                                                      │
│  ┌────────────────────┐                                             │
│  │   HDI Deployer     │  ← one-shot al desplegar                   │
│  │   (gen/db/)        │     crea/migra tablas HANA                 │
│  └────────────────────┘                                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Flujo de autenticación

```
Navegador          App Router          XSUAA          Servidor Express
    │                   │                │                   │
    │── GET /demos ─────►                │                   │
    │                   │ (sin sesión)   │                   │
    │◄── redirect ──────│                │                   │
    │                   │                │                   │
    │── OAuth2 PKCE ─────────────────────►                   │
    │◄── code + JWT ─────────────────────│                   │
    │                   │                │                   │
    │── GET /demos ─────►                │                   │
    │                   │──── proxy + Bearer JWT ────────────►
    │                   │                │    authMiddleware  │
    │                   │                │   (passport+xssec)│
    │                   │                │    valida JWT     │
    │                   │                │    req.user = CDS │
    │                   │                │    User {id:...}  │
    │                   │                │    getUserEmail() │
    │                   │                │    → javier.donoso│
    │◄───────────────────────────────────── JSON response ──│
```

### Resolución de identidad (`src/utils/user.js`)

El servidor recibe un objeto `req.user` cuyo tipo varía según la versión de xssec y la configuración CDS:

| Fuente | Método | Ejemplo retorno |
|--------|--------|----------------|
| xssec SecurityContext | `getLogonName()` | `javier.donoso` |
| xssec SecurityContext | `getEmail()` | `javier.donoso@sap.com` |
| CDS `cds.User` | `.id` | `javier.donoso@sap.com` |
| JWT payload directo | `getTokenInfo().getPayload().user_name` | variado |

`getUserEmail()` prueba cada fuente en orden y normaliza el resultado quitando el dominio (`@sap.com`), para garantizar un identificador corto y consistente en la BD:

```
javier.donoso@sap.com  →  javier.donoso
javier.donoso          →  javier.donoso  (sin cambio)
I572394                →  I572394        (P/I numbers: sin cambio)
```

---

## Estructura de datos

```
Demos ──┬──< DemoSystems >── Systems
        ├──< DemoClients >── Clients
        ├──< DemoAttachments   (metadatos; binario en S3)
        ├──< DemoHistory       (auditoría campo a campo)
        ├──< DemoComments      (hilo interno del equipo)
        └──< ShareTokens       (enlaces públicos 30 días)
```

### Entidades (prefijo HANA: `SAP_PRESALES_DEMOS_`)

| Entidad | Campos clave | Notas |
|---------|-------------|-------|
| `Demos` | TITLE, DESCRIPTION, DEMODATE, STATUS, TAGS | STATUS: DRAFT → READY → ARCHIVED |
| `Systems` | NAME, TYPE, LANDSCAPE, URL, ACTIVE | TYPE: SAC / DATASPHERE / BDC / S4HANA / BW4HANA / OTHER |
| `Clients` | NAME, INDUSTRY, COUNTRY, CONTACT, EMAIL | COUNTRY: código ISO-3 |
| `DemoSystems` | DEMO_ID + SYSTEM_ID (PK compuesta), NOTES | Junction |
| `DemoClients` | DEMO_ID + CLIENT_ID (PK compuesta), PRESENTATIONDATE, RESULT, FEEDBACK | Junction |
| `DemoAttachments` | DEMO_ID, FILENAME, CONTENTTYPE, SIZE, OBJECTKEY | OBJECTKEY = clave S3 |
| `DemoHistory` | DEMO_ID, CHANGEDAT, CHANGEDBY, FIELD, OLDVALUE, NEWVALUE | Cada cambio de campo = 1 fila |
| `DemoComments` | DEMO_ID, COMMENT, CREATEDAT, CREATEDBY | Solo el autor puede borrar |
| `ShareTokens` | TOKEN (UUID), DEMO_ID, EXPIRESAT | TTL 30 días |

Todas las entidades tienen columnas de auditoría: `CREATEDAT`, `CREATEDBY`, `MODIFIEDAT`, `MODIFIEDBY`. El campo `CREATEDBY`/`MODIFIEDBY` se escribe siempre con el logon name normalizado del usuario autenticado.

---

## Coexistencia Express + CAP (CDS)

Este proyecto usa un patrón híbrido intencionado: CAP aporta el modelo de datos y el adaptador REST OData para sistemas, mientras Express maneja el resto con SQL directo.

```
server.js
  │
  ├── app.use(authMiddleware)          ← 1. Auth global (passport + xssec)
  ├── app.use('/api', apiRouter)       ← 2. Rutas Express personalizadas
  │     demos, clients, comments,
  │     attachments, share, dashboard,
  │     admin, me
  │
  ├── cds.app = app                    ← 3. CDS se adjunta al app Express
  ├── cds.model = compile(csn.json)    ← 4. Carga CSN pre-compilado (evita
  ├── cds.db = cds.connect.to('db')   │     resolución de rutas en CF)
  └── cds.serve(DemoService).in(app)  ← 5. CAP monta /api/systems con
                                            OData REST semántica
```

**¿Por qué CSN pre-compilado?**  
En CF solo se despliega la carpeta `srv/`. El fichero `db/schema.cds` no está disponible en tiempo de ejecución. Durante el build MTA, el modelo se compila a `csn.json` y se copia en `srv/`, que el servidor carga estáticamente.

**¿Por qué SQL directo y no CDS QL?**  
La mayor parte de la lógica de negocio (historial, completitud, joins de stats) requiere queries complejas que se expresan mejor en SQL que en CDS QL. CAP aporta el esquema y el scaffolding; `@sap/hana-client` ejecuta las queries.

---

## Capas de la aplicación

### Backend (`srv/`)

```
srv/
├── server.js              Bootstrap: Express → auth → rutas → CAP → listen
├── csn.json               Modelo CDS compilado (generado, no editar a mano)
├── demo-service.cds       Definición del servicio CAP (DemoService)
├── demo-service.js        Handlers CAP: normalización camelCase, integridad
└── src/
    ├── config/
    │   ├── db.js          Pool HANA (min 2, max 10 conex.)  · query() · transaction()
    │   └── auth.js        Registro JWTStrategy de passport
    ├── middleware/
    │   └── auth.js        Middleware auth: JWT en CF, mock en local
    ├── utils/
    │   └── user.js        getUserEmail() — identidad normalizada
    └── routes/
        ├── index.js       Mount de todas las rutas bajo /api
        ├── demos.js       CRUD demos + status PATCH + bulk + history
        ├── systems.js     CRUD sistemas + stats por sistema
        ├── clients.js     CRUD clientes + stats por cliente
        ├── comments.js    Hilo de comentarios por demo
        ├── attachments.js Upload/download/delete en S3
        ├── share.js       Generación y resolución de tokens públicos
        ├── dashboard.js   KPIs y agregaciones
        ├── admin.js       Seed de datos + utilidades admin
        └── me.js          Identidad del usuario autenticado
```

### Frontend (`ui/`)

```
ui/src/
├── api/client.js          Axios + interceptor (normaliza { value: [] } de CAP)
├── hooks/
│   ├── useDemos.js        Fetch + state de demos
│   ├── useDashboard.js    Fetch + state del dashboard
│   └── useMasterData.js   Fetch + state de sistemas y clientes
├── components/
│   ├── layout/
│   │   ├── AppShell.jsx   Sidebar (nav + usuario autenticado + logout)
│   │   └── PageShell.jsx  Cabecera reutilizable por página
│   └── shared/
│       ├── CommandPalette.jsx  Búsqueda global (⌘K)
│       ├── CompletenessBar.jsx Barra de completitud de demo
│       ├── Modal.jsx
│       ├── Spinner.jsx
│       ├── StatusBadge.jsx    Badge DRAFT / READY / ARCHIVED
│       └── TagInput.jsx       Input de tags con colores por hash
└── pages/
    ├── Dashboard.jsx      KPIs, gráficas (recharts), actividad reciente
    ├── DemosList.jsx      Listado con búsqueda, filtros, selección múltiple
    ├── DemoDetail.jsx     Detalle completo (pestañas: info, sistemas, clientes,
    │                       adjuntos, historial, comentarios, share)
    ├── DemoWizard.jsx     Wizard 4 pasos: crear / editar demo
    ├── MasterData.jsx     CRUD de sistemas y clientes
    ├── Timeline.jsx       Vista cronológica por fecha de demo
    ├── Kanban.jsx         Board DRAFT / READY / ARCHIVED con drag & drop
    └── ShareView.jsx      Vista pública sin autenticación (por token)
```

---

## Pipeline de build y deploy

### Build MTA (deploy completo — incluye HANA)

```bash
# Build
npx mbt build -t .
# Deploy (incluye approuter + srv + HDI deployer)
cf deploy sap-presales-demos-repo_1.0.0.mtar -f
```

**Secuencia de build (`mta.yaml` `before-all`):**

```
1. npm ci                         (raíz — cds-dk)
2. cds build                      (compila schema.cds → gen/)
3. cp gen/srv/srv/csn.json srv/   (CSN disponible en CF sin db/)
4. npm ci --prefix ui
5. npm run build --prefix ui      (Vite → srv/public/)
6. npm ci --prefix srv --production
```

### Deploy rápido (solo srv — sin cambios en HANA)

```bash
# Desde srv/
npm run build:ui   # desde raíz: vite build → srv/public/
cf push sap-presales-demos-srv
```

Útil para desplegar cambios de backend o frontend sin tocar el HDI container ni el approuter.

---

## API Surface

Base path: `/api`. Todas las rutas requieren JWT válido (salvo `/share/:token`).

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/demos` | Lista demos. Filtros: `search`, `status`, `system_type`, `landscape` |
| GET | `/demos/:id` | Demo completa con sistemas y clientes |
| POST | `/demos` | Crear demo |
| PUT | `/demos/:id` | Editar demo (registra historial automáticamente) |
| DELETE | `/demos/:id` | Eliminar en cascada |
| PATCH | `/demos/:id/status` | Cambiar estado |
| POST | `/demos/bulk` | Acción masiva: `archive` / `delete` / `mark-ready` |
| GET | `/demos/:id/history` | Historial de cambios campo a campo |
| GET | `/demos/:id/comments` | Comentarios del equipo |
| POST | `/demos/:id/comments` | Añadir comentario |
| DELETE | `/demos/:id/comments/:cid` | Borrar comentario (solo el autor) |
| GET | `/demos/:id/attachments` | Listar adjuntos |
| POST | `/demos/:id/attachments` | Subir fichero (multipart, máx. 200 MB) |
| GET | `/demos/:id/attachments/:aid/download` | URL pre-firmada S3 (15 min) |
| DELETE | `/demos/:id/attachments/:aid` | Eliminar adjunto |
| POST | `/demos/:id/share` | Generar token de enlace público (30 días) |
| GET | `/share/:token` | Resolver token → demo (sin autenticación) |
| GET | `/systems` | Listar sistemas activos |
| POST | `/systems` | Crear sistema |
| PUT | `/systems/:id` | Editar sistema |
| DELETE | `/systems/:id` | Eliminar (409 si tiene demos) |
| GET | `/systems/:id/stats` | KPIs: nº demos, tasa de éxito |
| GET | `/clients` | Listar clientes |
| POST | `/clients` | Crear cliente |
| PUT | `/clients/:id` | Editar cliente |
| DELETE | `/clients/:id` | Eliminar (409 si tiene demos) |
| GET | `/clients/:id/stats` | KPIs: resultados, lista de demos |
| GET | `/dashboard/stats` | KPIs globales: totales, por estado, actividad |
| GET | `/me` | Identidad del usuario autenticado |
| POST | `/admin/seed` | Insertar datos de prueba (limpia BD primero) |

---

## Servicios BTP

| Recurso | Servicio CF | Plan | Binding |
|---------|-------------|------|---------|
| `sap-presales-demos-auth` | `xsuaa` | `application` | srv + approuter |
| `sap-presales-demos-db` | HDI Container existente | — | srv + db-deployer |
| `sap-presales-demos-objectstore` | `objectstore` | `s3-standard` | srv |

---

## Decisiones técnicas relevantes

| Decisión | Alternativa considerada | Razón |
|----------|------------------------|-------|
| Express + SQL directo para la mayoría de rutas | CDS QL / OData completo | Queries complejas (historial, stats, joins) son más claras en SQL. CAP añade complejidad sin beneficio aquí |
| CAP solo para Systems | Ningún CAP | MasterData UI usa OData $filter para búsqueda. Justifica el adaptador en un solo endpoint |
| CSN pre-compilado en build | Compilar en startup | CF solo sube `srv/`. El schema CDS en `db/` no está disponible en runtime |
| React SPA servida por Express | Approuter sirviendo estáticos | Simplifica el deploy rápido: un solo `cf push srv/` despliega backend + frontend |
| Normalización de email a logon name | Guardar email completo | Varios flujos XSUAA/CDS devuelven el mismo usuario con o sin `@sap.com`. La normalización garantiza consistencia en BD sin duplicados en métricas |
