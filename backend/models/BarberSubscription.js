const mongoose = require('mongoose');

const barberSubscriptionSchema = new mongoose.Schema({
    barberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'expired', 'failed'],
        default: 'pending',
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    razorpayOrderId: {
        type: String,
    },
    razorpayPaymentId: {
        type: String,
    },
}, {
    timestamps: true,
});

const BarberSubscription = mongoose.model('BarberSubscription', barberSubscriptionSchema);

module.exports = BarberSubscription;
