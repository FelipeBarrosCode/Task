const { verifyToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const User = require('../models/User');

const jwtValidationMiddleware = async (req, res, next) => {
  try {
    logger.info("=== JWT Validation Start ===");
    
    // Log all headers
    logger.debug("All Headers:");
    Object.entries(req.headers).forEach(([key, value]) => {
      logger.debug(`${key}: ${value}`);
    });
    
    // Skip JWT validation for login, health check endpoints and OPTIONS requests
    if (["/auth/signup", "/auth/login", "/health"].includes(req.path) || req.method === "OPTIONS") {
      logger.info("Skipping validation for exempt path");
      return next();
    }

    // Get the JWT token from the request header
    logger.info("Attempting to get authorization credentials...");
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn("No authentication credentials found");
      return res.status(401).json({
        detail: "Bearer authentication required"
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      logger.warn("Invalid authentication scheme");
      return res.status(401).json({
        detail: "Bearer authentication required"
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      logger.debug(`Received credentials scheme: Bearer`);
      logger.debug(`Token start: ${token.substring(0, 20)}...`);
      
      // Verify and decode the JWT token
      logger.info("Attempting to decode token...");
      const payload = verifyToken(token);
      logger.debug(`Decoded payload: ${JSON.stringify(payload)}`);
      
      const username = payload.sub || payload.username;
      if (!username) {
        logger.warn("No username (sub) found in token payload");
        return res.status(401).json({
          detail: "Invalid authentication token - no username"
        });
      }

      // Check token expiration (handled by jwt.verify)
      logger.info("Token validation successful!");
      
      // Add the decoded token to the request
      req.user = payload;
      req.token = token;

      // Fetch and store user data in res.locals
      const user = await User.findOne({email: payload.email, _id: payload.sub});
      if (!user) {
        logger.warn("User not found in database");
        return res.status(404).json({
          detail: "User not found"
        });
      }

      // Store user data in res.locals
      res.locals.userData = user;
      logger.info("User data stored in res.locals");

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.error("Token validation failed: Expired signature");
        return res.status(401).json({
          detail: "Token has expired"
        });
      } else if (error.name === 'JsonWebTokenError') {
        logger.error(`Token validation failed: Invalid token - ${error.message}`);
        return res.status(401).json({
          detail: `Invalid token: ${error.message}`
        });
      } else {
        logger.error(`Token validation failed: JWT Error - ${error.message}`);
        return res.status(401).json({
          detail: `Invalid authentication token: ${error.message}`
        });
      }
    }

    logger.info("=== JWT Validation End ===");
    next();

  } catch (error) {
    logger.error(`Unexpected error during validation: ${error.message}`);
    return res.status(500).json({
      detail: "Internal server error during authentication"
    });
  }
};

module.exports = jwtValidationMiddleware; 