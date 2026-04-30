# Diagramas UML - La Casa del Perfume

## Descripción del Proyecto
E-commerce especializado en la venta de perfumes, construido con Angular en el frontend y Node.js/Express con MySQL en el backend. Integración de pagos mediante PayPal con generación de tickets y exportación de recibos en XML.

---

## 1. Diagrama de Casos de Uso

```mermaid
graph TD
    classDef usecase fill:#e83e8c,stroke:#d63384,stroke-width:2px,color:#fff
    classDef actor fill:#f8f9fa,stroke:#333,stroke-width:2px,color:#333

    Usuario((Usuario)):::actor

    subgraph Sistema["Sistema: La Casa del Perfume"]
        direction TB
        UC1([Ver Catálogo]):::usecase
        UC2([Buscar Productos]):::usecase
        UC3([Agregar al Carrito]):::usecase
        UC4([Modificar Carrito]):::usecase
        UC5([Iniciar Sesión / Registrarse]):::usecase
        UC6([Pagar con PayPal]):::usecase
        UC7([Ver Recibo de Compra]):::usecase
        UC8([Descargar Recibo XML]):::usecase

        UC1 --> UC2
        UC1 --> UC3
        UC3 --> UC4
        UC4 --> UC6
        UC6 --> UC7
        UC7 --> UC8
    end

    Usuario --> UC1
    Usuario --> UC5
    Usuario --> UC3
    Usuario --> UC6
```

### Descripción de Casos de Uso:

| Caso de Uso | Descripción | Flujo Principal |
|-------------|-------------|-----------------|
| **Ver Catálogo** | Navegar por los productos disponibles | Usuario ingresa → sistema muestra productos desde BD |
| **Buscar Productos** | Filtrar productos por nombre | Ingresa texto → sistema filtra en tiempo real |
| **Agregar al Carrito** | Añadir productos al carrito | Selecciona producto → carrito se actualiza vía Signal |
| **Modificar Carrito** | Cambiar cantidad o quitar productos | Selecciona acción → servicio actualiza estado reactivo |
| **Iniciar Sesión / Registrarse** | Autenticarse o crear cuenta | Ingresa email → backend valida/crea usuario en BD |
| **Pagar con PayPal** | Completar compra desde el carrito | Aprueba en PayPal → backend captura → guarda ticket en BD |
| **Ver Recibo de Compra** | Consultar ticket generado en pantalla | Pago aprobado → sistema muestra ticket con totales |
| **Descargar Recibo XML** | Exportar compra como archivo XML | Solicita descarga → sistema genera XML con productos y totales |

---

## 2. Diagrama Entidad-Relación (ER)

```mermaid
erDiagram
    USUARIOS ||--o{ TICKETS : "realiza"
    PRODUCTOS }o--|| PRODUCTOS : "catálogo"

    USUARIOS {
        INT id_usuario PK
        VARCHAR email UK
        VARCHAR nombre
        VARCHAR apellido
        VARCHAR telefono
        TIMESTAMP created_at
    }

    PRODUCTOS {
        INT id PK
        VARCHAR name
        DECIMAL price
        VARCHAR imageUrl
        TEXT description
        VARCHAR category
        BOOLEAN inStock
    }

    TICKETS {
        INT id_ticket PK
        VARCHAR orderId
        INT id_usuario FK
        DATETIME fecha_compra
        VARCHAR metodo_pago
        DECIMAL subtotal
        DECIMAL impuestos
        DECIMAL total
        VARCHAR estado
        TIMESTAMP created_at
    }
```

### Tablas en la Base de Datos:

#### **USUARIOS**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_usuario` | INT PK AUTO_INCREMENT | Identificador único |
| `email` | VARCHAR(255) UNIQUE | Correo electrónico |
| `nombre` | VARCHAR(100) | Nombre(s) |
| `apellido` | VARCHAR(100) | Apellidos |
| `telefono` | VARCHAR(20) | Teléfono (opcional) |
| `created_at` | TIMESTAMP | Fecha de registro |

