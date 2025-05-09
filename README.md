# World WinTrust

Este es un proyecto de rifas integrado con World ID. El proyecto está estructurado como un monorepo que contiene el backend, frontend y la mini app de World ID.

## Estructura del Proyecto

```
/
├── backend/          # API REST con Node.js, Express y Prisma
├── frontend/         # Aplicación Next.js con TypeScript y Tailwind
└── worldcoin-miniapp/  # Mini App de World ID
```

## Tecnologías Principales

### Backend
- Node.js con Express
- Prisma como ORM
- TypeScript
- Integración con World ID

### Frontend
- Next.js 13+
- TypeScript
- Tailwind CSS
- Integración con World ID

### World ID Mini App
- Next.js
- World ID Minikit
- TypeScript
- Tailwind CSS

## Requisitos

- Node.js 18 o superior
- npm 8 o superior

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/felipegallo16/world-wintrust.git
cd world-wintrust
```

2. Instala las dependencias del monorepo:
```bash
npm install
```

3. Configura las variables de entorno:
- Copia `.env.example` a `.env` en la carpeta backend
- Copia `.env.example` a `.env` en la carpeta frontend
- Copia `.env.example` a `.env` en la carpeta worldcoin-miniapp
- Configura las variables necesarias en cada archivo

## Desarrollo

Para ejecutar todos los servicios en modo desarrollo:
```bash
npm run dev
```

Para ejecutar servicios específicos:
```bash
npm run dev:backend    # Solo backend
npm run dev:frontend   # Solo frontend
npm run dev:miniapp    # Solo World ID Mini App
```

## Construcción

Para construir todos los proyectos:
```bash
npm run build
```

Para construir servicios específicos:
```bash
npm run build:backend    # Solo backend
npm run build:frontend   # Solo frontend
npm run build:miniapp    # Solo World ID Mini App
```

## Licencia

MIT 