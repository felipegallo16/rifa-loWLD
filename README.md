# Rifa-lo 🎫

Una plataforma de sorteos verificados usando World ID para garantizar la transparencia y legitimidad de los participantes.

## Características 🌟

- Sistema de sorteos con verificación de identidad usando World ID
- Tickets personalizables con números a elección
- Sistema de reserva temporal de números
- Sugerencia de números (secuenciales, lucky, random)
- Búsqueda y filtrado de números disponibles
- Sistema de pago con tokens de Worldcoin
- Seguridad robusta con rate limiting y auditoría

## Tecnologías 🛠

- Node.js & TypeScript
- Express.js
- Prisma ORM
- Redis para rate limiting
- Winston para logging
- World ID para verificación de identidad
- Worldcoin para pagos

## Requisitos Previos 📋

- Node.js 18+
- Redis
- PostgreSQL
- Cuenta de World ID
- Tokens de Worldcoin para testing

## Instalación 🚀

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/rifa-lo.git
cd rifa-lo
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

4. Ejecutar migraciones de la base de datos:
```bash
npx prisma migrate dev
```

5. Iniciar el servidor:
```bash
npm run dev
```

## Estructura del Proyecto 📁

```
src/
├── controllers/     # Controladores de la aplicación
├── middleware/     # Middleware personalizado
├── routes/         # Definición de rutas
├── services/       # Lógica de negocio
├── types/         # Tipos TypeScript
└── utils/         # Utilidades y helpers
```

## API Endpoints 🔌

### Sorteos
- `GET /api/raffles` - Listar sorteos
- `POST /api/raffles` - Crear sorteo
- `GET /api/raffles/:id` - Obtener sorteo
- `PUT /api/raffles/:id` - Actualizar sorteo
- `DELETE /api/raffles/:id` - Eliminar sorteo

### Tickets
- `GET /api/tickets` - Listar tickets
- `POST /api/tickets` - Comprar ticket
- `GET /api/tickets/:id` - Obtener ticket
- `GET /api/tickets/suggest` - Sugerir números

### Verificación
- `POST /api/verify` - Verificar identidad con World ID

## Seguridad 🔒

- Rate limiting por IP y por usuario
- Validación de datos con Zod
- Protección contra XSS, CSRF y SQL Injection
- Sistema de auditoría con Winston logger
- Monitoreo de actividades sospechosas

## Contribuir 🤝

1. Fork el proyecto
2. Crear una rama (`git checkout -b feature/amazing`)
3. Commit los cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing`)
5. Abrir un Pull Request

## Licencia 📄

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto 📧

Tu Nombre - [@tutwitter](https://twitter.com/tutwitter) - email@example.com

Link del proyecto: [https://github.com/tu-usuario/rifa-lo](https://github.com/tu-usuario/rifa-lo) 