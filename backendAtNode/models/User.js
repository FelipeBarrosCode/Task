const mongoose = require('mongoose');
const { Role } = require('../enums');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  hashedPassword: {
    type: String,
    required: true,
    field: 'hashed_password'
  },
  organizationID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Organization'
  },
  role: {
    type: String,
    enum: Object.values(Role),
    default: Role.VIEWER
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Create compound index for email and username
userSchema.index({ email: 1, username: 1 }, { unique: true });
// Create index for organizationID for faster lookups
userSchema.index({ organizationID: 1 });

module.exports = mongoose.model('User', userSchema); 