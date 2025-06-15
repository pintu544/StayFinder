import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Listing from '../models/Listing.js';
import auth from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure upload directory exists
const uploadsDir = path.join(__dirname, '../uploads/listings');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/listings/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `listing-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   GET /api/listings/host/my-listings
// @desc    Get host's listings (MUST be before /:id route)
// @access  Private (Host)
router.get('/host/my-listings', auth, async (req, res) => {
  try {
    const listings = await Listing.find({ host: req.user.userId })
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json({ listings });
  } catch (error) {
    console.error('Get host listings error:', error);
    res.status(500).json({ message: 'Server error while fetching host listings' });
  }
});

// @route   GET /api/listings
// @desc    Get all listings with filters
// @access  Public
router.get('/', [
  query('city').optional().trim(),
  query('minPrice').optional().isNumeric().withMessage('Min price must be a number'),
  query('maxPrice').optional().isNumeric().withMessage('Max price must be a number'),
  query('guests').optional().isInt({ min: 1 }).withMessage('Guests must be at least 1'),
  query('propertyType').optional().isIn(['apartment', 'house', 'condo', 'villa', 'studio', 'room']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      city,
      minPrice,
      maxPrice,
      guests,
      propertyType,
      checkIn,
      checkOut,
      page = 1,
      limit = 12
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (city) {
      filter['location.city'] = { $regex: city, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (guests) {
      filter.maxGuests = { $gte: parseInt(guests) };
    }

    if (propertyType) {
      filter.propertyType = propertyType;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get listings with pagination
    const listings = await Listing.find(filter)
      .populate('host', 'firstName lastName avatar')
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalListings = await Listing.countDocuments(filter);
    const totalPages = Math.ceil(totalListings / parseInt(limit));

    res.json({
      listings,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalListings,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ message: 'Server error while fetching listings' });
  }
});

// @route   GET /api/listings/:id
// @desc    Get single listing by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('host', 'firstName lastName avatar bio joinedDate')
      .select('-__v');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (!listing.isActive) {
      return res.status(404).json({ message: 'Listing is not available' });
    }

    res.json({ listing });
  } catch (error) {
    console.error('Get listing error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid listing ID' });
    }
    res.status(500).json({ message: 'Server error while fetching listing' });
  }
});

// @route   POST /api/listings
// @desc    Create new listing
// @access  Private (Host)
router.post('/', auth, upload.array('images', 10), [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .custom(value => {
      if (value < 0) throw new Error('Price cannot be negative');
      return true;
    }),
  body('location.address').notEmpty().withMessage('Address is required'),
  body('location.city').notEmpty().withMessage('City is required'),
  body('location.state').notEmpty().withMessage('State is required'),
  body('location.country').notEmpty().withMessage('Country is required'),
  body('location.zipCode').notEmpty().withMessage('Zip code is required'),
  body('propertyType').isIn(['apartment', 'house', 'condo', 'villa', 'studio', 'room']),
  body('roomType').isIn(['entire_place', 'private_room', 'shared_room']),
  body('maxGuests').isInt({ min: 1 }).withMessage('Max guests must be at least 1'),
  body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms cannot be negative'),
  body('bathrooms').isNumeric().withMessage('Bathrooms must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    // Process uploaded images
    const images = req.files ? req.files.map(file => ({
      url: `/uploads/listings/${file.filename}`,
      caption: ''
    })) : [];

    const listingData = {
      ...req.body,
      host: req.user.userId,
      images
    };

    // Parse amenities if it's a string
    if (typeof listingData.amenities === 'string') {
      listingData.amenities = JSON.parse(listingData.amenities);
    }

    const listing = new Listing(listingData);
    await listing.save();

    const populatedListing = await Listing.findById(listing._id)
      .populate('host', 'firstName lastName avatar');

    res.status(201).json({
      message: 'Listing created successfully',
      listing: populatedListing
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ message: 'Server error while creating listing' });
  }
});

// @route   PUT /api/listings/:id
// @desc    Update listing
// @access  Private (Host only - own listings)
router.put('/:id', auth, upload.array('newImages', 10), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if user is the host of this listing
    if (listing.host.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    // Process new uploaded images
    const newImages = req.files ? req.files.map(file => ({
      url: `/uploads/listings/${file.filename}`,
      caption: ''
    })) : [];

    // Combine existing images with new ones
    const updatedImages = [...(listing.images || []), ...newImages];

    const updateData = {
      ...req.body,
      images: updatedImages
    };

    // Parse amenities if it's a string
    if (typeof updateData.amenities === 'string') {
      updateData.amenities = JSON.parse(updateData.amenities);
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('host', 'firstName lastName avatar');

    res.json({
      message: 'Listing updated successfully',
      listing: updatedListing
    });
  } catch (error) {
    console.error('Update listing error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid listing ID' });
    }
    res.status(500).json({ message: 'Server error while updating listing' });
  }
});

// @route   DELETE /api/listings/:id
// @desc    Delete listing
// @access  Private (Host only - own listings)
router.delete('/:id', auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if user is the host of this listing
    if (listing.host.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    await Listing.findByIdAndDelete(req.params.id);

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid listing ID' });
    }
    res.status(500).json({ message: 'Server error while deleting listing' });
  }
});

export default router;
