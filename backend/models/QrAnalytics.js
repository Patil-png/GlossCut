const mongoose = require('mongoose');

const qrAnalyticsSchema = new mongoose.Schema({
    salon_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true,
        index: true
    },
    device_type: {
        type: String,
        enum: ['Mobile', 'Desktop', 'Tablet', 'Unknown'],
        default: 'Unknown'
    },
    ip_address: {
        type: String,
        select: false // Privacy: Don't return by default
    },
    customer_name: {
        type: Object, // Stores { iv, authTag, content }
        default: null
    },
    customer_phone: {
        type: Object, // Stores { iv, authTag, content }
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now,
        index: true // For range queries
    }
});

// Compound index for analytics aggregation
qrAnalyticsSchema.index({ salon_id: 1, created_at: -1 });

module.exports = mongoose.model('QrAnalytics', qrAnalyticsSchema);
