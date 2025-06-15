const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4()
  }
}, {
  timestamps: true,
  collection: 'organizations'
});

// Create a compound index on name to ensure uniqueness
organizationSchema.index({ name: 1 }, { unique: true });
// Create index for publicId
organizationSchema.index({ publicId: 1 }, { unique: true });

module.exports = mongoose.model('Organization', organizationSchema); 