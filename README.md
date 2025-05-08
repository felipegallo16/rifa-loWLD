# Rifa LoWLD

Aplicación de rifas integrada con World ID, permitiendo la verificación de identidad única para la participación en rifas usando WLD tokens.

## Características

- Autenticación con World ID
- Compra de tickets usando WLD tokens
- Sistema de rifas automatizado
- Interfaz moderna y responsiva
- Backend seguro con Node.js/TypeScript
- Frontend con Next.js y Tailwind CSS

## Requisitos

- Node.js 18 o superior
- SQLite
- World ID API Key

## Instalación

1. Clonar el repositorio:
```bash
git clone git@github.com:felipegallo16/rifa-loWLD.git
cd rifa-loWLD
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
Crear un archivo `.env` con las siguientes variables:
```env
PORT=3001
DATABASE_URL="file:./dev.db"
WORLD_ID_APP_ID="app_..."
WORLD_ID_ACTION_NAME="..."
WORLD_ID_RECEIVER_ADDRESS="..."
```

4. Ejecutar migraciones:
```bash
npx prisma migrate dev
```

5. Iniciar el servidor:
```bash
npm run dev
```

## Estructura del Proyecto

- `/src` - Código fuente del backend
  - `/controllers` - Controladores de la aplicación
  - `/routes` - Rutas de la API
  - `/services` - Lógica de negocio
  - `/middleware` - Middlewares de Express
  - `/types` - Tipos de TypeScript
  - `/utils` - Utilidades

## Licencia

MIT 