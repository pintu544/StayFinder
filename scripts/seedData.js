import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

// Get __dirname equivalent for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';



const seedUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '+1-555-0101',
    role: 'host',
    bio: 'Experienced host with a passion for hospitality. I love meeting new people and helping them discover amazing places.',
    isVerified: true
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    password: 'password123',
    phone: '+1-555-0102',
    role: 'guest',
    bio: 'Travel enthusiast who loves exploring new cities and cultures.',
    isVerified: true
  },
  {
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike@example.com',
    password: 'password123',
    phone: '+1-555-0103',
    role: 'host',
    bio: 'Property manager with 10+ years of experience in vacation rentals.',
    isVerified: true
  },
  {
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah@example.com',
    password: 'password123',
    phone: '+1-555-0104',
    role: 'guest',
    bio: 'Digital nomad always looking for comfortable and inspiring places to stay.',
    isVerified: true
  },
  {
    firstName: 'David',
    lastName: 'Brown',
    email: 'david@example.com',
    password: 'password123',
    phone: '+1-555-0105',
    role: 'host',
    bio: 'Architect turned host, offering unique and beautifully designed spaces.',
    isVerified: true
  }
];

const seedListings = [
  {
    title: 'Modern Downtown Loft',
    description: 'Beautiful modern loft in the heart of downtown with stunning city views. Perfect for business travelers and couples. Features include high ceilings, exposed brick, modern appliances, and a private balcony.',
    price: 150,
    location: {
      address: '123 Main Street, Apt 5A',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10001',
      coordinates: {
        latitude: 40.7589,
        longitude: -73.9851
      }
    },
    images: [
      {
        url: '/uploads/listings/modern-loft-1.jpg',
        caption: 'Living room with city view'
      },
      {
        url: '/uploads/listings/modern-loft-2.jpg',
        caption: 'Modern kitchen'
      },
      {
        url: '/uploads/listings/modern-loft-3.jpg',
        caption: 'Bedroom with exposed brick'
      }
    ],
    amenities: ['WiFi', 'Kitchen', 'Air conditioning', 'TV', 'Workspace'],
    propertyType: 'apartment',
    roomType: 'entire_place',
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    availability: {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      blockedDates: []
    },
    rules: {
      checkIn: '3:00 PM',
      checkOut: '11:00 AM',
      smokingAllowed: false,
      petsAllowed: false,
      partiesAllowed: false
    },
    rating: {
      average: 4.8,
      count: 24
    },
    isActive: true
  },
  {
    title: 'Cozy Beach House',
    description: 'Charming beach house just steps from the ocean. Wake up to the sound of waves and enjoy stunning sunrises from your private deck. Perfect for families and beach lovers.',
    price: 250,
    location: {
      address: '456 Ocean Drive',
      city: 'Miami Beach',
      state: 'FL',
      country: 'USA',
      zipCode: '33139',
      coordinates: {
        latitude: 25.7907,
        longitude: -80.1300
      }
    },
    images: [
      {
        url: '/uploads/listings/beach-house-1.jpg',
        caption: 'Ocean view from deck'
      },
      {
        url: '/uploads/listings/beach-house-2.jpg',
        caption: 'Bright living area'
      }
    ],
    amenities: ['WiFi', 'Kitchen', 'Air conditioning', 'Parking', 'Balcony'],
    propertyType: 'house',
    roomType: 'entire_place',
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    availability: {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      blockedDates: []
    },
    rules: {
      checkIn: '4:00 PM',
      checkOut: '10:00 AM',
      smokingAllowed: false,
      petsAllowed: true,
      partiesAllowed: false
    },
    rating: {
      average: 4.9,
      count: 31
    },
    isActive: true
  },
  {
    title: 'Mountain Cabin Retreat',
    description: 'Escape to this peaceful mountain cabin surrounded by nature. Perfect for hiking enthusiasts and those seeking tranquility. Features a fireplace, hot tub, and incredible mountain views.',
    price: 180,
    location: {
      address: '789 Mountain View Road',
      city: 'Aspen',
      state: 'CO',
      country: 'USA',
      zipCode: '81611',
      coordinates: {
        latitude: 39.1911,
        longitude: -106.8175
      }
    },
    images: [
      {
        url: '/uploads/listings/mountain-cabin-1.jpg',
        caption: 'Cabin exterior with mountain view'
      },
      {
        url: '/uploads/listings/mountain-cabin-2.jpg',
        caption: 'Cozy living room with fireplace'
      }
    ],
    amenities: ['WiFi', 'Kitchen', 'Heating', 'Fireplace', 'Hot tub'],
    propertyType: 'house',
    roomType: 'entire_place',
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3,
    availability: {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      blockedDates: []
    },
    rules: {
      checkIn: '3:00 PM',
      checkOut: '11:00 AM',
      smokingAllowed: false,
      petsAllowed: true,
      partiesAllowed: false
    },
    rating: {
      average: 4.7,
      count: 18
    },
    isActive: true
  },
  {
    title: 'Luxury City Penthouse',
    description: 'Stunning penthouse with panoramic city views, premium finishes, and world-class amenities. Perfect for special occasions and luxury travelers. Includes concierge service and gym access.',
    price: 500,
    location: {
      address: '321 Luxury Lane, PH1',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      zipCode: '90210',
      coordinates: {
        latitude: 34.0522,
        longitude: -118.2437
      }
    },
    images: [
      {
        url: '/uploads/listings/penthouse-1.jpg',
        caption: 'Living room with city view'
      },
      {
        url: '/uploads/listings/penthouse-2.jpg',
        caption: 'Master bedroom'
      }
    ],
    amenities: ['WiFi', 'Kitchen', 'Air conditioning', 'Gym', 'Pool', 'Parking'],
    propertyType: 'apartment',
    roomType: 'entire_place',
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    availability: {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      blockedDates: []
    },
    rules: {
      checkIn: '3:00 PM',
      checkOut: '12:00 PM',
      smokingAllowed: false,
      petsAllowed: false,
      partiesAllowed: false
    },
    rating: {
      average: 4.9,
      count: 42
    },
    isActive: true
  },
  {
    title: 'Historic Brownstone',
    description: 'Beautiful historic brownstone in a charming neighborhood. Rich in character with original details, modern updates, and close to local attractions. Perfect for culture enthusiasts.',
    price: 200,
    location: {
      address: '654 Heritage Street',
      city: 'Boston',
      state: 'MA',
      country: 'USA',
      zipCode: '02116',
      coordinates: {
        latitude: 42.3601,
        longitude: -71.0589
      }
    },
    images: [
      {
        url: '/uploads/listings/brownstone-1.jpg',
        caption: 'Historic facade'
      },
      {
        url: '/uploads/listings/brownstone-2.jpg',
        caption: 'Period living room'
      }
    ],
    amenities: ['WiFi', 'Kitchen', 'Heating', 'Fireplace', 'Garden'],
    propertyType: 'house',
    roomType: 'entire_place',
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    availability: {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      blockedDates: []
    },
    rules: {
      checkIn: '3:00 PM',
      checkOut: '11:00 AM',
      smokingAllowed: false,
      petsAllowed: true,
      partiesAllowed: false
    },
    rating: {
      average: 4.6,
      count: 15
    },
    isActive: true
  }
];

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stayfinder';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const ensureUploadsDir = () => {
  const dir = path.join(__dirname, '../uploads/listings');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('Created uploads/listings directory');
  }
};

