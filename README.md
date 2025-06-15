# StayFinder 🏠

A full-stack web application similar to Airbnb for short-term and long-term property rentals built with modern ES6 modules.

## 🚀 Features

### Frontend (React + Vite)
- Property listing with search and filters
- Property detail pages with image galleries
- User authentication (login/register)
- Host dashboard for property management
- Booking management system
- Responsive design with modern UI

### Backend (Node.js + Express)
- RESTful API with ES6 modules
- JWT-based authentication
- File upload for property images
- Database integration with MongoDB
- Input validation and error handling

### Database (MongoDB)
- User management with role-based access
- Property listings with geolocation
- Booking system with status tracking
- Review and rating system

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router, Axios
- **Backend**: Node.js (ES6 modules), Express.js, MongoDB, Mongoose
- **Authentication**: JWT, bcryptjs
- **File Upload**: Multer
- **Development**: Concurrently, Nodemon
- **Validation**: express-validator, react-hook-form

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd stayfinder
   ```

2. Install all dependencies:
   ```bash
   npm run install-all
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both `server` and `client` directories
   - Configure your MongoDB connection string
   - Set JWT secret (32+ characters recommended)
   - Update API URL if needed

4. Seed the database (optional):
   ```bash
   cd server
   npm run seed
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Listings
- `GET /api/listings` - Get all listings (with filters)
- `GET /api/listings/:id` - Get specific listing
- `GET /api/listings/host/my-listings` - Get host's listings
- `POST /api/listings` - Create new listing (auth required)
- `PUT /api/listings/:id` - Update listing (auth required)
- `DELETE /api/listings/:id` - Delete listing (auth required)

### Bookings
- `POST /api/bookings` - Create booking (auth required)
- `GET /api/bookings` - Get user bookings (auth required)
- `GET /api/bookings/:id` - Get specific booking (auth required)
- `PUT /api/bookings/:id/cancel` - Cancel booking (auth required)
- `PUT /api/bookings/:id/review` - Add review (auth required)

### Users
- `GET /api/users/profile/:id` - Get user profile by ID

## 🎨 Design

The UI is inspired by modern property rental platforms with:
- Clean, minimalist design using Tailwind CSS
- Responsive grid layouts for all screen sizes
- Interactive components with smooth animations
- Modern color scheme with primary blue theme
- Accessible form controls and navigation

## 🔧 Development

- **Client**: `http://localhost:5173`
- **Server**: `http://localhost:5000`
- **Database**: MongoDB Atlas or local MongoDB

### Demo Credentials
- **Host**: john@example.com / password123
- **Guest**: jane@example.com / password123

## 📝 ES6 Features Used

- ES6 modules (import/export)
- Arrow functions
- Template literals
- Destructuring assignment
- Async/await
- Spread operator
- Object shorthand properties

## 🚀 Deployment

1. Build the client:
   ```bash
   npm run build
   ```

2. Set production environment variables
3. Deploy server to hosting platform (Heroku, Railway, etc.)
4. Deploy client to static hosting (Vercel, Netlify, etc.)

## 🤝 Contributing

This is a learning project demonstrating full-stack development with modern JavaScript. Contributions are welcome!

## 📄 License

MIT License - see LICENSE file for details
