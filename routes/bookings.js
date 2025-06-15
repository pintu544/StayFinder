import express from 'express';
import { body, validationResult } from 'express-validator';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private
router.post('/', auth, [
  body('listing')
    .notEmpty()
    .withMessage('Listing ID is required')
    .isMongoId()
    .withMessage('Invalid listing ID'),
  body('checkIn')
    .isISO8601()
    .withMessage('Check-in date must be a valid date')
    .custom(value => {
      const checkInDate = new Date(value);
      const today = new Date();
      // Set today's time to start of day for proper comparison
      today.setHours(0, 0, 0, 0);
      
      if (checkInDate < today) {
        throw new Error('Check-in date cannot be in the past');
      }
      return true;
    }),
  body('checkOut')
    .isISO8601()
    .withMessage('Check-out date must be a valid date')
    .custom((value, { req }) => {
      const checkOutDate = new Date(value);
      const checkInDate = new Date(req.body.checkIn);
      
      if (checkOutDate <= checkInDate) {
        throw new Error('Check-out date must be after check-in date');
      }
      return true;
    }),
  body('guests.adults')
    .isInt({ min: 1 })
    .withMessage('At least 1 adult is required'),
  body('guests.children')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Children count cannot be negative'),
  body('guests.infants')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Infants count cannot be negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { listing: listingId, checkIn, checkOut, guests, specialRequests } = req.body;

    // Check if listing exists and is available
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (!listing.isActive) {
      return res.status(400).json({ message: 'Listing is not available for booking' });
    }

    // Check if guest count exceeds maximum
    const totalGuests = guests.adults + (guests.children || 0) + (guests.infants || 0);
    if (totalGuests > listing.maxGuests) {
      return res.status(400).json({ 
        message: `This property can accommodate maximum ${listing.maxGuests} guests` 
      });
    }

    // Parse dates properly
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      listing: listingId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          checkIn: { $lt: checkOutDate },
          checkOut: { $gt: checkInDate }
        }
      ]
    });

    if (overlappingBooking) {
      return res.status(400).json({ 
        message: 'These dates are not available. Please choose different dates.' 
      });
    }

    // Calculate total amount
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalAmount = nights * listing.price;

    // Create booking
    const booking = new Booking({
      listing: listingId,
      guest: req.user.userId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      totalAmount,
      specialRequests
    });

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('listing', 'title location images price')
      .populate('guest', 'firstName lastName email');

    res.status(201).json({
      message: 'Booking created successfully',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error while creating booking' });
  }
});

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, type = 'guest' } = req.query;

    let filter = {};
    
    if (type === 'guest') {
      filter.guest = req.user.userId;
    } else if (type === 'host') {
      // Get bookings for listings owned by the user
      const userListings = await Listing.find({ host: req.user.userId }).select('_id');
      const listingIds = userListings.map(listing => listing._id);
      filter.listing = { $in: listingIds };
    }

    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate('listing', 'title location images price host')
      .populate('guest', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error while fetching bookings' });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('listing', 'title location images price host')
      .populate('guest', 'firstName lastName email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is either the guest or the host of the listing
    const isGuest = booking.guest._id.toString() === req.user.userId;
    const isHost = booking.listing.host.toString() === req.user.userId;

    if (!isGuest && !isHost) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }
    res.status(500).json({ message: 'Server error while fetching booking' });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put('/:id/cancel', auth, [
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('listing', 'host');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is either the guest or the host
    const isGuest = booking.guest.toString() === req.user.userId;
    const isHost = booking.listing.host._id.toString() === req.user.userId;

    if (!isGuest && !isHost) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed booking' });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancellationReason = req.body.reason || 'No reason provided';
    await booking.save();

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }
    res.status(500).json({ message: 'Server error while cancelling booking' });
  }
});

// @route   PUT /api/bookings/:id/review
// @desc    Add review to a booking
// @access  Private (Guest only)
router.put('/:id/review', auth, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Review comment cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { rating, comment } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is the guest
    if (booking.guest.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only guests can review bookings' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }

    // Check if already reviewed
    if (booking.review && booking.review.rating) {
      return res.status(400).json({ message: 'Booking already reviewed' });
    }

    // Add review
    booking.review = {
      rating,
      comment: comment || '',
      reviewDate: new Date()
    };

    await booking.save();

    // Update listing rating
    const listing = await Listing.findById(booking.listing);
    if (listing) {
      const totalRating = (listing.rating.average * listing.rating.count) + rating;
      listing.rating.count += 1;
      listing.rating.average = totalRating / listing.rating.count;
      await listing.save();
    }

    res.json({
      message: 'Review added successfully',
      booking
    });
  } catch (error) {
    console.error('Add review error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }
    res.status(500).json({ message: 'Server error while adding review' });
  }
});

export default router;
