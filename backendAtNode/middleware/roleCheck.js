const { Role } = require('../enums');
const logger = require('../utils/logger');

const roleCheckMiddleware = async (req, res, next) => {
  try {
    // Skip role check for non-protected endpoints and OPTIONS requests
    if (["/auth/signup", "/auth/login", "/health"].includes(req.path) || req.method === "OPTIONS") {
      return next();
    }

    logger.info("Checking user role...");
    
    try {
      // Get user data from res.locals (set by jwtValidation middleware)
      const userData = res.locals.userData;
      
      if (!userData) {
        logger.warn("No user data found in res.locals");
        return res.status(401).json({
          detail: "User data not found"
        });
      }

      // Check if user has required role for specific endpoints
      if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
        if (userData.role !== Role.MANAGER) {
          logger.warn(`Insufficient permissions for user ${userData.username}`);
          return res.status(403).json({
            detail: "Manager role required for this operation"
          });
        }
      }

      // Add the user object to the request for future use
      req.currentUser = userData;
      next();

    } catch (error) {
      if (error.name === 'TypeError') {
        logger.error(`Type error in role check: ${error.message}`);
        return res.status(500).json({
          detail: `Internal server error: ${error.message}`
        });
      } else {
        logger.error(`Unexpected error in role check: ${error.message}`);
        return res.status(500).json({
          detail: "Internal server error during authorization"
        });
      }
    }

  } catch (error) {
    if (error.name === 'TypeError') {
      logger.error(`Type error in role check: ${error.message}`);
      return res.status(500).json({
        detail: `Internal server error: ${error.message}`
      });
    } else {
      logger.error(`Unexpected error in role check: ${error.message}`);
      return res.status(500).json({
        detail: "Internal server error during authorization"
      });
    }
  }
};

module.exports = roleCheckMiddleware; 