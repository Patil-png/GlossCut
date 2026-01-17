const AuditLog = require('../models/AuditLog');

const SENSITIVE_FIELDS = ['password', 'token', 'otp'];
const HASHABLE_FIELDS = ['email', 'phone', 'name', 'address'];

class AuditLogger {
  static async log({ userId = null, action, entity, entityId = null, changes = null, ipAddress = null, userAgent = null }) {
    try {
      await AuditLog.create({ 
        userId, action, entity, entityId, changes, ipAddress, userAgent, timestamp: new Date() 
      });
      console.log(`[AUDIT] ${action} on ${entity} (${entityId}) by ${userId || 'system'}`);
    } catch (error) {
      console.error('Audit log error:', error.message);
    }
  }

  static sanitizeChanges(doc, paths) {
    const sanitized = {};
    paths.forEach(path => {
      if (SENSITIVE_FIELDS.some(field => path.includes(field)) && !path.includes('Hash')) {
        sanitized[path] = '[REDACTED]';
        return;
      }
      if (HASHABLE_FIELDS.includes(path)) {
        const hashField = `${path}Hash`;
        sanitized[path] = doc[hashField] ? `Hash: ${doc[hashField]}` : '[ENCRYPTED]';
        return;
      }
      const val = doc[path];
      if (val && typeof val === 'object' && val.iv) {
        sanitized[path] = '[ENCRYPTED OBJECT]';
        return;
      }
      sanitized[path] = val;
    });
    return sanitized;
  }

  static get mongoosePlugin() {
    return function(schema) {
      
      // 1. PRE-SAVE: Capture state BEFORE it is cleared
      schema.pre('save', function(next) {
        this.$locals.wasNew = this.isNew; // Remember if it was a create
        this.$locals.modifiedPaths = this.modifiedPaths(); // Snapshot changes
        next();
      });

      // 2. POST-SAVE: Log using the captured state
      schema.post('save', async function(doc) {
        try {
          const action = doc.$locals.wasNew ? 'CREATE' : 'UPDATE';
          let changes = null;

          // Use the SNAPSHOTTED paths, not current ones
          const paths = doc.$locals.modifiedPaths || [];
          
          if (!doc.$locals.wasNew && paths.length > 0) {
            changes = {
              modifiedFields: paths,
              newValues: AuditLogger.sanitizeChanges(doc, paths)
            };
          }

          await AuditLogger.log({
            // Use $locals to ensure the ID persists through the save
            userId: doc.$locals.auditUserId || doc._id,
            action,
            entity: doc.constructor.modelName,
            entityId: doc._id,
            changes
          });
        } catch (err) {
          console.error('Audit plugin error:', err);
        }
      });

      schema.post('findOneAndDelete', async function(doc) {
        if (!doc) return;
        await AuditLogger.log({
          userId: doc.$locals?.auditUserId || doc._id, // Handle context if available
          action: 'DELETE',
          entity: doc.constructor.modelName,
          entityId: doc._id,
          changes: { snapshot: 'Document Deleted' }
        });
      });
    };
  }
}

module.exports = AuditLogger;