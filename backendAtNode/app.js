const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDatabase } = require('./database');
const config = require('./config');
const logger = require('./utils/logger');

// Import middleware
const jwtValidationMiddleware = require('./middleware/jwtValidation');
const roleCheckMiddleware = require('./middleware/roleCheck');

// Import routes
const authRoutes = require('./routes/auth');
const logsRoutes = require('./routes/logs');

const app = express();

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = config.allowedOrigins;
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Apply CORS middleware with options
app.use(cors(corsOptions));

// Apply security middleware
app.use(helmet());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply JWT and Role check middlewares globally
// Note: These will skip exempt paths automatically
app.use(jwtValidationMiddleware);
app.use(roleCheckMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/logs', logsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    detail: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  
  // Don't leak error details in production
  const message = config.nodeEnv === 'development' ? err.message : 'Internal server error';
  
  res.status(err.status || 500).json({
    detail: message
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    const server = app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Only start server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app; 