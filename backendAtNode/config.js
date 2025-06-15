require('dotenv').config();

module.exports = {
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb+srv://0801felipe:Casa8301@cluster0.mcf6cuy.mongodb.net/logs_db?retryWrites=true&w=majority&appName=Cluster0',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || '8ab2f76d544d6b04071ea40e3c6c3c02fb18e90651950787d99eb1df0feae1cbc9fccb8efc9d6b52236536bc9be04a96a4f4cdbdfb4925f6b6211f7ed14b0654',
  jwtExpireMinutes: parseInt(process.env.JWT_EXPIRE_MINUTES) || 60,
  
  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*']
}; 