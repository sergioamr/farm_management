const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Pricing = require('../models/Pricing');
const Supplier = require('../models/Supplier');
const Inventory = require('../models/Inventory');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validatePricing = [
  body('supplier').isMongoId().withMessage('Valid supplier ID is required'),
  body('inventory').isMongoId().withMessage('Valid inventory ID is required'),
  body('costPrice').isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).withMessage('Invalid currency'),
  body('effectiveDate').optional().isISO8601().withMessage('Effective date must be a valid date'),
  body('expiryDate').optional().isISO8601().withMessage('Expiry date must be a valid date'),
  body('minimumOrderQuantity').optional().isInt({ min: 1 }).withMessage('Minimum order quantity must be at least 1'),
  body('leadTime').optional().isInt({ min: 0 }).withMessage('Lead time must be a non-negative number'),
  body('paymentTerms').optional().isIn(['Net 30', 'Net 60', 'Net 90', 'Cash on Delivery', 'Advance Payment']).withMessage('Invalid payment terms'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
  body('bulkPricing').optional().isArray().withMessage('Bulk pricing must be an array'),
  body('bulkPricing.*.quantity').optional().isInt({ min: 1 }).withMessage('Bulk pricing quantity must be at least 1'),
  body('bulkPricing.*.price').optional().isFloat({ min: 0 }).withMessage('Bulk pricing price must be positive'),
  body('bulkPricing.*.discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Bulk pricing discount must be between 0 and 100')
];

// GET /api/pricing - List all pricing with pagination and filtering
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('supplier').optional().isMongoId().withMessage('Valid supplier ID is required'),
  query('inventory').optional().isMongoId().withMessage('Valid inventory ID is required'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD']),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be positive'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 10,
      search,
      supplier,
      inventory,
      isActive,
      currency,
      minPrice,
      maxPrice
    } = req.query;

    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (search) {
      filter.$or = [
        { 'supplier.name': { $regex: search, $options: 'i' } },
        { 'inventory.name': { $regex: search, $options: 'i' } }
      ];
    }
    if (supplier) filter.supplier = supplier;
    if (inventory) filter.inventory = inventory;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (currency) filter.currency = currency;
    if (minPrice || maxPrice) {
      filter.$and = [];
      if (minPrice) filter.$and.push({ costPrice: { $gte: parseFloat(minPrice) } });
      if (maxPrice) filter.$and.push({ costPrice: { $lte: parseFloat(maxPrice) } });
    }

    const pricing = await Pricing.find(filter)
      .populate('supplier', 'name businessType')
      .populate('inventory', 'name sku category unit')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Pricing.countDocuments(filter);

    res.json({
      pricing,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching pricing', details: error.message });
  }
});

// POST /api/pricing - Create new pricing
router.post('/', [auth, adminAuth, ...validatePricing], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    // Check if pricing for this supplier-inventory combination already exists
    const existingPricing = await Pricing.findOne({
      supplier: req.body.supplier,
      inventory: req.body.inventory
    });

    if (existingPricing) {
      return res.status(400).json({
        error: 'Pricing for this supplier and inventory combination already exists'
      });
    }

    // Validate that supplier and inventory exist
    const supplier = await Supplier.findById(req.body.supplier);
    const inventory = await Inventory.findById(req.body.inventory);

    if (!supplier) {
      return res.status(400).json({ error: 'Supplier not found' });
    }
    if (!inventory) {
      return res.status(400).json({ error: 'Inventory item not found' });
    }

    const pricing = new Pricing(req.body);
    await pricing.save();

    // Populate references for response
    await pricing.populate('supplier', 'name businessType');
    await pricing.populate('inventory', 'name sku category unit');

    res.status(201).json({
      message: 'Pricing created successfully',
      pricing: pricing.getPublicProfile()
    });
  } catch (error) {
    console.error('Error creating pricing:', error);
    res.status(500).json({ error: 'Error creating pricing', details: error.message });
  }
});

