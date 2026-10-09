# SAP Analytics Presales — Demo Repository

Aplicación interna para gestionar el catálogo de demos del equipo de Presales Spain: registro de demostraciones, sistemas SAP, clientes, adjuntos, estadísticas y comentarios. Desplegada en SAP BTP Cloud Foundry con autenticación XSUAA.

**URL:** `https://presales-spain-cf-p9gsvmnxsg1mvz9k-dev-sap-presales-demos-srv.cfapps.eu10.hana.ondemand.com`

→ Ver [ARCHITECTURE.md](ARCHITECTURE.md) para el diagrama de componentes, flujo de auth y decisiones técnicas.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite 5 + Tailwind CSS v3 |
| Backend | Node.js ≥ 18 + Express 4 |
| ORM / modelo | SAP CAP (`@sap/cds` v8) — solo para Systems y schema |
| Base de datos | SAP HANA Cloud (HDI Container, `@sap/hana-client` v2) |
| Autenticación | SAP XSUAA + `@sap/xssec` v3 + Passport |
| Almacenamiento | SAP Object Store S3-compatible (`@aws-sdk/client-s3` v3) |
| App Router | `@sap/approuter` v16 |
| Deploy | SAP BTP Cloud Foundry — MTA (`mbt`) o `cf push` directo |

---

## Funcionalidades

- **Dashboard** — KPIs (total, por estado, este mes), gráficas de actividad y tendencias, demos recientes, top contribuidores del equipo
- **Listado de demos** — Búsqueda por texto, filtros por estado / tipo de sistema / landscape, selección múltiple con acciones en masa (archivar, borrar, marcar como ready)
- **Wizard de creación / edición** — 4 pasos: información básica → sistemas → clientes → revisión y publicación
- **Vista Kanban** — Columnas DRAFT / READY / ARCHIVED con drag & drop para cambiar estado
- **Vista Timeline** — Línea de tiempo cronológica de demos por fecha de presentación
- **Detalle de demo** con pestañas:
  - *General* — Metadatos, tags con color automático, barra de completitud
  - *Sistemas* — Sistemas SAP asociados con tipo y landscape
  - *Clientes* — Presentaciones con fecha, resultado (WON/LOST/PIPELINE/CANCELLED) y feedback
  - *Adjuntos* — Upload drag & drop, preview de PDF e imágenes, descarga por URL S3 pre-firmada (15 min)
  - *Historial* — Auditoría de cambios campo a campo con fecha y autor
  - *Comentarios* — Hilo de comentarios internos del equipo
- **Clone** — Duplicar una demo existente como nuevo borrador
- **Share** — Enlace público sin autenticación (30 días) para compartir una demo externamente
- **Completitud** — Puntuación 0–100 % basada en: título + descripción + fecha + sistema + cliente
- **Master Data** — CRUD completo de sistemas y clientes con estadísticas de uso (nº demos, tasa de éxito)
- **Usuario autenticado** — Sidebar muestra nombre, iniciales y menú de logout del usuario XSUAA real; todas las acciones quedan auditadas con su logon name
- **Búsqueda global** — Paleta de comandos (⌘K) para búsqueda rápida entre demos

---

## Estructura del proyecto

