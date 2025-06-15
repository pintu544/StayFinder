import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  images: [{
    url: String,
    caption: String
  }],
  amenities: [{
    type: String,
    enum: [
      'WiFi', 'Kitchen', 'Washer', 'Dryer', 'Air conditioning', 
      'Heating', 'Parking', 'Pool', 'Hot tub', 'Gym', 
      'TV', 'Workspace', 'Fireplace', 'Balcony', 'Garden'
    ]
  }],
  propertyType: {
    type: String,
    required: [true, 'Property type is required'],
    enum: ['apartment', 'house', 'condo', 'villa', 'studio', 'room']
  },
  roomType: {
    type: String,
    required: [true, 'Room type is required'],
    enum: ['entire_place', 'private_room', 'shared_room']
  },
  maxGuests: {
    type: Number,
    required: [true, 'Maximum guests is required'],
    min: [1, 'Must accommodate at least 1 guest']
  },
  bedrooms: {
    type: Number,
    required: [true, 'Number of bedrooms is required'],
    min: [0, 'Bedrooms cannot be negative']
  },
  bathrooms: {
    type: Number,
    required: [true, 'Number of bathrooms is required'],
    min: [0, 'Bathrooms cannot be negative']
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  availability: {
    startDate: Date,
    endDate: Date,
    blockedDates: [Date]
  },
  rules: {
    checkIn: String,
    checkOut: String,
    smokingAllowed: { type: Boolean, default: false },
    petsAllowed: { type: Boolean, default: false },
    partiesAllowed: { type: Boolean, default: false }
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for searching
listingSchema.index({ 'location.city': 1, 'location.state': 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ propertyType: 1 });
listingSchema.index({ maxGuests: 1 });

export default mongoose.model('Listing', listingSchema);
