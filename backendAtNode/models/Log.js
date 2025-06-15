const mongoose = require('mongoose');
const { LogLevel, LogFormat } = require('../enums');

const logSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true
  },
  level: {
    type: String,
    enum: Object.values(LogLevel),
    required: true
  },
  service: {
    type: String,
    required: true
  },
  organizationID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  message: {
    type: String,
    required: false
  },
  format: {
    type: String,
    enum: Object.values(LogFormat),
    required: true
  },
  original_level: {
    type: String,
    required: false,
    field: 'original_level'
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: false,
  collection: 'logs'
});

// Create indexes for frequently queried fields
logSchema.index({ timestamp: -1 }); // Descending timestamp for sorting
logSchema.index({ level: 1 }); // For filtering by log level
logSchema.index({ service: 1 }); // For filtering by service
logSchema.index({ organizationID: 1 }); // For filtering by organization

module.exports = mongoose.model('Log', logSchema); 