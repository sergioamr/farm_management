const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Seeds',
      'Fertilizers',
      'Pesticides',
      'Equipment',
      'Tools',
      'Machinery Parts',
      'Irrigation',
      'Packaging',
      'Other'
    ]
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'lbs', 'pieces', 'liters', 'gallons', 'bags', 'boxes', 'units']
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minimumStock: {
    type: Number,
    min: 0,
    default: 0
  },
  maximumStock: {
    type: Number,
    min: 0
  },
  costPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  sellingPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  location: {
    warehouse: { type: String, trim: true, maxlength: 100 },
    shelf: { type: String, trim: true, maxlength: 50 },
    bin: { type: String, trim: true, maxlength: 50 }
  },
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String,
    trim: true,
    maxlength: 50
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  images: [{
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Indexes for better query performance
inventorySchema.index({ name: 1, category: 1, subcategory: 1 });
inventorySchema.index({ supplier: 1 });
inventorySchema.index({ isActive: 1 });
inventorySchema.index({ currentStock: 1 });
inventorySchema.index({ expiryDate: 1 });

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function() {
  if (this.currentStock <= 0) return 'out-of-stock';
  if (this.currentStock <= this.minimumStock) return 'low-stock';
  if (this.maximumStock && this.currentStock >= this.maximumStock) return 'overstocked';
  return 'normal';
});

// Virtual for profit margin
inventorySchema.virtual('profitMargin').get(function() {
  if (this.costPrice === 0) return 0;
  return ((this.sellingPrice - this.costPrice) / this.costPrice * 100).toFixed(2);
});

// Method to get public profile (exclude sensitive data)
inventorySchema.methods.getPublicProfile = function() {
  const inventory = this.toObject();
  delete inventory.__v;
  return inventory;
};

// Method to check if stock is low
inventorySchema.methods.isLowStock = function() {
  return this.currentStock <= this.minimumStock;
};

// Method to check if stock is out
inventorySchema.methods.isOutOfStock = function() {
  return this.currentStock <= 0;
};

// Pre-save middleware to generate SKU if not provided
inventorySchema.pre('save', function(next) {
  if (!this.sku) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    this.sku = `${this.category.substring(0, 3).toUpperCase()}-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);