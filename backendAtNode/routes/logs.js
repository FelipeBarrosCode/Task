const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const Log = require('../models/Log');
const User = require('../models/User');
const { LogLevel, LogFormat } = require('../enums');
const { detectLogFormatAndParse } = require('../utils/logParser');
const { verifyToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const moment = require('moment');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/logs';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept only .log, .txt, .json, and .jsonl files
  const allowedExtensions = ['.log', '.txt', '.json', '.jsonl'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only .log, .txt, .json, and .jsonl files are allowed.'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get logs with filtering and pagination
router.get('/', [
  query('level').optional().isIn(Object.values(LogLevel)).withMessage('Invalid log level'),
  query('format').optional().isIn(Object.values(LogFormat)).withMessage('Invalid log format'),
  query('tag').optional().custom((value) => {
    if (typeof value === 'string' || Array.isArray(value)) {
      return true;
    }
    return false;
  }).withMessage('Tags must be a string or array'),
  query('start_date').optional().isISO8601().withMessage('Invalid start_date format'),
  query('end_date').optional().isISO8601().withMessage('Invalid end_date format'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be 0 or greater')
], async (req, res) => {
  try {
    // Access user data from res.locals
    const userData = res.locals.userData;
    
    // Use userData.role for access control
    if (userData.role === 'viewer') {
      // Handle viewer access
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        detail: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      level,
      format,
      tag,
      start_date,
      end_date,
      search,
      limit = 10,
      offset = 0
    } = req.query;

    // Build the filter query - ALWAYS filter by organization
    const query = {
      organizationID: userData.organizationID
    };
    
    // Add level filter
    if (level) {
      query.level = level.toLowerCase();
    }
    
    // Add format filter
    if (format) {
      query.format = format;
    }
    
    // Add date range filters
    if (start_date || end_date) {
      const dateQuery = {};
      if (start_date) {
        dateQuery.$gte = new Date(start_date);
      }
      if (end_date) {
        dateQuery.$lte = new Date(end_date);
      }
      query.timestamp = dateQuery;
    }
    
    // Add text search
    if (search) {
      query.$or = [
        { message: { $regex: search, $options: 'i' } },
        { format: { $regex: search, $options: 'i' } },
        { 'meta': { $regex: search, $options: 'i' } }
      ];
    }

    logger.debug('Query parameters:', { query, tag });

    // Get all logs matching the basic criteria (without tag filtering)
    let logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .lean();

    // Apply tag filtering using JavaScript if tags are provided
    if (tag) {
      // Convert single tag to array if needed
      const tags = Array.isArray(tag) ? tag : [tag];
      // Filter out any empty strings
      const validTags = tags.filter(t => t && t.trim() !== '');
      
      if (validTags.length > 0) {
        logs = logs.filter(log => {
          // Check if log has meta data
          if (!log.meta || typeof log.meta !== 'object') {
            return false;
          }
          
          // Check if all tags match (AND logic for multiple tags)
          return validTags.every(tagValue => {
            // Check keys
            if (Object.keys(log.meta).some(k => k === tagValue)) {
              return true;
            }
            // Check values (convert all to string for comparison)
            if (Object.values(log.meta).some(v => String(v) === tagValue)) {
              return true;
            }
            return false;
          });
        });
      }
    }

    // Get total count after filtering
    const totalLogs = logs.length;

    // Ensure offset doesn't exceed total logs
    const safeOffset = Math.min(parseInt(offset), Math.max(totalLogs - 1, 0));
    
    // Apply pagination to the filtered results
    let paginatedLogs = logs.slice(safeOffset, safeOffset + parseInt(limit));

    const totalPages = Math.ceil(totalLogs / limit);

    // Set headers
    res.set('X-Total-Count', totalLogs.toString());
    res.set('Access-Control-Expose-Headers', 'X-Total-Count');
    
    res.json({
      logs: paginatedLogs,
      pagination: {
        offset: parseInt(offset),
        limit: parseInt(limit),
        total_pages: totalPages
      }
    });

  } catch (error) {
    logger.error(`Error fetching logs: ${error.message}`);
    res.status(500).json({
      detail: 'Failed to fetch logs'
    });
  }
});

// Upload log file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        detail: 'No file uploaded'
      });
    }

    // Access user data from res.locals
    const userData = res.locals.userData;

    logger.info(`Processing uploaded file: ${req.file.originalname}`);
    
    // Process the file line by line
    const fileStream = fs.createReadStream(req.file.path);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    const parsedLogs = [];
    let lineNumber = 0;
    let errorCount = 0;

    for await (const line of rl) {
      lineNumber++;
      
      if (line.trim() === '') {
        continue; // Skip empty lines
      }

      try {
        const parsedLog = detectLogFormatAndParse(line.trim());

        // Flatten meta object if it exists
        let flattenedMeta = {};
        if (parsedLog.meta && typeof parsedLog.meta === 'object') {
          // Function to flatten nested objects keeping original key names
          const flattenObject = (obj) => {
            const flattened = {};
            
            Object.entries(obj).forEach(([key, value]) => {
              if (value && typeof value === 'object' && !Array.isArray(value)) {
                const nested = flattenObject(value);
                Object.assign(flattened, nested);
              } else {
                flattened[key] = value;
              }
            });
            
            return flattened;
          };
          
          flattenedMeta = flattenObject(parsedLog.meta);
        }
        
        // Add organization ID and other required fields
        const logEntry = {
          timestamp: new Date(parsedLog.timestamp),
          level: parsedLog.level,
          service: parsedLog.service,
          message: parsedLog.message,
          format: parsedLog.format,
          organizationID: userData.organizationID,
          meta: flattenedMeta,
          original_level: parsedLog.level
        };

        parsedLogs.push(logEntry);
      } catch (error) {
        errorCount++;
        logger.warn(`Error parsing line ${lineNumber}: ${error.message}`);
        
        // Create error log entry for unparseable lines
        const errorLog = {
          timestamp: new Date(),
          level: 'error',
          service: 'log-parser',
          message: `Failed to parse line ${lineNumber}: ${error.message}`,
          format: LogFormat.JSON_LINES,
          organizationID: userData.organizationID,
          meta: { 
            original_line: line,
            line_number: lineNumber,
            file_name: req.file.originalname
          },
          original_level: 'error'
        };
        
        parsedLogs.push(errorLog);
      }
    }

    // Batch insert all parsed logs
    if (parsedLogs.length > 0) {
      try {
        console.log(parsedLogs);
        await Log.insertMany(parsedLogs);
        logger.info(`Successfully inserted ${parsedLogs.length} logs from file ${req.file.originalname}`);
      } catch (dbError) {
        logger.error(`Database error inserting logs: ${dbError.message}`);
        return res.status(500).json({
          detail: 'Failed to save logs to database'
        });
      }
    }

    // Clean up uploaded file after processing
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      logger.warn(`Failed to cleanup uploaded file: ${cleanupError.message}`);
    }

    res.status(200).json({
      message: 'File processed successfully',
      stats: {
        total_lines: lineNumber,
        parsed_logs: parsedLogs.length,
        error_count: errorCount,
        file_name: req.file.originalname,
        file_size: req.file.size
      }
    });

  } catch (error) {
    logger.error(`Error processing uploaded file: ${error.message}`);
    
    // Clean up uploaded file in case of error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        logger.warn(`Failed to cleanup uploaded file after error: ${cleanupError.message}`);
      }
    }
    
    res.status(500).json({
      detail: error.message || 'Failed to process uploaded file'
    });
  }
});