#### **PRODUCTOS**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT PK | Identificador único |
| `name` | VARCHAR(255) | Nombre del perfume |
| `price` | DECIMAL(10,2) | Precio unitario |
| `imageUrl` | VARCHAR(500) | URL de imagen |
| `description` | TEXT | Descripción detallada |
| `category` | VARCHAR(100) | Categoría/Familia olfativa |
| `inStock` | BOOLEAN | Disponibilidad |

#### **TICKETS**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_ticket` | INT PK AUTO_INCREMENT | Identificador único |
| `orderId` | VARCHAR(50) | ID de orden PayPal |
| `id_usuario` | INT FK → usuarios | Usuario comprador |
| `fecha_compra` | DATETIME | Fecha y hora de compra |
| `metodo_pago` | VARCHAR(50) | Siempre `'PayPal'` |
| `subtotal` | DECIMAL(10,2) | Subtotal sin IVA |
| `impuestos` | DECIMAL(10,2) | IVA 16% |
| `total` | DECIMAL(10,2) | Total final |
| `estado` | VARCHAR(20) | `APROBADO` / `PENDIENTE` / `CANCELADO` |
| `created_at` | TIMESTAMP | Fecha de registro |

> **Nota:** No existen tablas `transacciones` ni `items_transaccion`. El carrito se gestiona en memoria (Angular Signals) y los items no se persisten en BD. Solo se guarda el resumen financiero en `tickets`.

---

## 3. Diagrama de Clases — Servicios y Modelos Frontend

```mermaid
classDiagram
    direction TB

    class Product {
        <<interface>>
        +number id
        +string name
        +number price
        +string imageUrl
        +string description
        +string category
        +boolean inStock
    }

    class CartItem {
        <<interface>>
        +Product product
        +number quantity
    }

    class User {
        <<interface>>
        +number id_usuario
        +string email
        +string nombre
        +string apellido
        +string telefono
    }

    class Ticket {
        <<interface>>
        +number id_ticket
        +string orderId
        +number id_usuario
        +string fecha_compra
        +string metodo_pago
        +number subtotal
        +number impuestos
        +number total
        +string estado
    }

    class CarritoService {
        <<Angular Service - Singleton>>
        -productosSignal Signal~Product[]~
        +groupedItems Computed~CartItem[]~
        +itemCount Computed~number~
        +subtotal Computed~number~
        +impuestos Computed~number~
        +totalConImpuestos Computed~number~
        +carrito Computed~object[]~
        +agregar(producto, cantidad) void
        +quitar(id) void
        +removeAll(id) void
        +vaciar() void
        +carritoParaPayPal() object[]
        +exportarXML() void
    }

    class UserService {
        <<Angular Service - Singleton>>
        -platformId PLATFORM_ID
        +usuario Signal~User|null~
        +registrarUsuario(data) Observable
        +loginUsuario(data) Observable
        +setUsuario(usuario) void
        +clearUsuario() void
        -checkExistingSession() void
    }

    class PaypalService {
        <<Angular Service>>
        -apiUrl string
        +crearOrden(payload) Observable
        +capturarOrden(orderId) Observable
    }

    class TicketService {
        <<Angular Service>>
        -apiUrl string
        +generarTicket(data) Observable~Ticket~
        +obtenerTicket(id) Observable~Ticket~
        +obtenerTicketPorOrden(orderId) Observable~Ticket~
        +obtenerTicketsPorUsuario(userId) Observable~Ticket[]~
        +obtenerTicketConDetalles(id) Observable~Ticket~
    }

    CarritoService *-- CartItem
    CartItem *-- Product
    UserService ..> User
    TicketService ..> Ticket
```

---

## 4. Diagrama de Clases — Componentes Frontend

