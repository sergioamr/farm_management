const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  inventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  bulkPricing: [{
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  minimumOrderQuantity: {
    type: Number,
    min: 1,
    default: 1
  },
  leadTime: {
    type: Number,
    min: 0,
    default: 0
  },
  paymentTerms: {
    type: String,
    enum: ['Net 30', 'Net 60', 'Net 90', 'Cash on Delivery', 'Advance Payment'],
    default: 'Net 30'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for better query performance
pricingSchema.index({ supplier: 1, inventory: 1 }, { unique: true });
pricingSchema.index({ supplier: 1, isActive: 1 });
pricingSchema.index({ inventory: 1, isActive: 1 });
pricingSchema.index({ effectiveDate: 1 });
pricingSchema.index({ expiryDate: 1 });

// Virtual for profit margin
pricingSchema.virtual('profitMargin').get(function() {
  if (this.costPrice === 0) return 0;
  return ((this.sellingPrice - this.costPrice) / this.costPrice * 100).toFixed(2);
});

// Virtual for markup percentage
pricingSchema.virtual('markupPercentage').get(function() {
  if (this.costPrice === 0) return 0;
  return ((this.sellingPrice - this.costPrice) / this.costPrice * 100).toFixed(2);
});

// Method to get public profile (exclude sensitive data)
pricingSchema.methods.getPublicProfile = function() {
  const pricing = this.toObject();
  delete pricing.__v;
  return pricing;
};

// Method to check if pricing is expired
pricingSchema.methods.isExpired = function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
};

// Method to check if pricing is effective
pricingSchema.methods.isEffective = function() {
  const now = new Date();
  return this.isActive &&
         now >= this.effectiveDate &&
         (!this.expiryDate || now <= this.expiryDate);
};

// Pre-save middleware to validate bulk pricing
pricingSchema.pre('save', function(next) {
  if (this.bulkPricing && this.bulkPricing.length > 0) {
    // Sort bulk pricing by quantity
    this.bulkPricing.sort((a, b) => a.quantity - b.quantity);

    // Validate that quantities are unique and in ascending order
    for (let i = 1; i < this.bulkPricing.length; i++) {
      if (this.bulkPricing[i].quantity <= this.bulkPricing[i-1].quantity) {
        return next(new Error('Bulk pricing quantities must be in ascending order and unique'));
      }
    }
  }
  next();
});

module.exports = mongoose.model('Pricing', pricingSchema);