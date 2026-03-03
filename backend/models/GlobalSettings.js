const mongoose = require('mongoose');

const globalSettingsSchema = new mongoose.Schema({
    basicAppointmentFee: {
        type: Number,
        default: 9,
    },
    expressAppointmentFee: {
        type: Number,
        default: 19,
    },
    // We can add more global settings here in the future
}, {
    timestamps: true
});

// Since we only want one document for global settings, 
// we can use a fixed ID or just findOne.
const GlobalSettings = mongoose.model('GlobalSettings', globalSettingsSchema);

module.exports = GlobalSettings;