// GET /api/pricing/:id - Get pricing by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const pricing = await Pricing.findById(req.params.id)
      .populate('supplier', 'name businessType contactPerson email phone')
      .populate('inventory', 'name sku category unit currentStock minimumStock');

    if (!pricing) {
      return res.status(404).json({ error: 'Pricing not found' });
    }

    res.json({ pricing: pricing.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching pricing', details: error.message });
  }
});

// PUT /api/pricing/:id - Update pricing
router.put('/:id', [auth, adminAuth, ...validatePricing], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if updating supplier or inventory would create a duplicate
    if (req.body.supplier || req.body.inventory) {
      const existingPricing = await Pricing.findOne({
        supplier: req.body.supplier || req.body.supplier,
        inventory: req.body.inventory || req.body.inventory,
        _id: { $ne: req.params.id }
      });

      if (existingPricing) {
        return res.status(400).json({
          error: 'Pricing for this supplier and inventory combination already exists'
        });
      }
    }

    const pricing = await Pricing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('supplier', 'name businessType')
     .populate('inventory', 'name sku category unit');

    if (!pricing) {
      return res.status(404).json({ error: 'Pricing not found' });
    }

    res.json({
      message: 'Pricing updated successfully',
      pricing: pricing.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating pricing', details: error.message });
  }
});

// DELETE /api/pricing/:id - Delete pricing (soft delete)
router.delete('/:id', [auth, adminAuth], async (req, res) => {
  try {
    const pricing = await Pricing.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!pricing) {
      return res.status(404).json({ error: 'Pricing not found' });
    }

    res.json({ message: 'Pricing deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deactivating pricing', details: error.message });
  }
});

// PATCH /api/pricing/:id/restore - Restore deactivated pricing
router.patch('/:id/restore', [auth, adminAuth], async (req, res) => {
  try {
    const pricing = await Pricing.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).populate('supplier', 'name businessType')
     .populate('inventory', 'name sku category unit');

    if (!pricing) {
      return res.status(404).json({ error: 'Pricing not found' });
    }

    res.json({
      message: 'Pricing restored successfully',
      pricing: pricing.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error restoring pricing', details: error.message });
  }
});

// GET /api/pricing/supplier/:supplierId - Get all pricing for a specific supplier
router.get('/supplier/:supplierId', auth, async (req, res) => {
  try {
    const pricing = await Pricing.find({
      supplier: req.params.supplierId,
      isActive: true
    })
    .populate('inventory', 'name sku category unit currentStock')
    .sort({ 'inventory.name': 1 });

    res.json({ pricing: pricing.map(p => p.getPublicProfile()) });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching supplier pricing', details: error.message });
  }
});

// GET /api/pricing/inventory/:inventoryId - Get all pricing for a specific inventory item
router.get('/inventory/:inventoryId', auth, async (req, res) => {
  try {
    const pricing = await Pricing.find({
      inventory: req.params.inventoryId,
      isActive: true
    })
    .populate('supplier', 'name businessType rating')
    .sort({ costPrice: 1 });

    res.json({ pricing: pricing.map(p => p.getPublicProfile()) });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inventory pricing', details: error.message });
  }
});

// GET /api/pricing/stats/overview - Get pricing statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Pricing.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
          avgCostPrice: { $avg: '$costPrice' },
          avgSellingPrice: { $avg: '$sellingPrice' }
        }
      }
    ]);

    const currencyStats = await Pricing.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$currency',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const supplierStats = await Pricing.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$supplier',
          pricingCount: { $sum: 1 }
        }
      },
      { $sort: { pricingCount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      overview: stats[0] || { total: 0, active: 0, inactive: 0, avgCostPrice: 0, avgSellingPrice: 0 },
      currencies: currencyStats,
      topSuppliers: supplierStats
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching pricing statistics', details: error.message });
  }
});

module.exports = router;