```
sap-presales-demos-repo/
├── approuter/               SAP App Router (auth + proxy)
│   ├── xs-app.json          Rutas: requiere xsuaa, proxy → srv-api
│   └── package.json
├── db/
│   ├── schema.cds           Modelo de datos CDS (entidades + managed aspects)
│   └── data/                CSV de seed para desarrollo local con SQLite
├── gen/db/                  HDI deployer generado por `cds build` (no editar)
├── srv/
│   ├── server.js            Bootstrap: Express → auth → rutas → CAP → listen
│   ├── csn.json             Modelo CDS compilado (generado en build, no editar)
│   ├── demo-service.cds     Definición del servicio CAP (DemoService @protocol rest)
│   ├── demo-service.js      Handlers CAP: normalización camelCase + integridad referencial
│   └── src/
│       ├── config/
│       │   ├── db.js        Pool de conexión HANA (min 2, max 10) · query() · transaction()
│       │   └── auth.js      Registro de JWTStrategy en passport
│       ├── middleware/
│       │   └── auth.js      Auth middleware: JWT en CF, mock en local
│       ├── utils/
│       │   └── user.js      getUserEmail() — resuelve xssec / CDS User / JWT payload
│       └── routes/
│           ├── index.js     Mount de todas las rutas bajo /api
│           ├── demos.js     CRUD demos + status PATCH + bulk + history
│           ├── systems.js   CRUD sistemas + stats
│           ├── clients.js   CRUD clientes + stats
│           ├── comments.js  Comentarios por demo
│           ├── attachments.js Upload/download/delete en S3
│           ├── share.js     Tokens de enlace público
│           ├── dashboard.js KPIs y agregaciones
│           ├── admin.js     Seed de datos inicial + utilidades admin
│           └── me.js        Identidad del usuario autenticado
├── ui/
│   ├── index.html
│   ├── vite.config.js       outDir → ../srv/public; proxy /api → :3000 en dev
│   ├── tailwind.config.js   Colores SAP brand (sap.blue, etc.) + Inter font
│   └── src/
│       ├── api/client.js    Axios + interceptor (normaliza { value: [] } de CAP)
│       ├── hooks/           useDemos, useDashboard, useMasterData
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell.jsx   Sidebar: nav + usuario autenticado + logout
│       │   │   └── PageShell.jsx  Cabecera reutilizable con título y acción
│       │   └── shared/
│       │       ├── CommandPalette.jsx
│       │       ├── CompletenessBar.jsx
│       │       ├── Modal.jsx
│       │       ├── Spinner.jsx
│       │       ├── StatusBadge.jsx
│       │       └── TagInput.jsx
│       └── pages/
│           ├── Dashboard.jsx
│           ├── DemosList.jsx
│           ├── DemoDetail.jsx
│           ├── DemoWizard.jsx
│           ├── MasterData.jsx
│           ├── Timeline.jsx
│           ├── Kanban.jsx
│           └── ShareView.jsx   Vista pública sin auth (token)
├── mta.yaml                 Descriptor MTA: módulos, recursos, build steps
├── xs-security.json         Scopes XSUAA: DemoAdmin, DemoUser, DemoViewer
├── package.json             Raíz: cds-dk + scripts de build
├── README.md
└── ARCHITECTURE.md          Diagramas, flujo de auth, decisiones técnicas
```

---

## Modelo de datos

```
Demos ──┬──< DemoSystems >── Systems
        ├──< DemoClients >── Clients
        ├──< DemoAttachments
        ├──< DemoHistory
        ├──< DemoComments
        └──< ShareTokens
```

### Tablas HANA (prefijo `SAP_PRESALES_DEMOS_`)

| Tabla | Descripción |
|-------|-------------|
| `DEMOS` | Demo: TITLE, DESCRIPTION, DEMODATE, STATUS, TAGS |
| `SYSTEMS` | Sistema SAP: NAME, TYPE, LANDSCAPE, URL, ACTIVE |
| `CLIENTS` | Cliente: NAME, INDUSTRY, COUNTRY, CONTACT, EMAIL |
| `DEMOSYSTEMS` | Demo ↔ Sistema (PK compuesta + NOTES) |
| `DEMOCLIENTS` | Demo ↔ Cliente (PRESENTATIONDATE, RESULT, FEEDBACK) |
| `DEMOATTACHMENTS` | Metadatos de adjuntos (fichero en S3) |
| `DEMOCOMMENTS` | Comentarios internos por demo |
| `DEMOHISTORY` | Auditoría de cambios campo a campo |
| `SHARETOKENS` | Tokens para enlaces públicos (TTL 30 días) |

**Estados de una demo:** `DRAFT` → `READY` → `ARCHIVED`

**Tipos de sistema:** `SAC`, `DATASPHERE`, `BDC`, `S4HANA`, `BW4HANA`, `OTHER`

**Landscapes:** `BDC_GA`, `GLA26Q2`, `SANDBOX`, `EXTERNAL`

**Resultados de cliente:** `WON`, `LOST`, `PIPELINE`, `CANCELLED`

---

## API REST

Base path: `/api`. Todas las rutas requieren JWT válido excepto `GET /share/:token`.

### Demos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/demos` | Lista con filtros: `search`, `status`, `system_type`, `landscape` |
| `GET` | `/demos/:id` | Demo completa (sistemas + clientes) |
| `POST` | `/demos` | Crear demo |
| `PUT` | `/demos/:id` | Editar demo (registra historial) |
| `DELETE` | `/demos/:id` | Eliminar en cascada |
| `PATCH` | `/demos/:id/status` | Cambiar estado |
| `POST` | `/demos/bulk` | Acción masiva: `archive`, `delete`, `mark-ready` |
| `GET` | `/demos/:id/history` | Historial de cambios |

### Comentarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/demos/:id/comments` | Listar comentarios |
| `POST` | `/demos/:id/comments` | Añadir comentario |
| `DELETE` | `/demos/:id/comments/:cid` | Borrar (solo el autor) |

### Adjuntos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/demos/:id/attachments` | Listar adjuntos |
| `POST` | `/demos/:id/attachments` | Subir fichero (multipart, máx. 200 MB) |
| `GET` | `/demos/:id/attachments/:aid/download` | URL pre-firmada S3 (15 min) |
| `DELETE` | `/demos/:id/attachments/:aid` | Eliminar |

