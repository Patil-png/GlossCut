const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Review = require('../models/Review');
const Shop = require('../models/Shop');
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

    // SAFETY CHECK: Validate User ID before casting
    if (!req.user || !req.user.id || !mongoose.Types.ObjectId.isValid(req.user.id)) {
      console.warn('[Earnings] Invalid User ID in request:', req.user);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const barberId = new mongoose.Types.ObjectId(req.user.id);

    // 1. Caching Strategy (Disabled for 'day' view for real-time updates)
    const cacheKey = `earnings_${barberId}_${filter || 'home'}_${page}`;
    // Only cache history (week/month), NOT today/home to ensure instant updates after payment
    if (filter && filter !== 'day' && filter !== 'home') {
      const cachedData = cache.get(cacheKey);
      if (cachedData) return res.json(cachedData);
    }

    const filterParam = filter || 'day';
    const normalizedFilter = filterParam.toLowerCase();

    // 2. Date Setup
    let startDate = moment().startOf('day');
    const endDate = moment().endOf('day');

    if (normalizedFilter === 'week') startDate = moment().startOf('week');
    else if (normalizedFilter === 'month') startDate = moment().startOf('month');

    // Dates for Growth Calculation
    const prevStartDate = moment(startDate).subtract(1, normalizedFilter);
    const prevEndDate = moment(endDate).subtract(1, normalizedFilter);



    console.log(`[Earnings Debug] ID: ${barberId} Filter: ${filter}`);
    console.log(`[Earnings Debug] Date Range: ${startDate.format()} to ${endDate.format()}`);

    // 3. The "Holy Grail" Query (Parallel Execution)
    const [currentPeriodStats, prevPeriodStats] = await Promise.all([

      // QUERY A: The Facet Pipeline (Does EVERYTHING in one go)
      Booking.aggregate([
        // Stage 1: Filter Matches (Uses Index)
        {
          $match: {
            barberId: barberId,
            date: { $gte: startDate.toDate(), $lte: endDate.toDate() },
            $or: [
              // 1. Service Completed (Online or Offline) -> Money Collected
              { status: 'completed', paymentStatus: 'completed' },
              // 2. Express Offline (Immediate Cash) -> Stays 'confirmed' but is Paid
              { isOfflineBooking: true, status: 'confirmed', paymentStatus: 'completed' }
            ]
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
                  // Smart Grouping: Use ID if online, Booking ID if offline (since Phone is encrypted/random)
                  _id: {
                    $cond: [
                      { $eq: ["$isOfflineBooking", true] },
                      "$_id", // Group by Booking ID to match 1:1, avoiding $concat error on Object
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
            ],

            // Lane 6: Insights (Busiest Hour & Top Service)
            "insights": [
              {
                $facet: {
                  "busiestHour": [
                    { $project: { hour: { $hour: "$date" } } },
                    { $group: { _id: "$hour", count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 1 }
                  ],
                  "topService": [
                    { $unwind: "$services" },
                    { $group: { _id: "$services.name", count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 1 }
                  ]
                }
              }
            ]
          }
        }
      ]),

      // QUERY B: Previous Period (Only for Growth)
      Booking.aggregate([
        {
          $match: {
            barberId: barberId,
            date: { $gte: prevStartDate.toDate(), $lte: prevEndDate.toDate() },
            $or: [
              { status: 'completed', paymentStatus: 'completed' },
              { isOfflineBooking: true, status: 'confirmed', paymentStatus: 'completed' }
            ]
          }
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ])
    ]);

    // 4. Data Assembly (Lightweight Processing)
    // SAFETY: Ensure currentPeriodStats is not empty and results is defined
    const results = (currentPeriodStats && currentPeriodStats.length > 0) ? currentPeriodStats[0] : null;

    if (!results) {
      console.log('[Earnings] Aggregation returned no results structure. Returning defaults.');
      return res.json({
        totalEarnings: 0,
        totalBookings: 0,
        totalCustomers: 0,
        tierBreakdown: {},
        growth: 0,
        dailyEarnings: [],
        weeklyEarnings: [],
        monthlyEarnings: [],
        recentTransactions: [],
        customersServedList: [],
        forecast7Days: 0,
        forecast30Days: 0,
        pagination: { currentPage: 1, hasMore: false }
      });
    }

    const totals = (results.totals && results.totals[0]) || { earnings: 0, count: 0 };
    const prevEarnings = prevPeriodStats[0] ? prevPeriodStats[0].total : 0;

    console.log(`[Earnings Debug] Totals: ${totals.earnings}, Count: ${totals.count}`);
    console.log(`[Earnings Debug] Facet Totals:`, JSON.stringify(results.totals));

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
    const userMap = new Map();
    if (users && Array.isArray(users)) {
      users.forEach(u => {
        if (u._id) userMap.set(u._id.toString(), decrypt(u.name));
      });
    }

    const reviewMap = new Map();

    if (reviews && Array.isArray(reviews)) {
      reviews.forEach(r => {
        const uid = r.userId ? r.userId.toString() : null;
        if (uid && !reviewMap.has(uid)) {
          reviewMap.set(uid, {
            rating: r.rating || 0,
            text: decrypt(r.comment)
          });
        }
      });
    }

    const finalCustomerList = customerList.map(c => {
      let name;
      let review = { text: 'No review yet', rating: 0 };

      if (!c.isOffline && c.realUserId && mongoose.Types.ObjectId.isValid(c.realUserId)) {
        // ONLINE USER
        const uid = c.realUserId.toString();
        name = userMap.get(uid) || 'Unknown';
        const r = reviewMap.get(uid);
        if (r) review = { text: r.text, rating: r.rating };
      } else {
        // OFFLINE USER
        name = decrypt(c.name) || 'Offline Customer';
        review.text = 'N/A (Offline)';
        if (!c.isOffline) name += " (Invalid ID)";
      }

      return {
        id: c._id,
        name,
        bookingCount: c.count || 0,
        review: review.text,
        rating: review.rating,
        isOffline: c.isOffline || false
      };
    });

    // E. Forecast
    const daysPassed = Math.max(1, moment().diff(startDate, 'days') + 1);
    const avgDaily = (totals.earnings || 0) / daysPassed;

    // F. Insights Extraction
    const insightData = (results.insights && results.insights[0]) || {};
    const busiestHourRaw = (insightData.busiestHour && insightData.busiestHour[0]) ? insightData.busiestHour[0]._id : null;
    const topServiceRaw = (insightData.topService && insightData.topService[0]) ? insightData.topService[0]._id : "N/A";

    // Format Hour (e.g., 18 -> "6 PM")
    let busiestHourDisplay = "N/A";
    if (busiestHourRaw !== null) {
      const h = busiestHourRaw;
      const suffix = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 || 12;
      busiestHourDisplay = `${displayH} ${suffix}`;
    }

    const avgTicket = totals.count > 0 ? Math.round(totals.earnings / totals.count) : 0;


    const responseData = {
      totalEarnings: totals.earnings || 0,
      totalBookings: totals.count || 0,
      totalCustomers: finalCustomerList.length,
      insights: {
        busiestHour: busiestHourDisplay,
        topService: topServiceRaw,
        avgTicket: avgTicket
      },
      tierBreakdown,
      tierBreakdown,
      growth: growth.toFixed(0),
      dailyEarnings,
      weeklyEarnings,
      monthlyEarnings,
      recentTransactions: (results.transactions || []).map(b => ({
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
        hasMore: (results.transactions || []).length === 20
      }
    };

    console.log('[Earnings] Response assembled successfully.');

    // Only cache if we checked cache earlier (week/month)
    if (filter && filter !== 'day' && filter !== 'home') {
      cache.put(cacheKey, responseData, 5 * 60 * 1000);
    }
    res.json(responseData);

  } catch (err) {
    console.error('[Earnings API Error]', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/earnings/staff
// @desc    Get earnings for all staff members (Shop Owner Only)
// @access  Private
router.get('/staff', auth, async (req, res) => {
  try {
    // 1. Verify Shop Ownership
    const shop = await Shop.findOne({ owner: req.user.id }).populate('staff', 'name profilePicture');

    if (!shop) {
      return res.status(403).json({ msg: 'Access denied. You must be a shop owner.' });
    }

    if (!shop.staff || shop.staff.length === 0) {
      return res.json([]);
    }

    const staffIds = shop.staff.map(s => s._id);

    // 2. Determine Date Range based on Filter
    const filter = req.query.filter || 'month';
    const now = moment();
    let startDate, endDate;

    if (filter === 'day') {
      startDate = moment().startOf('day');
      endDate = moment().endOf('day');
    } else if (filter === 'week') {
      startDate = moment().startOf('week');
      endDate = moment().endOf('week');
    } else {
      // Default to Month
      startDate = moment().startOf('month');
      endDate = moment().endOf('month');
    }

    // 3. Aggregate Earnings
    const stats = await Booking.aggregate([
      {
        $match: {
          barberId: { $in: staffIds },
          $or: [
            { status: 'completed', paymentStatus: 'completed' },
            { isOfflineBooking: true, status: 'confirmed', paymentStatus: 'completed' }
          ]
        }
      },
      {
        $facet: {
          // Filtered Totals (Based on selected period)
          "filtered": [
            {
              $match: {
                date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
              }
            },
            { $group: { _id: "$barberId", total: { $sum: "$totalPrice" } } }
          ],
          // Total Per Staff (All Time - for reference if needed, or remove to save perf)
          "totals": [
            { $group: { _id: "$barberId", total: { $sum: "$totalPrice" } } }
          ],
          // Daily Breakdown (Last 30 Days)
          "daily": [
            {
              $match: {
                date: { $gte: moment().subtract(30, 'days').toDate() }
              }
            },
            {
              $group: {
                _id: {
                  barber: "$barberId",
                  date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
                },
                amount: { $sum: "$totalPrice" },
                services: { $push: "$services.name" }
              }
            },
            { $sort: { "_id.date": -1 } }
          ],
          // Current Month for Projection
          "thisMonth": [
            {
              $match: {
                date: {
                  $gte: moment().startOf('month').toDate(),
                  $lte: moment().endOf('month').toDate()
                }
              }
            },
            { $group: { _id: "$barberId", total: { $sum: "$totalPrice" } } }
          ]
        }
      }
    ]);

    const totalsMap = new Map();
    if (stats[0].totals) {
      stats[0].totals.forEach(t => totalsMap.set(t._id.toString(), t.total));
    }

    const filteredMap = new Map();
    if (stats[0].filtered) {
      stats[0].filtered.forEach(t => filteredMap.set(t._id.toString(), t.total));
    }

    const thisMonthMap = new Map();
    if (stats[0].thisMonth) {
      stats[0].thisMonth.forEach(t => thisMonthMap.set(t._id.toString(), t.total));
    }

    const daysInMonth = moment().daysInMonth();
    const daysPassed = Math.max(1, moment().date());

    const dailyMap = new Map(); // barberId -> [ { date, amount, services } ]
    if (stats[0].daily) {
      stats[0].daily.forEach(d => {
        const bid = d._id.barber.toString();
        if (!dailyMap.has(bid)) dailyMap.set(bid, []);

        // Flatten services and take unique or top 3
        const allServices = (d.services || []).flat();
        const uniqueServices = [...new Set(allServices)].slice(0, 3);

        dailyMap.get(bid).push({
          date: d._id.date,
          amount: d.amount,
          services: uniqueServices
        });
      });
    }

    // 3. Assemble Response
    const response = shop.staff.map(staffMember => {
      const staffId = staffMember._id.toString();
      const monthEarnings = thisMonthMap.get(staffId) || 0;
      const projection = (monthEarnings / daysPassed) * daysInMonth;

      return {
        id: staffId,
        name: decrypt(staffMember.name),
        role: 'Staff',
        totalEarnings: filteredMap.get(staffId) || 0, // Now reflects the FILTERED amount (Day/Week/Month)
        allTimeEarnings: totalsMap.get(staffId) || 0,
        projectedEarnings: Math.round(projection),
        dailyBreakdown: dailyMap.get(staffId) || []
      };
    });

    res.json(response);

  } catch (err) {
    console.error('[Staff Earnings Error]', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
module.exports.setupDatabaseIndexes = setupDatabaseIndexes;