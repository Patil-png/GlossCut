const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/EncryptionService');

const serviceCategorySchema = new mongoose.Schema({
    name: {
        type: Object,
        required: true,
        set: encrypt,
        get: decrypt,
    },
    emoji: {
        type: Object,
        default: '✨',
        set: encrypt,
        get: decrypt,
    },
    color: {
        type: Object,
        default: '#6366F1',
        set: encrypt,
        get: decrypt,
    },
    gender: {
        type: Object,
        enum: ['male', 'female', 'unisex'],
        default: 'unisex',
        set: encrypt,
        get: decrypt,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    toJSON: { getters: true },
    toObject: { getters: true }
});

const ServiceCategory = mongoose.model('ServiceCategory', serviceCategorySchema);

module.exports = ServiceCategory;