```mermaid
classDiagram
    direction TB

    class CarritoComponent {
        <<Angular Component>>
        -paypalButtonContainer ElementRef
        -carritoService CarritoService
        -paypalService PaypalService
        -ticketService TicketService
        -userService UserService
        +groupedItems Signal
        +total Computed~number~
        +subtotal Computed~number~
        +impuestos Computed~number~
        +mensaje Signal~string~
        +ticketGenerado Signal~Ticket|null~
        +mostrarTicket Signal~boolean~
        +itemsComprados Signal~object[]~
        +ngAfterViewInit() void
        -loadPaypalSdk() Promise~void~
        -renderPaypalButton() void
        -crearUsuarioTemporal() Promise~number~
        -generarTicket(orderId, userId) Promise~void~
        +descargarXML() void
        +cerrarTicket() void
        +agregar(producto) void
        +quitar(id) void
        +removeAll(id) void
        +vaciar() void
    }

    class LoginComponent {
        <<Angular Component>>
        -userService UserService
        +email string
        +nombre string
        +apellido string
        +modoRegistro boolean
        +usuario User|null
        +submit() Promise~void~
        +alternarModo() void
        +cerrarSesion() void
    }

    class TicketComponent {
        <<Angular Component>>
        -ticketService TicketService
        -route ActivatedRoute
        +ticket Signal~any~
        +usuario Signal~any~
        +cargando Signal~boolean~
        +navigatorShare boolean
        +ngOnInit() void
        +cargarTicket() Promise~void~
        +cerrarTicket() void
        +descargarPDF() void
        +compartirTicket() void
    }

    class Navbar {
        <<Angular Component>>
        -carritoService CarritoService
        -userService UserService
        +usuario User|null
        +searchQuery Signal~string~
        +onSearch() void
        +logout() void
    }

    CarritoComponent ..> CarritoService : inyecta
    CarritoComponent ..> PaypalService : inyecta
    CarritoComponent ..> TicketService : inyecta
    CarritoComponent ..> UserService : inyecta
    LoginComponent ..> UserService : inyecta
    TicketComponent ..> TicketService : inyecta
    Navbar ..> CarritoService : inyecta
    Navbar ..> UserService : inyecta
```

---

## 5. Diagrama de Clases — Backend

```mermaid
classDiagram
    direction TB

    class Database {
        <<mysql2 Pool>>
        +connectionLimit 10
        +query(sql, params, cb) void
    }

    class ProductoController {
        <<Controller>>
        +getProductos(req, res) void
    }

    class PaypalController {
        <<Controller>>
        +createOrder(req, res) Promise~void~
        +captureOrder(req, res) Promise~void~
    }

    class UsuarioController {
        <<Controller>>
        +registerUser(req, res) Promise~void~
        +loginUser(req, res) Promise~void~
        +getUserById(req, res) Promise~void~
    }

    class TicketController {
        <<Controller>>
        +createTicket(req, res) Promise~void~
        +getTicket(req, res) Promise~void~
        +getTicketByOrder(req, res) Promise~void~
        +getTicketsByUser(req, res) Promise~void~
        +getTicketWithDetails(req, res) Promise~void~
    }

    class PaypalService {
        <<Service>>
        +getAccessToken() Promise~string~
        +createPaypalOrder(data) Promise~any~
        +capturePaypalOrder(orderId) Promise~any~
    }

    class UserService {
        <<Service>>
        +createUser(data) Promise~User~
        +getUserById(id) Promise~User~
        +getUserByEmail(email) Promise~User~
        +createOrUpdateUser(data) Promise~User~
    }

    class TicketService {
        <<Service>>
        +createTicket(data) Promise~Ticket~
        +getTicketById(id) Promise~Ticket~
        +getTicketByOrderId(orderId) Promise~Ticket~
        +getTicketsByUserId(userId) Promise~Ticket[]~
        +getTicketWithDetails(id) Promise~Ticket~
        +getUserPurchaseReport(userId) Promise~object~
    }

    ProductoController ..> Database : consulta
    UsuarioController ..> UserService : usa
    PaypalController ..> PaypalService : usa
    TicketController ..> TicketService : usa
    UserService ..> Database : consulta
    TicketService ..> Database : consulta
```

### Rutas del API REST:

