const mongoose = require('mongoose');
// 2. Import audit middleware
const AuditLogger = require('../middleware/auditMiddleware');
// No encryption import needed here!

const listingPlaceSchema = new mongoose.Schema({
  tierId: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  // DO NOT ENCRYPT ENUMS (Keep as String for filtering)
  category: {
    type: String,
    required: true,
    enum: ['Barber', 'Women\'s Salon', 'Pet Care'], 
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lockedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index (Keep this)
listingPlaceSchema.index({ tierId: 1, category: 1 }, { unique: true }); 

// Add virtual for audit context
listingPlaceSchema.virtual('_auditUserId').get(function() {
  return this.lockedBy; // Use the user who locked this listing place
});

// Apply audit plugin
listingPlaceSchema.plugin(AuditLogger.mongoosePlugin);

const ListingPlace = mongoose.model('ListingPlace', listingPlaceSchema);

module.exports = ListingPlace;
