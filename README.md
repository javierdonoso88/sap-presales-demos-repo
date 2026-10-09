# SAP Analytics Presales — Demo Repository

Aplicación interna para gestionar el catálogo de demos de Presales: registro de demostraciones, sistemas SAP, clientes, adjuntos, estadísticas y comentarios internos. Desplegada en SAP BTP Cloud Foundry con autenticación XSUAA.

**URL producción:** `https://presales-spain-cf-p9gsvmnxsg1mvz9k-dev-sap-presales-dem52414d9b.cfapps.eu10.hana.ondemand.com`

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS v3 (tema glassmorphism oscuro) |
| Backend | Node.js + Express 4 |
| Base de datos | SAP HANA Cloud (HDI Container) |
| Autenticación | SAP XSUAA + `@sap/xssec` + Passport |
| Almacenamiento de archivos | SAP Object Store (S3-compatible) |
| App Router | `@sap/approuter` |
| Deploy | SAP BTP Cloud Foundry — MTA build (`mbt`) |

---

## Estructura del proyecto

```
sap-presales-demos-repo/
├── approuter/            # SAP App Router (autenticación + proxy)
│   ├── xs-app.json       # Rutas: /api → srv, / → SPA
│   └── package.json
├── db/
│   ├── schema.cds        # Modelo de datos (CDS)
│   └── data/             # CSV de seed (sistemas, clientes, demos)
├── gen/db/               # HDI deployer generado por `cds build`
├── srv/
│   ├── server.js         # Bootstrap Express + XSUAA + rutas
│   ├── csn.json          # CSN compilado (generado, no editar a mano)
│   └── src/
│       ├── config/db.js  # Pool de conexión HANA (@sap/hana-client)
│       ├── middleware/    # Auth middleware
│       └── routes/
│           ├── index.js       # Mount de todas las rutas bajo /api
│           ├── demos.js       # CRUD demos + historial + bulk
│           ├── systems.js     # CRUD sistemas + estadísticas
│           ├── clients.js     # CRUD clientes + estadísticas
│           ├── comments.js    # Comentarios internos por demo
│           ├── attachments.js # Upload/download/delete en S3
│           ├── share.js       # Tokens de enlace público
│           ├── dashboard.js   # KPIs y agregaciones
│           ├── admin.js       # Seed de datos inicial
│           └── me.js          # Identidad del usuario autenticado
│       └── utils/
│           └── user.js        # getUserEmail — xssec / CDS User / JWT payload
└── ui/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── api/client.js        # Axios instance + interceptor de respuesta
        ├── hooks/useDemos.js    # Hook React para carga de demos
        ├── components/
        │   ├── layout/
        │   │   ├── AppShell.jsx   # Sidebar + layout principal
        │   │   └── PageShell.jsx  # Header reutilizable por página
        │   └── shared/
        │       ├── Modal.jsx
        │       ├── Spinner.jsx
        │       ├── StatusBadge.jsx
        │       ├── TagInput.jsx
        │       └── CompletenessBar.jsx
        └── pages/
            ├── Dashboard.jsx   # KPIs y actividad reciente
            ├── DemosList.jsx   # Listado con filtros
            ├── DemoWizard.jsx  # Crear / editar demo (wizard 4 pasos)
            ├── DemoDetail.jsx  # Vista detalle con pestañas
            ├── Kanban.jsx      # Board por estado
            ├── Timeline.jsx    # Vista cronológica
            ├── MasterData.jsx  # Gestión de sistemas y clientes
            └── ShareView.jsx   # Vista pública (sin autenticación)
```

---

## Modelo de datos

```
Demos ─┬─< DemoSystems >─ Systems
       ├─< DemoClients >─ Clients
       ├─< DemoAttachments
       ├─< DemoHistory
       ├─< DemoComments
       └─< ShareTokens
```

### Tablas HANA (prefijo `SAP_PRESALES_DEMOS_`)

