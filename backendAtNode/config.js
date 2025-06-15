require('dotenv').config();

module.exports = {
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb+srv://0801felipe:Casa8301@cluster0.mcf6cuy.mongodb.net/logs_db?retryWrites=true&w=majority&appName=Cluster0',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || '6acf2744282fae154fba99d84b1e5e6029634e9cea75c37bd8993358564c98d76824c95ed842c8e9d94dadeb039a1e599720b08e42b379df0227e8e50450d95a',
  jwtExpireMinutes: parseInt(process.env.JWT_EXPIRE_MINUTES) || 60,
  
  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*']
}; 