export const corsOptions = {
  origin: [
    'https://wintrust.site',
    'https://app.wintrust.site',
    'https://www.wintrust.site',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}; 