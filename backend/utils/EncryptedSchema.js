const mongoose = require('mongoose');
const encryptionService = require('./EncryptionService');

/**
 * Base encrypted schema plugin
 * Automatically encrypts/decrypts sensitive string fields
 */
const encryptedSchemaPlugin = (schema, options = {}) => {
  const { excludeFields = [] } = options;

  // Fields that should NEVER be encrypted (system fields)
  const systemFields = new Set([
    '_id',
    '__v',
    'createdAt',
    'updatedAt',
    'timestamp',
    'date',
    'time',
    'created_at',
    'updated_at',
    'id'
  ]);

  // Add user-specified excluded fields
  excludeFields.forEach(field => systemFields.add(field));

  // Field types that should remain unencrypted
  const unencryptedTypes = new Set([
    mongoose.Schema.Types.ObjectId,
    Date,
    Number,
    Boolean
  ]);

  // Get all string paths from schema
  const getStringPaths = (schema, prefix = '') => {
    const paths = [];

    schema.eachPath((path, schemaType) => {
      const fullPath = prefix ? `${prefix}.${path}` : path;

      // Skip system fields
      if (systemFields.has(path)) return;

      // Handle nested objects
      if (schemaType.schema) {
        paths.push(...getStringPaths(schemaType.schema, fullPath));
        return;
      }

      // Handle arrays
      if (schemaType instanceof mongoose.Schema.Types.Array) {
        if (schemaType.caster instanceof mongoose.Schema.Types.String) {
          paths.push(fullPath);
        } else if (schemaType.caster.schema) {
          // Array of objects
          paths.push(...getStringPaths(schemaType.caster.schema, `${fullPath}.$`));
        }
        return;
      }

      // Include string fields
      if (schemaType instanceof mongoose.Schema.Types.String) {
        paths.push(fullPath);
      }
    });

    return paths;
  };

  const stringPaths = getStringPaths(schema);

  // Pre-save middleware: encrypt string fields
  schema.pre('save', function(next) {
    try {
      stringPaths.forEach(path => {
        const value = this.get(path);
        if (value && typeof value === 'string' && value.trim()) {
          // Check if already encrypted (has encryption structure)
          if (typeof value === 'object' && value.iv && value.authTag && value.content) {
            return; // Already encrypted
          }
          const encryptedValue = encryptionService.encrypt(value);
          this.set(path, encryptedValue);
          // Also set in _doc to ensure it persists to database
          this._doc[path] = encryptedValue;
        }
      });
      next();
    } catch (error) {
      next(error);
    }
  });

  // Pre-update middleware: encrypt string fields in updates
  schema.pre('updateOne', function(next) {
    try {
      const update = this.getUpdate();
      if (update.$set) {
        stringPaths.forEach(path => {
          if (update.$set[path] && typeof update.$set[path] === 'string') {
            // Check if already encrypted
            if (typeof update.$set[path] === 'object' &&
                update.$set[path].iv && update.$set[path].authTag && update.$set[path].content) {
              return;
            }
            update.$set[path] = encryptionService.encrypt(update.$set[path]);
          }
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  });

  // Add decryption methods
  schema.methods.getDecrypted = function(field) {
    try {
      const value = this.get(field);
      if (value && typeof value === 'object' && value.iv && value.authTag && value.content) {
        return encryptionService.decrypt(value);
      }
      return value;
    } catch (error) {
      console.error(`Failed to decrypt field ${field}:`, error.message);
      return null;
    }
  };

  schema.methods.getDecryptedData = function() {
    const decrypted = {};

    stringPaths.forEach(path => {
      const value = this.get(path);
      if (value && typeof value === 'object' && value.iv && value.authTag && value.content) {
        decrypted[path] = encryptionService.decrypt(value);
      } else {
        decrypted[path] = value;
      }
    });

    // Include all other fields
    Object.keys(this._doc).forEach(key => {
      if (!decrypted[key]) {
        decrypted[key] = this._doc[key];
      }
    });

    return decrypted;
  };

  // Add getters for automatic decryption of string fields
  stringPaths.forEach(path => {
    // Add a getter to the path that decrypts automatically
    schema.path(path).get(function(value) {
      if (value && typeof value === 'object' && value.iv && value.authTag && value.content) {
        try {
          return encryptionService.decrypt(value);
        } catch (error) {
          console.error(`Failed to decrypt field ${path}:`, error.message);
          return null;
        }
      }
      return value;
    });

    // Add virtual getters for decrypted fields (for backward compatibility)
    const virtualName = `decrypted_${path.replace(/\./g, '_')}`;
    schema.virtual(virtualName).get(function() {
      return this.getDecrypted(path);
    });
  });

  // Ensure virtuals and getters are included in JSON output
  schema.set('toJSON', { virtuals: true, getters: true });
  schema.set('toObject', { virtuals: true, getters: true });
};

module.exports = encryptedSchemaPlugin;
