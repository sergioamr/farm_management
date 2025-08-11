const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Supplier = require('../models/Supplier');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateSupplier = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('contactPerson').trim().isLength({ min: 2, max: 100 }).withMessage('Contact person must be between 2 and 100 characters'),
  body('email').trim().isEmail().withMessage('Must be a valid email address'),
  body('phone').trim().isLength({ min: 10, max: 20 }).withMessage('Phone must be between 10 and 20 characters'),
  body('address.street').trim().isLength({ min: 5, max: 200 }).withMessage('Street address must be between 5 and 200 characters'),
  body('address.city').trim().isLength({ min: 2, max: 100 }).withMessage('City must be between 2 and 100 characters'),
  body('address.state').trim().isLength({ min: 2, max: 100 }).withMessage('State must be between 2 and 100 characters'),
  body('address.zipCode').trim().isLength({ min: 5, max: 10 }).withMessage('Zip code must be between 5 and 10 characters'),
  body('businessType').isIn(['Seed Supplier', 'Fertilizer Supplier', 'Equipment Supplier', 'Chemical Supplier', 'General Supplier', 'Other']).withMessage('Invalid business type'),
  body('paymentTerms').optional().isIn(['Net 30', 'Net 60', 'Net 90', 'Cash on Delivery', 'Advance Payment']).withMessage('Invalid payment terms'),
  body('creditLimit').optional().isFloat({ min: 0 }).withMessage('Credit limit must be a positive number'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
];

// GET /api/suppliers - List all suppliers with pagination and filtering
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('search').optional().trim(),
  query('businessType').optional().isIn(['Seed Supplier', 'Fertilizer Supplier', 'Equipment Supplier', 'Chemical Supplier', 'General Supplier', 'Other']),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 10, search, businessType, isActive } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (businessType) filter.businessType = businessType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // If limit is 1000, don't use pagination (for dropdowns)
    if (parseInt(limit) === 1000) {
      const suppliers = await Supplier.find(filter)
        .sort({ name: 1 })
        .select('-taxId -creditLimit -currentBalance');

      return res.json({
        suppliers,
        pagination: {
          page: 1,
          limit: suppliers.length,
          total: suppliers.length,
          pages: 1
        }
      });
    }

    const suppliers = await Supplier.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-taxId -creditLimit -currentBalance');

    const total = await Supplier.countDocuments(filter);

    res.json({
      suppliers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching suppliers', details: error.message });
  }
});

// POST /api/suppliers - Create new supplier
router.post('/', [auth, adminAuth, ...validateSupplier], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    // Check if supplier with same email already exists
    const existingSupplier = await Supplier.findOne({ email: req.body.email });
    if (existingSupplier) {
      return res.status(400).json({ error: 'Supplier with this email already exists' });
    }

    const supplier = new Supplier(req.body);
    await supplier.save();

    res.status(201).json({
      message: 'Supplier created successfully',
      supplier: supplier.getPublicProfile()
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Error creating supplier', details: error.message });
  }
});

// GET /api/suppliers/:id - Get supplier by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ supplier: supplier.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching supplier', details: error.message });
  }
});

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', [auth, adminAuth, ...validateSupplier], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if email is being changed and if it conflicts with another supplier
    if (req.body.email) {
      const existingSupplier = await Supplier.findOne({
        email: req.body.email,
        _id: { $ne: req.params.id }
      });
      if (existingSupplier) {
        return res.status(400).json({ error: 'Supplier with this email already exists' });
      }
    }

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({
      message: 'Supplier updated successfully',
      supplier: supplier.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating supplier', details: error.message });
  }
});

// DELETE /api/suppliers/:id - Delete supplier (soft delete)
router.delete('/:id', [auth, adminAuth], async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deactivating supplier', details: error.message });
  }
});

// PATCH /api/suppliers/:id/restore - Restore deactivated supplier
router.patch('/:id/restore', [auth, adminAuth], async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({
      message: 'Supplier restored successfully',
      supplier: supplier.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error restoring supplier', details: error.message });
  }
});

// GET /api/suppliers/stats - Get supplier statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Supplier.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactive: { $sum: { $cond: ['$isActive', 0, 1] } }
        }
      }
    ]);

    const businessTypeStats = await Supplier.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$businessType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      overview: stats[0] || { total: 0, active: 0, inactive: 0 },
      businessTypes: businessTypeStats
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching supplier statistics', details: error.message });
  }
});

module.exports = router;