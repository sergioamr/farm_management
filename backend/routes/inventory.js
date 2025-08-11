const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Inventory = require('../models/Inventory');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateInventory = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('category').isIn(['Seeds', 'Fertilizers', 'Pesticides', 'Equipment', 'Tools', 'Machinery Parts', 'Irrigation', 'Packaging', 'Other']).withMessage('Invalid category'),
  body('unit').isIn(['kg', 'lbs', 'pieces', 'liters', 'gallons', 'bags', 'boxes', 'units']).withMessage('Invalid unit'),
  body('currentStock').isFloat({ min: 0 }).withMessage('Current stock must be a positive number'),
  body('minimumStock').isFloat({ min: 0 }).withMessage('Minimum stock must be a positive number'),
  body('costPrice').isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('supplier').optional().isMongoId().withMessage('Invalid supplier ID'),
  body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date format')
];

// GET /api/inventory - List all inventory items with pagination and filtering
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ min: 1 }).withMessage('Search query cannot be empty'),
  query('category').optional().isIn(['Seeds', 'Fertilizers', 'Pesticides', 'Equipment', 'Tools', 'Machinery Parts', 'Irrigation', 'Packaging', 'Other']).withMessage('Invalid category'),
  query('stockStatus').optional().isIn(['normal', 'low-stock', 'out-of-stock', 'overstocked']).withMessage('Invalid stock status'),
  query('supplier').optional().isMongoId().withMessage('Invalid supplier ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isActive: true };

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { sku: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.supplier) {
      filter.supplier = req.query.supplier;
    }

    if (req.query.stockStatus) {
      switch (req.query.stockStatus) {
        case 'out-of-stock':
          filter.currentStock = 0;
          break;
        case 'low-stock':
          filter.$expr = { $lte: ['$currentStock', '$minimumStock'] };
          break;
        case 'overstocked':
          filter.$expr = { $gte: ['$currentStock', '$maximumStock'] };
          break;
        case 'normal':
          filter.$and = [
            { $gt: ['$currentStock', 0] },
            { $gt: ['$currentStock', '$minimumStock'] }
          ];
          break;
      }
    }

    // Execute query
    const [inventory, total] = await Promise.all([
      Inventory.find(filter)
        .populate('supplier', 'name businessType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Inventory.countDocuments(filter)
    ]);

    const pages = Math.ceil(total / limit);

    res.json({
      inventory: inventory.map(item => ({
        ...item,
        stockStatus: item.currentStock <= 0 ? 'out-of-stock' :
                    item.currentStock <= item.minimumStock ? 'low-stock' :
                    item.maximumStock && item.currentStock >= item.maximumStock ? 'overstocked' : 'normal',
        profitMargin: item.costPrice > 0 ? ((item.sellingPrice - item.costPrice) / item.costPrice * 100).toFixed(2) : 0
      })),
      pagination: {
        page,
        pages,
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Error fetching inventory', details: error.message });
  }
});

// POST /api/inventory - Create new inventory item
router.post('/', [auth, adminAuth, ...validateInventory], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    // Check if SKU already exists (if provided)
    if (req.body.sku) {
      const existingItem = await Inventory.findOne({ sku: req.body.sku });
      if (existingItem) {
        return res.status(400).json({ error: 'SKU already exists' });
      }
    }

    const inventory = new Inventory(req.body);
    await inventory.save();

    res.status(201).json({
      message: 'Inventory item created successfully',
      inventory: inventory.getPublicProfile()
    });

  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Error creating inventory item', details: error.message });
  }
});

// GET /api/inventory/:id - Get inventory item by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id)
      .populate('supplier', 'name businessType contactPerson email phone')
      .lean();

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    if (!inventory.isActive) {
      return res.status(404).json({ error: 'Inventory item is inactive' });
    }

    // Add computed fields
    inventory.stockStatus = inventory.currentStock <= 0 ? 'out-of-stock' :
                           inventory.currentStock <= inventory.minimumStock ? 'low-stock' :
                           inventory.maximumStock && inventory.currentStock >= inventory.maximumStock ? 'overstocked' : 'normal';
    inventory.profitMargin = inventory.costPrice > 0 ? ((inventory.sellingPrice - inventory.costPrice) / inventory.costPrice * 100).toFixed(2) : 0;

    res.json({ inventory });

  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Error fetching inventory item', details: error.message });
  }
});

// PUT /api/inventory/:id - Update inventory item
router.put('/:id', [auth, adminAuth, ...validateInventory], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    // Check if SKU already exists (if changing)
    if (req.body.sku) {
      const existingItem = await Inventory.findOne({
        sku: req.body.sku,
        _id: { $ne: req.params.id }
      });
      if (existingItem) {
        return res.status(400).json({ error: 'SKU already exists' });
      }
    }

    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('supplier', 'name businessType');

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({
      message: 'Inventory item updated successfully',
      inventory: inventory.getPublicProfile()
    });

  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Error updating inventory item', details: error.message });
  }
});

// DELETE /api/inventory/:id - Delete inventory item (soft delete)
router.delete('/:id', [auth, adminAuth], async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({ message: 'Inventory item deactivated successfully' });

  } catch (error) {
    console.error('Error deactivating inventory item:', error);
    res.status(500).json({ error: 'Error deactivating inventory item', details: error.message });
  }
});

// PATCH /api/inventory/:id/restore - Restore deactivated inventory item
router.patch('/:id/restore', [auth, adminAuth], async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({ message: 'Inventory item restored successfully' });

  } catch (error) {
    console.error('Error restoring inventory item:', error);
    res.status(500).json({ error: 'Error restoring inventory item', details: error.message });
  }
});

// PATCH /api/inventory/:id/stock - Update stock levels
router.patch('/:id/stock', [auth, adminAuth], [
  body('currentStock').isFloat({ min: 0 }).withMessage('Current stock must be a positive number'),
  body('minimumStock').optional().isFloat({ min: 0 }).withMessage('Minimum stock must be a positive number'),
  body('maximumStock').optional().isFloat({ min: 0 }).withMessage('Maximum stock must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const updateData = { currentStock: req.body.currentStock };
    if (req.body.minimumStock !== undefined) updateData.minimumStock = req.body.minimumStock;
    if (req.body.maximumStock !== undefined) updateData.maximumStock = req.body.maximumStock;

    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('supplier', 'name businessType');

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({
      message: 'Stock updated successfully',
      inventory: inventory.getPublicProfile()
    });

  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Error updating stock', details: error.message });
  }
});

// GET /api/inventory/stats/overview - Get inventory statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const [
      totalItems,
      activeItems,
      outOfStock,
      lowStock,
      totalValue,
      categories
    ] = await Promise.all([
      Inventory.countDocuments({ isActive: true }),
      Inventory.countDocuments({ isActive: true, currentStock: { $gt: 0 } }),
      Inventory.countDocuments({ isActive: true, currentStock: 0 }),
      Inventory.countDocuments({
        isActive: true,
        $expr: { $lte: ['$currentStock', '$minimumStock'] }
      }),
      Inventory.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$currentStock', '$costPrice'] } } } }
      ]),
      Inventory.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      totalItems,
      activeItems,
      outOfStock,
      lowStock,
      totalValue: totalValue[0]?.total || 0,
      categories: categories.slice(0, 5) // Top 5 categories
    });

  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({ error: 'Error fetching inventory stats', details: error.message });
  }
});

module.exports = router;