| Tabla | Descripción |
|-------|-------------|
| `DEMOS` | Demo: título, descripción, fecha, estado, tags |
| `SYSTEMS` | Sistema SAP: nombre, tipo, landscape, URL |
| `CLIENTS` | Cliente: nombre, industria, país, contacto |
| `DEMOSYSTEMS` | Junction: demo ↔ sistema (+ notas) |
| `DEMOCLIENTS` | Junction: demo ↔ cliente (fecha presentación, resultado, feedback) |
| `DEMOATTACHMENTS` | Metadatos de adjuntos (el fichero está en S3) |
| `DEMOCOMMENTS` | Comentarios internos por demo |
| `DEMOHISTORY` | Auditoría de cambios campo a campo |
| `SHARETOKENS` | Tokens para enlaces públicos con expiración |

**Estados de una demo:** `DRAFT` → `READY` → `ARCHIVED`

**Tipos de sistema:** `SAC`, `DATASPHERE`, `BDC`, `S4HANA`, `BW4HANA`, `OTHER`

**Landscapes:** `BDC_GA`, `GLA26Q2`, `SANDBOX`, `EXTERNAL`

---

## API REST

Base path: `/api`

### Demos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/demos` | Listado con filtros opcionales: `search`, `status`, `system_type`, `landscape` |
| `GET` | `/demos/:id` | Demo completa (con sistemas, clientes) |
| `POST` | `/demos` | Crear demo |
| `PUT` | `/demos/:id` | Editar demo (registra historial automáticamente) |
| `DELETE` | `/demos/:id` | Eliminar demo en cascada |
| `PATCH` | `/demos/:id/status` | Cambiar estado |
| `POST` | `/demos/bulk` | Acción masiva: `archive`, `delete`, `mark-ready` |
| `GET` | `/demos/:id/history` | Historial de cambios |

### Comentarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/demos/:id/comments` | Listar comentarios de una demo |
| `POST` | `/demos/:id/comments` | Añadir comentario |
| `DELETE` | `/demos/:id/comments/:commentId` | Eliminar (solo el autor) |

### Adjuntos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/demos/:id/attachments` | Listar adjuntos |
| `POST` | `/demos/:id/attachments` | Subir archivo (multipart/form-data) |
| `GET` | `/demos/:id/attachments/:attId/download` | URL pre-firmada S3 |
| `DELETE` | `/demos/:id/attachments/:attId` | Eliminar |

### Sistemas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/systems` | Listar sistemas activos |
| `GET` | `/systems/:id/stats` | KPIs: nº demos, presentaciones, tasa de éxito + lista demos |
| `POST` | `/systems` | Crear sistema |
| `PUT` | `/systems/:id` | Editar sistema |
| `DELETE` | `/systems/:id` | Eliminar (error 409 si tiene demos asociadas) |

### Clientes

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/clients` | Listar clientes |
| `GET` | `/clients/:id/stats` | KPIs por resultado + lista demos |
| `POST` | `/clients` | Crear cliente |
| `PUT` | `/clients/:id` | Editar cliente |
| `DELETE` | `/clients/:id` | Eliminar |

### Otros

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/dashboard` | KPIs: total demos, por estado, actividad reciente |
| `POST` | `/demos/:id/share` | Generar token público (24h) |
| `GET` | `/share/:token` | Vista pública sin autenticación |
| `POST` | `/admin/seed` | Seed de datos de prueba |
| `GET` | `/me` | Identidad del usuario autenticado (nombre, iniciales, logoutUrl) |

---

## Funcionalidades

