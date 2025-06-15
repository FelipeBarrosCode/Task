const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { Role } = require('../enums');
const { createAccessToken } = require('../utils/jwt');
const config = require('../config');
const logger = require('../utils/logger');

const router = express.Router();

// Login endpoint
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    console.log("Login endpoint called");
    logger.info("=== Login Process Start ===");
    logger.info(`Login attempt for username: ${req.body.username}`);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        detail: 'Validation errors',
        errors: errors.array()
      });
    }

    const { username, password, email } = req.body;
    
    // Find user in database - checking both username AND email
    let user = await User.findOne({ 
      username: username, 
      email: email 
    });
    logger.info(`Database query result: ${user ? 'User found' : 'User not found'}`);
    
    if (!user) {
      logger.info("User not found");
      return res.status(401).json({
        detail: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      logger.info("Invalid password");
      return res.status(401).json({
        detail: 'Invalid credentials'
      });
    }

    // Create token payload
    const tokenData = {
      sub: user._id, // Use user ID as subject
      email: email,
      role: user.role,
      organizationId: user.organizationID
    };

    // Create the token
    const accessToken = createAccessToken(tokenData, config.jwtExpireMinutes);
    logger.info(`Generated token (first 20 chars): ${accessToken.substring(0, 20)}...`);
    
    logger.info("=== Login Process End ===");
    
    res.json({
      jwt_token: accessToken,
    });

  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      detail: 'Internal server error during login'
    });
  }
});

// Signup endpoint
router.post('/signup', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('organization').notEmpty().withMessage('Organization is required'),
  body('role').isIn([Role.VIEWER, Role.MANAGER]).withMessage('Invalid role')
], async (req, res) => {
  try {
    logger.info("=== Signup Process Start ===");
    logger.info(`Signup attempt for email: ${req.body.email}`);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        detail: 'Validation errors',
        errors: errors.array()
      });
    }

    const { username, password, email, organization, role } = req.body;

    // Check if user already exists - checking both email AND username
    const existingUser = await User.findOne({ 
        email: email,
        username: username 
    });
    
    if (existingUser) {
      logger.info("Signup failed: User already exists");
      return res.status(400).json({
        detail: existingUser.email === email ? 'Email already exists' : 'Username already exists'
      });
    }

    // Find or create organization
    let org;
    try {
      // Try to find existing organization
      org = await Organization.findOne({ name: organization });
      
      if (!org) {
        // Create new organization if it doesn't exist
        org = new Organization({ name: organization });
        await org.save();
        logger.info(`Created new organization: ${organization}`);
      }
    } catch (error) {
      logger.error(`Error handling organization: ${error.message}`);
      return res.status(500).json({
        detail: 'Error processing organization'
      });
    }

    // Create new user with organization reference
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      hashedPassword,
      organizationID: org._id,
      role: role || Role.VIEWER
    });

    await user.save();
    logger.info("New user created successfully");

    // Create token payload
    const tokenData = {
      sub: user._id, // Use user ID as subject
      email: email,
      role: user.role,
      organizationId: org._id // Include organization ID in token
    };

    // Create the token
    const accessToken = createAccessToken(tokenData, config.jwtExpireMinutes);
    logger.info(`Generated token (first 20 chars): ${accessToken.substring(0, 20)}...`);

    logger.info("=== Signup Process End ===");

    res.status(201).json({
      jwt_token: accessToken,
      organization: {
        name: org.name,
        id: org._id
      }
    });

  } catch (error) {
    logger.error(`Signup error: ${error.message}`);
    res.status(500).json({
      detail: 'Internal server error during signup'
    });
  }
});

module.exports = router; 