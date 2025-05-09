# World Rifa-lo

Este es un proyecto de rifas integrado con World ID. El proyecto está estructurado como un monorepo que contiene tanto el backend como el frontend de la aplicación.

## Estructura del Proyecto

```
/
├── backend/     # API REST con Node.js, Express y Prisma
└── frontend/    # Aplicación Next.js con TypeScript y Tailwind
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

## Requisitos

- Node.js 18 o superior
- npm 8 o superior

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/felipegallo16/world-rifa-lo.git
cd world-rifa-lo
```

2. Instala las dependencias del monorepo:
```bash
npm install
```

3. Configura las variables de entorno:
- Copia `.env.example` a `.env` en la carpeta backend
- Copia `.env.example` a `.env` en la carpeta frontend
- Configura las variables necesarias en ambos archivos

## Desarrollo

Para ejecutar tanto el backend como el frontend en modo desarrollo:
```bash
npm run dev
```

Para ejecutar solo el backend:
```bash
npm run dev:backend
```

Para ejecutar solo el frontend:
```bash
npm run dev:frontend
```

## Construcción

Para construir ambos proyectos:
```bash
npm run build
```

## Licencia

MIT 