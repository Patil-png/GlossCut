const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const BarberSubscription = require('../models/BarberSubscription');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route   GET api/subscription/plans
// @desc    Get all active subscription plans
// @access  Private (Barber)
router.get('/plans', auth, async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find({ isActive: true });
        res.json(plans);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/subscription/order
// @desc    Create a Razorpay order for a subscription
// @access  Private (Barber)
router.post('/order', auth, async (req, res) => {
    try {
        const { planId } = req.body;
        const plan = await SubscriptionPlan.findById(planId);
        if (!plan || !plan.isActive) {
            return res.status(404).json({ msg: 'Subscription plan not found or inactive' });
        }

        const options = {
            amount: Math.round(plan.price * 100),
            currency: "INR",
            receipt: `SUB_${req.user.id.slice(-6)}_${Date.now().toString().slice(-6)}`,
            notes: { planId: String(planId), userId: String(req.user.id) }
        };

        const order = await razorpay.orders.create(options);

        // Create a pending subscription record
        const subscription = new BarberSubscription({
            barberId: req.user.id,
            planId: planId,
            amount: plan.price,
            razorpayOrderId: order.id,
            status: 'pending',
        });
        await subscription.save();

        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error creating subscription order');
    }
});

// @route   POST api/subscription/verify
// @desc    Verify Razorpay payment and activate subscription
// @access  Private (Barber)
router.post('/verify', auth, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // 1. Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ msg: 'Invalid payment signature' });
        }

        // 2. Find and update the subscription record
        const subscription = await BarberSubscription.findOne({ razorpayOrderId: razorpay_order_id });
        if (!subscription) {
            return res.status(404).json({ msg: 'Subscription record not found' });
        }

        const plan = await SubscriptionPlan.findById(subscription.planId);
        if (!plan) {
            return res.status(404).json({ msg: 'Associated plan not found' });
        }

        subscription.status = 'active';
        subscription.razorpayPaymentId = razorpay_payment_id;
        subscription.startDate = new Date();
        subscription.startDate = new Date();

        // Calculate end date based on duration unit
        const durationTime = plan.durationDays; // This field now represents the value (days or minutes)
        if (plan.durationUnit === 'minutes') {
            subscription.endDate = new Date(Date.now() + durationTime * 60 * 1000);
        } else {
            // Default to days
            subscription.endDate = new Date(Date.now() + durationTime * 24 * 60 * 60 * 1000);
        }
        await subscription.save();

        // 3. Update the User model
        const user = await User.findById(req.user.id);
        user.subscriptionStatus = 'active';
        user.subscriptionExpiry = subscription.endDate;
        user.currentSubscription = subscription._id;
        user.isTrial = false;
        await user.save();

        res.json({ success: true, subscription });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Verification Error');
    }
});


module.exports = router;
