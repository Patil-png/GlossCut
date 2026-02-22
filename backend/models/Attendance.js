const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['in', 'out'],
        required: true
    },
    time: {
        type: String, // HH:mm
        required: true
    },
    latitude: Number,
    longitude: Number,
    distance: Number, // distance from shop in meters
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    logs: [attendanceLogSchema]
}, { timestamps: true });

// Ensure one record per worker per day per shop
attendanceSchema.index({ workerId: 1, shopId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
