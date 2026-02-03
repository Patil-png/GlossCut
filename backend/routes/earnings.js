const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Review = require('../models/Review');
const moment = require('moment');
const cache = require('memory-cache');
const mongoose = require('mongoose');
// IMPORT DECRYPT TO FIX "INVISIBLE TEXT" IN REPORTS
const { decrypt } = require('../utils/EncryptionService');

// Database Indexing Setup (Run once on server startup)
const setupDatabaseIndexes = async () => {
  try {
    // Compound index for main earnings queries
    await Booking.collection.createIndex({ barberId: 1, status: 1, date: -1 });

    // Index for review lookups
    await Review.collection.createIndex({ barberId: 1, userId: 1 });

    // Index for user lookups
    // Note: Indexing 'name' is less effective now that it is encrypted, but _id is main lookup
    await User.collection.createIndex({ _id: 1 });

    console.log('Database indexes optimized for earnings performance');
  } catch (error) {
    if (error.code === 8000 && error.codeName === 'AtlasError') {
      console.warn('Database index creation skipped due to insufficient permissions. Indexes may already exist or can be created manually for performance optimization.');
    } else {
      console.error('Error setting up database indexes:', error);
    }
  }
};

// @route   GET api/earnings
router.get('/', auth, async (req, res) => {
  try {
    const { filter, page = 1 } = req.query;
    const barberId = new mongoose.Types.ObjectId(req.user.id);

    // 1. Caching Strategy
    const cacheKey = `earnings_${barberId}_${filter || 'home'}_${page}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    // 2. Date Setup
    let startDate = moment().startOf('day');
    const endDate = moment().endOf('day');

    if (filter === 'week') startDate = moment().startOf('week');
    else if (filter === 'month') startDate = moment().startOf('month');

    // Dates for Growth Calculation
    const prevStartDate = moment(startDate).subtract(1, filter || 'day');
    const prevEndDate = moment(endDate).subtract(1, filter || 'day');

    // 3. The "Holy Grail" Query (Parallel Execution)
    const [currentPeriodStats, prevPeriodStats] = await Promise.all([

      // QUERY A: The Facet Pipeline (Does EVERYTHING in one go)
      Booking.aggregate([
        // Stage 1: Filter Matches (Uses Index)
        {
          $match: {
            barberId: barberId,
            status: 'completed',
            date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
          }
        },
        // Stage 2: Facet (Split processing into parallel lanes)
        {
          $facet: {
            // Lane 1: Total Earnings & Count
            "totals": [
              { $group: { _id: null, earnings: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
            ],

            // Lane 2: Tier Breakdown
            "tiers": [
              { $group: { _id: { $ifNull: ["$appointmentType", "Basic"] }, count: { $sum: 1 }, earnings: { $sum: "$totalPrice" } } }
            ],

            // Lane 3: Recent Transactions (Paginated on DB side!)
            "transactions": [
              { $sort: { date: -1 } },
              { $skip: (parseInt(page) - 1) * 20 },
              { $limit: 20 },
              { $project: { totalPrice: 1, date: 1, services: 1 } } // Only fetch needed fields
            ],

            // Lane 4: Chart Data (Dynamic Grouping)
            "chart": [
              {
                $group: {
                  _id: filter === 'day'
                    ? { $floor: { $divide: [{ $hour: '$date' }, 4] } } // 4-hour blocks
                    : filter === 'week'
                      ? { $dayOfWeek: '$date' }
                      : { $dayOfMonth: '$date' },
                  total: { $sum: '$totalPrice' }
                }
              },
              { $sort: { _id: 1 } }
            ],

            // Lane 5: Customer Stats (Heavy lifting done in DB)
            "customers": [
              {
                $group: {
                  // Smart Grouping: Use ID if online, Phone if offline
                  _id: {
                    $cond: [
                      { $eq: ["$isOfflineBooking", true] },
                      { $concat: ["offline-", "$customerPhone"] }, // customerPhone is encrypted obj but grouping by object works in Mongo
                      "$userId"
                    ]
                  },
                  // Note: customerName is Encrypted Object. We retrieve it raw here and decrypt later.
                  name: { $first: { $cond: [{ $eq: ["$isOfflineBooking", true] }, "$customerName", "$userId"] } },
                  isOffline: { $first: "$isOfflineBooking" },
                  count: { $sum: 1 },
                  realUserId: { $first: "$userId" } // Keep actual ID for lookup
                }
              },
              { $sort: { count: -1 } }
              // Note: We populate names/reviews after to keep the aggregation fast
            ]
          }
        }
      ]),

      // QUERY B: Previous Period (Only for Growth)
      Booking.aggregate([
        {
          $match: {
            barberId: barberId,
            status: 'completed',
            date: { $gte: prevStartDate.toDate(), $lte: prevEndDate.toDate() }
          }
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ])
    ]);

    // 4. Data Assembly (Lightweight Processing)
    const results = currentPeriodStats[0];
    const totals = results.totals[0] || { earnings: 0, count: 0 };
    const prevEarnings = prevPeriodStats[0] ? prevPeriodStats[0].total : 0;

    // A. Growth Logic
    let growth = 0;
    if (prevEarnings > 0) growth = ((totals.earnings - prevEarnings) / prevEarnings) * 100;
    else if (totals.earnings > 0) growth = 100;

    // B. Tier Logic
    const tierBreakdown = {
      'Black Premium': { count: 0, earnings: 0, percentage: 0 },
      'Premium': { count: 0, earnings: 0, percentage: 0 },
      'Basic': { count: 0, earnings: 0, percentage: 0 },
      'Free': { count: 0, earnings: 0, percentage: 0 },
    };
    results.tiers.forEach(t => {
      if (tierBreakdown[t._id]) {
        tierBreakdown[t._id].count = t.count;
        tierBreakdown[t._id].earnings = t.earnings;
        tierBreakdown[t._id].percentage = (t.count / totals.count) * 100;
      }
    });

    // C. Chart Logic (Zero looping, just array mapping)
    let dailyEarnings = [], weeklyEarnings = [], monthlyEarnings = [];
    if (filter === 'day') {
      dailyEarnings = Array(6).fill(0);
      results.chart.forEach(i => { if (i._id < 6) dailyEarnings[i._id] = i.total; });
    } else if (filter === 'week') {
      weeklyEarnings = Array(7).fill(0);
      results.chart.forEach(i => weeklyEarnings[i._id - 1] = i.total);
    } else {
      monthlyEarnings = Array(moment().daysInMonth()).fill(0);
      results.chart.forEach(i => monthlyEarnings[i._id - 1] = i.total);
    }

    // D. Final Customer & Review Enrichment
    // We only fetch user names and reviews for the UNIQUE customers found, not all bookings
    const customerList = results.customers;
    const onlineUserIds = customerList.filter(c => !c.isOffline && c.realUserId).map(c => c.realUserId);

    // FIXED: Select 'comment' (correct schema field) instead of 'text'
    // FIXED: We keep .lean(), so we must manually decrypt in the mapping step
    const [users, reviews] = await Promise.all([
      User.find({ _id: { $in: onlineUserIds } }).select('name').lean(),
      Review.find({ barberId, userId: { $in: onlineUserIds } }).select('userId rating comment').sort({ createdAt: -1 }).lean()
    ]);

    // Optimized Map Creation with Manual Decryption
    const userMap = new Map(users.map(u => [u._id ? u._id.toString() : 'unknown', decrypt(u.name)]));
    const reviewMap = new Map();
    reviews.forEach(r => {
      // Manually decrypt the comment because .lean() skipped the Mongoose getter
      const uid = r.userId ? r.userId.toString() : null;
      if (uid && !reviewMap.has(uid)) {
        reviewMap.set(uid, {
          rating: r.rating,
          text: decrypt(r.comment)
        });
      }
    });

    const finalCustomerList = customerList.map(c => {
      let name;
      let review = { text: 'No review yet', rating: 0 };

      if (!c.isOffline && c.realUserId) {
        // ONLINE USER
        const uid = c.realUserId.toString();
        name = userMap.get(uid) || 'Unknown';
        const r = reviewMap.get(uid);
        if (r) review = { text: r.text, rating: r.rating };
      } else {
        // OFFLINE USER
        // c.name comes from aggregation, so it is the raw Encrypted Object. We must decrypt it.
        name = decrypt(c.name) || 'Offline Customer';
        review.text = 'N/A (Offline)';
      }

      return {
        id: c._id,
        name,
        bookingCount: c.count,
        review: review.text,
        rating: review.rating,
        isOffline: c.isOffline || false
      };
    });

    // E. Forecast
    const daysPassed = Math.max(1, moment().diff(startDate, 'days') + 1);
    const avgDaily = totals.earnings / daysPassed;

    const responseData = {
      totalEarnings: totals.earnings,
      totalBookings: totals.count,
      totalCustomers: finalCustomerList.length,
      tierBreakdown,
      growth: growth.toFixed(0),
      dailyEarnings,
      weeklyEarnings,
      monthlyEarnings,
      recentTransactions: results.transactions.map(b => ({
        id: b._id,
        description: (b.services && Array.isArray(b.services)) ? b.services.map(s => s.name).join(', ') : 'Service',
        amount: b.totalPrice,
        date: b.date
      })),
      customersServedList: finalCustomerList,
      forecast7Days: Math.round(avgDaily * 7),
      forecast30Days: Math.round(avgDaily * 30),
      pagination: {
        currentPage: parseInt(page),
        hasMore: results.transactions.length === 20 // Simple check
      }
    };

    cache.put(cacheKey, responseData, 5 * 60 * 1000);
    res.json(responseData);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
module.exports.setupDatabaseIndexes = setupDatabaseIndexes;