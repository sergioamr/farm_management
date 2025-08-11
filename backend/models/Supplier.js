const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'USA'
    }
  },
  businessType: {
    type: String,
    required: true,
    enum: ['Seed Supplier', 'Fertilizer Supplier', 'Equipment Supplier', 'Chemical Supplier', 'General Supplier', 'Other'],
    default: 'General Supplier'
  },
  taxId: {
    type: String,
    trim: true,
    maxlength: 20
  },
  paymentTerms: {
    type: String,
    enum: ['Net 30', 'Net 60', 'Net 90', 'Cash on Delivery', 'Advance Payment'],
    default: 'Net 30'
  },
  creditLimit: {
    type: Number,
    min: 0,
    default: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  documents: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
supplierSchema.index({ name: 1, email: 1, businessType: 1 });
supplierSchema.index({ isActive: 1 });

// Virtual for full address
supplierSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Method to get public profile (without sensitive data)
supplierSchema.methods.getPublicProfile = function() {
  const supplierObject = this.toObject();
  delete supplierObject.taxId;
  delete supplierObject.creditLimit;
  delete supplierObject.currentBalance;
  return supplierObject;
};

module.exports = mongoose.model('Supplier', supplierSchema);