| Método | Ruta | Controlador | Descripción |
|--------|------|-------------|-------------|
| GET | `/api/productos` | ProductoController | Obtener catálogo |
| POST | `/api/paypal/create-order` | PaypalController | Crear orden PayPal |
| POST | `/api/paypal/capture-order` | PaypalController | Capturar pago |
| POST | `/api/usuarios` | UsuarioController | Registrar usuario |
| POST | `/api/usuarios/login` | UsuarioController | Login por email |
| GET | `/api/usuarios/:id` | UsuarioController | Obtener usuario |
| POST | `/api/tickets` | TicketController | Crear ticket |
| GET | `/api/tickets/:id` | TicketController | Obtener ticket |
| GET | `/api/tickets/order/:orderId` | TicketController | Ticket por orden PayPal |
| GET | `/api/tickets/usuario/:userId` | TicketController | Tickets de un usuario |
| GET | `/api/tickets/detalle/:id` | TicketController | Ticket con datos de usuario |

---

## 6. Diagrama de Secuencia — Flujo Completo de Compra

```mermaid
sequenceDiagram
    participant U as Usuario
    participant C as CarritoComponent
    participant CS as CarritoService
    participant PP as PaypalService
    participant US as UserService
    participant TS as TicketService
    participant BE as Backend Node.js
    participant PPA as API PayPal
    participant DB as MySQL

    U->>BE: GET /api/productos
    BE->>DB: SELECT * FROM productos
    DB-->>BE: rows[]
    BE-->>U: Productos JSON

    U->>CS: agregar(producto)
    CS-->>C: groupedItems actualizado (Signal)

    U->>C: Navega a /carrito
    C->>C: ngAfterViewInit → loadPaypalSdk()
    C->>PPA: Carga SDK (script tag)
    C->>C: renderPaypalButton()

    U->>PPA: Click botón PayPal → aprueba pago
    PPA-->>C: onApprove(data.orderID)

    C->>PP: capturarOrden(orderID)
    PP->>BE: POST /api/paypal/capture-order
    BE->>PPA: captureOrder(orderID)
    PPA-->>BE: COMPLETED
    BE-->>C: Captura exitosa

    C->>CS: groupedItems() → itemsComprados (snapshot)

    alt Usuario no tiene sesión
        C->>US: registrarUsuario(email temporal)
        US->>BE: POST /api/usuarios
        BE->>DB: INSERT INTO usuarios
        DB-->>BE: id_usuario
        BE-->>US: {usuario}
        US-->>C: id_usuario
    else Usuario con sesión
        C->>US: usuario().id_usuario
    end

    C->>TS: generarTicket(orderId, userId, subtotal, impuestos, total)
    TS->>BE: POST /api/tickets
    BE->>DB: INSERT INTO tickets
    DB-->>BE: ticket insertado
    BE-->>TS: {ticket}
    TS-->>C: ticket

    C->>CS: vaciar()
    C->>C: ticketGenerado.set(ticket) · mostrarTicket.set(true)
    C-->>U: Muestra recibo en pantalla

    opt Descargar XML
        U->>C: click "Descargar recibo XML"
        C->>C: genera XML con itemsComprados + ticket
        C-->>U: Descarga recibo-{id}.xml
    end
```

---

## 7. Diagrama de Despliegue

```mermaid
graph TB
    subgraph "Navegador Web"
        Browser([Cliente Angular])
        PayPalSDK([PayPal SDK JS])
    end

    subgraph "Frontend Angular :4200"
        App([App Angular])
        CarritoComp([CarritoComponent])
        CarritoSvc([CarritoService - Signals])
        UserSvc([UserService - localStorage])
        TicketSvc_FE([TicketService])
        PaypalSvc([PaypalService])
    end

    subgraph "Backend Node.js :3000"
        Express([Express API])
        ProdCtrl([ProductoController])
        UserCtrl([UsuarioController])
        PPCtrl([PaypalController])
        TicketCtrl([TicketController])
        PPSvc([PaypalService])
        UserSvcBE([UserService])
        TicketSvcBE([TicketService])
        Pool([mysql2 Pool x10])
    end

    subgraph "MySQL :3306"
        DB[(tienda)]
        T_prod[(productos)]
        T_usr[(usuarios)]
        T_tkt[(tickets)]
    end

    subgraph "Externo"
        PayPalAPI([API PayPal Sandbox])
    end

    Browser --> App
    App --> CarritoComp
    CarritoComp --> CarritoSvc
    CarritoComp --> PaypalSvc
    CarritoComp --> UserSvc
    CarritoComp --> TicketSvc_FE

    PaypalSvc -->|POST create/capture| Express
    UserSvc -->|POST /api/usuarios| Express
    TicketSvc_FE -->|POST /api/tickets| Express
    App -->|GET /api/productos| Express

    Express --> ProdCtrl --> Pool
    Express --> UserCtrl --> UserSvcBE --> Pool
    Express --> PPCtrl --> PPSvc -->|OAuth2 + Orders API| PayPalAPI
    Express --> TicketCtrl --> TicketSvcBE --> Pool

    Pool --> DB
    DB --- T_prod
    DB --- T_usr
    DB --- T_tkt
```

