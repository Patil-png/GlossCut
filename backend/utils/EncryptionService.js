const crypto = require('crypto');

/**
 * EncryptionService - Singleton class for AES-256-GCM encryption/decryption
 * UPDATED: Handles legacy string data gracefully to prevent crashes.
 */
class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits for GCM

    // Load encryption key from environment
    this.encryptionKey = process.env.ENCRYPTION_KEY;

    if (!this.encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Decode the Base64 key
    try {
      this.key = Buffer.from(this.encryptionKey, 'base64');
    } catch (error) {
      throw new Error('ENCRYPTION_KEY must be a valid Base64-encoded string');
    }

    // Validate key length
    if (this.key.length !== this.keyLength) {
      // OPTIONAL: If you want to force it to work with ANY password string, 
      // you could hash it here like: this.key = crypto.createHash('sha256').update(this.encryptionKey).digest();
      // But for now, we respect your strict Base64 check:
      throw new Error(`ENCRYPTION_KEY must be ${this.keyLength} bytes (256 bits) when decoded from Base64`);
    }
  }

  /**
   * Encrypts plaintext using AES-256-GCM
   */
  encrypt(plainText) {
    // 1. SAFETY: Handle empty/null
    if (!plainText) return plainText;

    // 2. PREVENTION: If it's already an encrypted object, return it as-is
    if (typeof plainText === 'object' && plainText.iv && plainText.content) {
        return plainText;
    }

    // 3. CASTING: Ensure we encrypt a string
    const textToEncrypt = String(plainText);

    try {
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher with key and IV
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      // Encrypt the data
      let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get the authentication tag
      const authTag = cipher.getAuthTag();

      return {
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        content: encrypted
      };
    } catch (error) {
      console.error(`Encryption failed for value: ${plainText}`, error);
      // Return original text if encryption fails (failsafe)
      return plainText;
    }
  }

  /**
   * Decrypts data
   * UPDATED: Returns input as-is if it's not a valid encrypted object
   */
  decrypt(encryptionPackage) {
    // 1. LEGACY DATA FIX (The Critical Part)
    // If data is just a string (e.g., "Premium Salon"), return it immediately.
    if (typeof encryptionPackage === 'string') {
      return encryptionPackage;
    }

    // 2. VALIDATION
    // If it's null, missing fields, or not an object, return it as-is 
    // instead of throwing an error (which crashes the app).
    if (
        !encryptionPackage || 
        typeof encryptionPackage !== 'object' || 
        !encryptionPackage.iv || 
        !encryptionPackage.authTag || 
        !encryptionPackage.content
    ) {
      return encryptionPackage;
    }

    try {
      const { iv, authTag, content } = encryptionPackage;

      // Convert hex strings back to buffers
      const ivBuffer = Buffer.from(iv, 'hex');
      const authTagBuffer = Buffer.from(authTag, 'hex');

      // Create decipher with key and IV
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, ivBuffer);

      // Set the authentication tag
      decipher.setAuthTag(authTagBuffer);

      // Decrypt
      let decrypted = decipher.update(content, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      // Log error but don't crash
      console.error('Decryption failed:', error.message); 
      return "Decryption Error"; 
    }
  }

  /**
   * Creates an HMAC hash for secure indexing
   */
  createHMAC(data) {
    if (!data) return null;
    if (typeof data !== 'string') {
      // Safe conversion
      data = String(data);
    }

    try {
      const hmac = crypto.createHmac('sha256', this.key);
      hmac.update(data.toLowerCase().trim());
      return hmac.digest('hex');
    } catch (error) {
      console.error('HMAC failed:', error);
      return null;
    }
  }
}

// Export singleton instance, binding methods to the instance to avoid 'this' context issues
const instance = new EncryptionService();
module.exports = {
  encrypt: instance.encrypt.bind(instance),
  decrypt: instance.decrypt.bind(instance),
  createHMAC: instance.createHMAC.bind(instance)
};