const seedDatabase = async () => {
  try {
    ensureUploadsDir();
    console.log('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Listing.deleteMany({});
    await Booking.deleteMany({});
    console.log('Cleared existing data');

    // Create users (hash passwords)
    const createdUsers = [];
    for (const userData of seedUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({ ...userData, password: hashedPassword });
      await user.save();
      createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} users`);

    // Create listings and assign hosts
    const createdListings = [];
    const hosts = createdUsers.filter(user => user.role === 'host');
    
    for (let i = 0; i < seedListings.length; i++) {
      const listingData = {
        ...seedListings[i],
        host: hosts[i % hosts.length]._id
      };
      const listing = new Listing(listingData);
      await listing.save();
      createdListings.push(listing);
    }
    console.log(`Created ${createdListings.length} listings`);

    // Create sample bookings
    const guests = createdUsers.filter(user => user.role === 'guest');
    const sampleBookings = [
      {
        listing: createdListings[0]._id,
        guest: guests[0]._id,        checkIn: new Date('2025-07-15'),
        checkOut: new Date('2025-07-20'),
        guests: {
          adults: 2,
          children: 0,
          infants: 0
        },
        totalAmount: 750,
        status: 'confirmed',
        paymentStatus: 'paid'
      },
      {
        listing: createdListings[1]._id,
        guest: guests[1]._id,        checkIn: new Date('2025-08-01'),
        checkOut: new Date('2025-08-07'),
        guests: {
          adults: 4,
          children: 2,
          infants: 0
        },
        totalAmount: 1500,
        status: 'confirmed',
        paymentStatus: 'paid'
      }
    ];

    for (const bookingData of sampleBookings) {
      const booking = new Booking(bookingData);
      await booking.save();
    }
    console.log(`Created ${sampleBookings.length} bookings`);

    console.log('Database seeding completed successfully!');
    // Demo credentials for development only. Do not use in production.
    console.log('\nDemo credentials:');
    console.log('Host: john@example.com / password123');
    console.log('Guest: jane@example.com / password123');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  connectDB().then(() => {
    seedDatabase();
  });
}

export { seedDatabase, connectDB };
