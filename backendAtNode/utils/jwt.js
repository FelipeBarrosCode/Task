const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('./logger');

const createAccessToken = (data, expiresInMinutes = null) => {
  logger.info("=== Token Creation Start ===");
  
  const payload = { ...data };
  logger.info(`Initial payload: ${JSON.stringify(payload)}`);
  
  const expiresIn = expiresInMinutes ? `${expiresInMinutes}m` : `${config.jwtExpireMinutes}m`;
  
  try {
    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn,
      algorithm: 'HS256'
    });
    
    logger.info(`Token created successfully (first 20 chars): ${token.substring(0, 20)}...`);
    logger.info("=== Token Creation End ===");
    
    return token;
  } catch (error) {
    logger.error(`Error creating token: ${error.message}`);
    throw error;
  }
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch (error) {
    throw error;
  }
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  createAccessToken,
  verifyToken,
  decodeToken
}; 