### Sistemas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/systems` | Listar sistemas activos |
| `POST` | `/systems` | Crear sistema |
| `PUT` | `/systems/:id` | Editar sistema |
| `DELETE` | `/systems/:id` | Eliminar (409 si tiene demos asociadas) |
| `GET` | `/systems/:id/stats` | KPIs: nº demos, tasa de éxito, lista demos |

### Clientes

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/clients` | Listar clientes |
| `POST` | `/clients` | Crear cliente |
| `PUT` | `/clients/:id` | Editar cliente |
| `DELETE` | `/clients/:id` | Eliminar (409 si tiene demos) |
| `GET` | `/clients/:id/stats` | KPIs: resultados por tipo, lista demos |

### Otros

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/dashboard/stats` | KPIs globales, actividad, top contribuidores |
| `POST` | `/demos/:id/share` | Generar token público (30 días) |
| `GET` | `/share/:token` | Vista pública sin autenticación |
| `GET` | `/me` | Identidad del usuario autenticado (nombre, iniciales, logoutUrl) |
| `POST` | `/admin/seed` | Insertar datos de prueba (limpia BD primero) |

---

## Desarrollo local

### Requisitos

- Node.js ≥ 18
- Acceso a una instancia HANA Cloud (o SQLite para pruebas básicas)
- CF CLI + `mbt` (`npm i -g mbt`)

### Instalación

```bash
npm ci                     # raíz (cds-dk)
npm ci --prefix ui         # frontend
npm ci --prefix srv        # backend
```

### Arranque

```bash
# Terminal 1: backend (puerto 3000 o 4004)
node srv/server.js

# Terminal 2: frontend (Vite en :5173, proxy /api → :3000)
npm run dev --prefix ui
```

Variables de entorno opcionales para HANA local (`.env` o export):

```
HANA_HOST=...
HANA_PORT=443
HANA_USER=...
HANA_PASSWORD=...
HANA_SCHEMA=...
```

Sin XSUAA en local, la auth se puentea automáticamente con un usuario mock `{ logonName: 'local-dev' }`.

### Compilar CSN (si se modifica `db/schema.cds`)

```bash
npx cds compile db/schema.cds --to json > srv/csn.json
# o bien:
npx cds build && cp gen/srv/srv/csn.json srv/csn.json
```

---

## Build y deploy en BTP Cloud Foundry

### Deploy rápido (solo srv — sin cambios en HANA ni approuter)

```bash
# 1. Build del frontend
npm run build:ui           # desde raíz: vite build → srv/public/

# 2. Deploy solo del servidor
cd srv
cf push sap-presales-demos-srv
```

### Deploy completo con MTA (primera vez o cambios en HANA/approuter)

```bash
# 1. Login
cf login --sso
cf target -o Presales_Spain_CF_p9gsvmnxsg1mvz9k -s dev

# 2. Build MTA
npx mbt build -t .

# 3. Deploy
cf deploy sap-presales-demos-repo_1.0.0.mtar -f
```

El build MTA ejecuta en orden:
1. `npm ci` (raíz)
2. `cds build` → compila schema.cds
3. `cp gen/srv/srv/csn.json srv/csn.json`
4. `npm ci --prefix ui && npm run build --prefix ui` → React SPA en `srv/public/`
5. `npm ci --prefix srv --production`

---

## Servicios BTP requeridos

| Servicio | Plan | Nombre instancia | Binding |
|----------|------|-----------------|---------|
| XSUAA | `application` | `sap-presales-demos-auth` | srv + approuter |
| HANA HDI Container | existente | `sap-presales-demos-db` | srv + deployer |
| Object Store (S3) | `s3-standard` | `sap-presales-demos-objectstore` | srv |

Las credenciales se inyectan automáticamente vía `VCAP_SERVICES` en CF y se leen con `@sap/xsenv`. No se usan variables de entorno manuales en producción.

---

## Tema visual

Glassmorphism oscuro con acento azul SAP. Fondo: gradiente `#0a0e28 → #0d1117`. Clases CSS clave (`ui/src/index.css`):

| Clase | Uso |
|-------|-----|
| `.glass` | Card / contenedor translúcido |
| `.glass-input` | Input, select, textarea |
| `.glass-header` | Cabecera de página |
| `.glass-sidebar` | Sidebar |
| `.glass-nav-active` | Ítem de navegación activo |
| `.badge-ready` / `.badge-draft` / `.badge-archived` | Badges de estado |

Color de acento: `#4da6ff` (`--color-brand` en Tailwind config).
