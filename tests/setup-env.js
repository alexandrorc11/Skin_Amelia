// Variables de entorno SOLO para pruebas (no son secretos reales).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-solo-para-pruebas-automatizadas-0123456789';
process.env.DB_PATH = ':memory:';
process.env.RATE_LIMIT_GENERAL = '100000';
process.env.RATE_LIMIT_LOGIN = '100000';
