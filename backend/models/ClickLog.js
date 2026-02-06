const mongoose = require('mongoose');

const ClickLogSchema = new mongoose.Schema({
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    targetType: {
        type: String,
        enum: ['shop', 'barber'],
        required: true
    },
    ip: {
        type: String,
        required: true
    },
    userAgent: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // TTL Index: Automatically delete documents after 24 hours (86400 seconds)
    }
});

// Compound index to quickly check if IP has clicked Target recently
ClickLogSchema.index({ targetId: 1, ip: 1 });

module.exports = mongoose.model('ClickLog', ClickLogSchema);
