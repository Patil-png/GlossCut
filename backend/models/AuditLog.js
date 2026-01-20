const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS'],
    required: true
  },
  entity: {
    type: String,
    required: true
  }, // e.g., 'User', 'Booking'
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }, // Stores { newValues: { ... }, modifiedPaths: [] }
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  // Ensure we don't leak internal versioning
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance (Admin Dashboard Queries)
auditLogSchema.index({ entity: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 }); // For "Recent Activity"

module.exports = mongoose.model('AuditLog', auditLogSchema);