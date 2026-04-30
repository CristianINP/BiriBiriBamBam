# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**La Casa del Perfume** — e-commerce app for selling perfumes. Angular 21 frontend + Node.js/Express backend, payments via PayPal Sandbox, purchase history stored in MySQL.

---

## Commands

### Frontend (Angular — root directory)
```bash
npm start          # dev server on http://localhost:4200
ng build           # production build → dist/
ng test            # unit tests with Vitest
```

### Backend (Node.js — `backend/` directory)
```bash
cd backend
node src/server.js   # API server on http://localhost:3000
```

The backend has no dev/watch script. Both processes must run simultaneously for the app to work.

---

## Environment Setup

### Backend — `backend/.env`
Required variables (file already exists, do not commit changes):
```
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_DATABASE=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
```

### Frontend — `src/environments/environment.ts`
`apiUrl` points to `http://localhost:3000/api`. The `paypalClientId` is the sandbox client ID.

### Database Migration
Run once to create the schema:
```sql
-- backend/src/migrations/001_create_usuarios_tickets.sql
```
The `productos` table is assumed to pre-exist and is not included in the migration.

---

## Architecture

### Frontend (`src/app/`)
Angular 21 with SSR enabled (`@angular/ssr`). All components are standalone.

**Routing** (`app.routes.ts`):
| Path | Component |
|------|-----------|
| `/` or `/catalogo` | `Home` |
| `/carrito` | `CarritoComponent` |
| `/checkout` | `Checkout` |
| `/login` | `LoginComponent` |
| `/ticket/:id` | `TicketComponent` |
| `/orden/:orderId/ticket` | `TicketComponent` |

**Services:**
- `CarritoService` — singleton, manages cart state via **Angular Signals**. `groupedItems`, `subtotal`, `impuestos` (16% IVA), and `total` are all `computed()` signals. Cart items are **never persisted to the DB** — they live in memory only.
- `UserService` — singleton, holds the logged-in user in a `signal<User | null>`. Persists to `localStorage` under key `usuario_lcperfume`. Uses `isPlatformBrowser` guard everywhere before touching `localStorage` (SSR compatibility).
- `PaypalService` — HTTP calls to backend `/api/paypal/*`.
- `TicketService` — HTTP calls to backend `/api/tickets/*`.

**Key design decisions:**
- MySQL returns `DECIMAL` columns as strings. Always cast with `Number()` before arithmetic.
- PayPal button logic is duplicated in both `CarritoComponent` and `Checkout`. Both components load the PayPal SDK dynamically via a `<script>` tag in `ngAfterViewInit`.
- If the user is not logged in at checkout, a temporary guest user is auto-created with email `invitado_<timestamp>@temp.com`.
- `CarritoService.exportarXML()` / `descargarReciboXML()` builds and triggers a browser download of an XML receipt — no server call required.

### Backend (`backend/src/`)
Node.js with **ESM modules** (`"type": "module"` in `backend/package.json`). Uses Express 5.

**Layer structure:** `routes → controllers → services → db pool (mysql2)`

**API routes** (all prefixed `/api`):
| Method | Path | Description |
|--------|------|-------------|
| GET | `/productos` | Fetch product catalog |
| POST | `/paypal/create-order` | Create PayPal order |
| POST | `/paypal/capture-order` | Capture approved payment |
| POST | `/paypal/guardar-pedido` | Save legacy order with line items (pedidos table) |
| POST | `/usuarios` | Register or upsert user by email |
| POST | `/usuarios/login` | Login by email (no password) |
| GET | `/usuarios/:id` | Get user by ID |
| POST | `/tickets` | Create purchase ticket |
| GET | `/tickets/:id` | Get ticket by ID |
| GET | `/tickets/order/:orderId` | Get ticket by PayPal order ID |
| GET | `/tickets/usuario/:userId` | Get all tickets for a user |
| GET | `/tickets/detalle/:id` | Ticket joined with user data |
| GET | `/tickets/reporte/:userId` | Purchase summary report |

**DB pool:** `mysql2` connection pool (limit 10) configured in `backend/src/config/db.js`. All service queries use the callback API; `guardarPedido` in `paypal.controller.js` uses `db.promise()`.

**Login model:** Email-only, no passwords. `UserService.createOrUpdateUser` upserts on duplicate email — returning the existing user silently.

### Database Schema
Two core tables managed by this app:
- **`usuarios`** — `id_usuario`, `email` (UNIQUE), `nombre`, `apellido`, `telefono`, `created_at`
- **`tickets`** — `id_ticket`, `orderId` (PayPal), `id_usuario` (FK), `fecha_compra`, `metodo_pago`, `subtotal`, `impuestos`, `total`, `estado` (`APROBADO`/`PENDIENTE`/`CANCELADO`), `created_at`

Cart line items are **not stored**. The `pedidos`/`detalles_pedido` tables referenced in `paypal.controller.js → guardarPedido` must be created separately if that endpoint is used.

### Two separate `package.json` files
- Root `/package.json` — Angular app (run `npm install` here for frontend deps)
- `backend/package.json` — Express API (run `npm install` inside `backend/` for backend deps)
