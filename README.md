# Estampa HN — Tienda de Camisas Personalizadas

**Código de verificación:** `LEARN-CAP-0D656C92`

## Descripción del Proyecto
Plataforma web de comercio electrónico para la venta y personalización de camisas (**Estampa HN**). Permite a los clientes explorar el catálogo, configurar tallas/diseños y gestionar pedidos, mientras que los administradores disponen de un panel de control para administrar inventario, productos y estados de órdenes.

## Arquitectura y Tecnologías
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla ES6+)
- **Backend / Base de datos:** Supabase (PostgreSQL, Auth y Row Level Security)
- **Control de versiones:** Git & GitHub

## Estructura del Proyecto
- `index.html` — Estructura principal de la aplicación web
- `css/styles.css` — Estilos y diseño responsivo
- `js/app.js` — Lógica de interfaz, catálogo, carrito y flujos de usuario
- `verificacion.txt` — Archivo de verificación de autoría del proyecto

## Funcionalidades Principales
- Catálogo interactivo de camisas con filtros y vista de detalle.
- Carrito de compras y simulación/procesamiento de checkout.
- Sistema de roles (`customer` y `admin`) con autenticación y políticas de seguridad.
- Panel administrativo para CRUD de productos y gestión de pedidos.