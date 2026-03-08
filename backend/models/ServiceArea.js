const mongoose = require('mongoose');

const ServiceAreaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    polygon: {
        type: {
            type: String,
            enum: ['Polygon'],
            required: true,
            default: 'Polygon'
        },
        coordinates: {
            type: [[[Number]]], // Array of arrays of arrays [lng, lat]
            required: true
        }
    },
    tierPricing: [{
        tierId: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

ServiceAreaSchema.index({ polygon: '2dsphere' });

module.exports = mongoose.model('ServiceArea', ServiceAreaSchema);