---

## 8. SQL — Tablas existentes en producción

### Tabla `usuarios`
```sql
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    nombre     VARCHAR(100) NOT NULL,
    apellido   VARCHAR(100) NOT NULL,
    telefono   VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Tabla `tickets`
```sql
CREATE TABLE IF NOT EXISTS tickets (
    id_ticket    INT AUTO_INCREMENT PRIMARY KEY,
    orderId      VARCHAR(50) NOT NULL,
    id_usuario   INT NOT NULL,
    fecha_compra DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metodo_pago  VARCHAR(50) DEFAULT 'PayPal',
    subtotal     DECIMAL(10,2) NOT NULL,
    impuestos    DECIMAL(10,2) NOT NULL,
    total        DECIMAL(10,2) NOT NULL,
    estado       VARCHAR(20) DEFAULT 'APROBADO',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    INDEX idx_orderId (orderId),
    INDEX idx_usuario (id_usuario),
    INDEX idx_fecha   (fecha_compra)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Consultas de ejemplo

```sql
-- Todas las compras de un usuario
SELECT t.id_ticket, t.orderId, t.fecha_compra, t.total, t.estado
FROM tickets t
WHERE t.id_usuario = 1
ORDER BY t.fecha_compra DESC;

-- Reporte de ventas por usuario
SELECT
    u.id_usuario,
    CONCAT(u.nombre, ' ', u.apellido) AS cliente,
    u.email,
    COUNT(t.id_ticket)  AS total_compras,
    SUM(t.total)        AS gasto_total
FROM usuarios u
LEFT JOIN tickets t ON u.id_usuario = t.id_usuario
GROUP BY u.id_usuario
ORDER BY gasto_total DESC;

-- Detalle de un ticket
SELECT
    t.id_ticket,
    t.orderId,
    u.nombre, u.apellido, u.email,
    t.fecha_compra, t.metodo_pago,
    t.subtotal, t.impuestos, t.total, t.estado
FROM tickets t
JOIN usuarios u ON t.id_usuario = u.id_usuario
WHERE t.id_ticket = 1;
```

---

## Notas de Implementación

### Patrones utilizados:
| Patrón | Dónde |
|--------|-------|
| **Singleton** | CarritoService, UserService, TicketService (Angular `providedIn: 'root'`) |
| **Observer / Reactive** | Angular Signals + Computed en CarritoService |
| **Service Layer** | Controllers → Services → DB Pool (backend) |
| **Repository** | UserService y TicketService (Node.js) encapsulan queries |
| **Pool de conexiones** | mysql2 `createPool` con límite de 10 conexiones |

### Decisiones de diseño:
- **Items no se persisten en BD**: el carrito vive en memoria (Signals). Solo el resumen financiero queda en `tickets`.
- **Usuario temporal**: si el cliente no tiene sesión al pagar, se crea un usuario con email `invitado_<timestamp>@temp.com`.
- **SSR guard**: `UserService` usa `isPlatformBrowser` antes de acceder a `localStorage` para compatibilidad con SSR.
- **price como string**: MySQL devuelve `DECIMAL` como string; se aplica `Number()` en todos los cálculos del frontend.