- **Dashboard** — KPIs: total de demos, por estado, demos recientes y próximas
- **Listado de demos** — Búsqueda por texto, filtros por estado / tipo / landscape, selección múltiple con acciones en masa
- **Wizard de creación / edición** — 4 pasos: Info básica → Sistemas → Clientes → Revisión
- **Vista Kanban** — Columnas DRAFT / READY / ARCHIVED con drag & drop
- **Vista Timeline** — Línea de tiempo cronológica de demos
- **Detalle de demo** con pestañas:
  - *General* — Metadatos, tags, completitud
  - *Sistemas* — Sistemas asociados con tipo y landscape
  - *Clientes* — Presentaciones con fecha, resultado y feedback
  - *Adjuntos* — Upload drag & drop, preview de PDF e imágenes, descarga por URL S3 pre-firmada
  - *Historial* — Auditoría de cambios campo a campo
  - *Comentarios* — Hilo de comentarios internos del equipo
- **Share** — Enlace público de 24h sin autenticación para compartir una demo
- **Clone** — Duplicar una demo existente como borrador
- **Usuario autenticado** — Sidebar muestra nombre e iniciales del usuario XSUAA con menú de logout; todas las acciones (crear/editar demo, sistemas, clientes, comentarios) quedan registradas con el logon name del usuario real
- **Completitud** — Barra de progreso (título + descripción + fecha + sistema + cliente = 100%)
- **Tags** — Etiquetas libres con colores automáticos por hash
- **Master Data** — CRUD de sistemas y clientes con estadísticas de uso

---

## Desarrollo local

### Requisitos

- Node.js ≥ 18
- Acceso a una instancia HANA Cloud (o SQLite para pruebas)
- CF CLI + `mbt` (`npm i -g mbt`)

### Instalación

```bash
npm ci                    # raíz (CDS devtools)
npm ci --prefix ui        # dependencias frontend
npm ci --prefix srv       # dependencias backend
```

### Arranque en local

```bash
# Frontend (Vite dev server en :5173 con proxy → :3000)
npm run dev --prefix ui

# Backend
node srv/server.js
```

El `vite.config.js` redirige `/api` → `http://localhost:3000` automáticamente.

### Compilar CSN (si se modifica `db/schema.cds`)

```bash
npx cds compile db/schema.cds --to json > srv/csn.json
```

---

## Build y deploy en BTP Cloud Foundry

```bash
# 1. Login (SSO)
cf login --sso

# 2. Seleccionar org y space
cf target -o Presales_Spain_CF_p9gsvmnxsg1mvz9k -s dev

# 3. Build MTA
npx mbt build -t .

# 4. Deploy
cf deploy sap-presales-demos-repo_1.0.0.mtar -f
```

El build ejecuta en orden: `npm ci` raíz → `cds build` → copia `csn.json` → build React (`vite build`) → `npm ci --production` en srv.

---

## Servicios BTP requeridos

| Servicio | Plan | Nombre instancia |
|----------|------|-----------------|
| XSUAA | `application` | `sap-presales-demos-auth` |
| HANA Cloud HDI | (existente) | `sap-presales-demos-repo` |
| Object Store (S3) | `s3-standard` | `sap-presales-demos-objectstore` |

---

## Variables de entorno (inyectadas por VCAP_SERVICES en CF)

El servidor lee credenciales a través de `@sap/xsenv`:

- **HANA**: `sap-presales-demos-db` → `hana` tag
- **XSUAA**: `sap-presales-demos-auth` → `xsuaa` tag
- **Object Store**: `sap-presales-demos-objectstore` → `objectstore` tag

No se usan variables de entorno manuales en producción.

---

## Tema visual

Glassmorphism oscuro. Clases CSS clave definidas en `ui/src/index.css`:

| Clase | Uso |
|-------|-----|
| `.glass` | Card / contenedor translúcido |
| `.glass-input` | Input, select, textarea |
| `.glass-header` | Cabecera de página |
| `.glass-sidebar` | Sidebar |
| `.badge-ready` / `.badge-draft` / `.badge-archived` | Badges de estado |

Fondo del body: gradiente `#0a0e28 → #0d1117`.
Color de acento (brand): `#4da6ff` (`--color-brand` en Tailwind config).