// Create a new log
router.post('/ingest', [
  body('level').isIn(Object.values(LogLevel)).withMessage('Invalid log level'),
  body('service').notEmpty().withMessage('Service is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('format').isIn(Object.values(LogFormat)).withMessage('Invalid log format'),
  body('meta').optional().isObject().withMessage('Meta must be an object')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        detail: 'Validation errors',
        errors: errors.array()
      });
    }

    // Access user data from res.locals
    const userData = res.locals.userData;

    const { level, service, message, format, meta = {} } = req.body;
    
    const log = new Log({
      timestamp: new Date(),
      level: level.toLowerCase(),
      service: service,
      message: message,
      format: format,
      organizationID: userData.organizationID,
      meta: meta,
      original_level: level
    });
    
    await log.save();
    
    res.status(201).json({
      message: 'Log created successfully',
      log_id: log._id.toString(),
      log: {
        _id: log._id,
        timestamp: log.timestamp,
        level: log.level,
        service: log.service,
        message: log.message,
        format: log.format,
        meta: log.meta,
        original_level: log.original_level
      }
    });

  } catch (error) {
    logger.error('Error creating log:', error);
    res.status(500).json({
      detail: 'Failed to create log'
    });
  }
});

// Get a single log by ID
router.get('/:log_id', [
  param('log_id').isMongoId().withMessage('Invalid log ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        detail: 'Validation errors',
        errors: errors.array()
      });
    }

    const log = await Log.findById(req.params.log_id).lean();
    
    if (!log) {
      return res.status(404).json({
        detail: 'Log not found'
      });
    }
    
    res.status(200).json(log);

  } catch (error) {
    console.error('Error fetching log:', error);
    res.status(500).json({
      detail: 'Failed to fetch log'
    });
  }
});

// Update a log (PATCH)
router.patch('/:log_id', [
  param('log_id').isMongoId().withMessage('Invalid log ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        detail: 'Validation errors',
        errors: errors.array()
      });
    }
    logger.info("-----Information Update-----");

    const log = await Log.findById(req.params.log_id);
    
    if (!log) {
      return res.status(404).json({
        detail: 'Log not found'
      });
    }
    console.log(req.body);
    // Update log with provided fields
    Object.assign(log, req.body);
    await log.save();
    
    res.status(200).json({
      message: 'Log patched successfully'
    });

  } catch (error) {
    console.error('Error updating log:', error);
    res.status(500).json({
      detail: 'Failed to update log'
    });
  }
});

// Update a log message (PUT)
router.put('/:log_id', [
  param('log_id').isMongoId().withMessage('Invalid log ID'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        detail: 'Validation errors',
        errors: errors.array()
      });
    }

    const log = await Log.findById(req.params.log_id);
    
    if (!log) {
      return res.status(404).json({
        detail: 'Log not found'
      });
    }
    
    log.message = req.body.message;
    await log.save();
    
    res.json({
      message: 'Log updated successfully'
    });

  } catch (error) {
    console.error('Error updating log:', error);
    res.status(500).json({
      detail: 'Failed to update log'
    });
  }
});

// Delete a log
router.delete('/:log_id', [
  param('log_id').isMongoId().withMessage('Invalid log ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        detail: 'Validation errors',
        errors: errors.array()
      });
    }

    const result = await Log.findByIdAndDelete(req.params.log_id);
    
    if (!result) {
      return res.status(404).json({
        detail: 'Log not found'
      });
    }
    
    res.json({
      message: 'Log deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({
      detail: 'Failed to delete log'
    });
  }
});

module.exports = router; 