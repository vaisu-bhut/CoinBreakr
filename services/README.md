# CoinBreakr API Services

A secure Node.js REST API with MongoDB, JWT authentication, and comprehensive health monitoring.

## Features

- 🔐 **JWT-based Authentication** - Secure token-based auth system
- 🔒 **Password Hashing** - bcrypt for secure password storage
- 👤 **User Management** - Complete user registration and profile management
- 🏥 **Health Monitoring** - Comprehensive health check endpoints
- 🛡️ **Security Middleware** - Helmet, CORS, rate limiting
- 📁 **MVC Architecture** - Clean, organized code structure
- 🗄️ **MongoDB Integration** - Mongoose ODM with validation

## API Endpoints

### Health Check
- `GET /api/healthz` - Basic health check (public)
- `GET /api/healthz/detailed` - Detailed health info (protected)

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### General
- `GET /api` - API information and available endpoints

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/coinbreakr
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   PORT=3000
   NODE_ENV=development
   ```

3. **Start MongoDB:**
   Make sure MongoDB is running on your system.

4. **Run the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Test the API:**
   Visit `http://localhost:3000/api/healthz` to check if the server is running.

## Authentication Flow

### 1. User Registration
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### 2. User Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### 3. Using Protected Routes
Include the JWT token in the Authorization header:
```bash
GET /api/auth/profile
Authorization: Bearer <your-jwt-token>
```

## Project Structure

```
├── config/
│   └── database.js          # MongoDB connection config
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── healthController.js  # Health check logic
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   └── errorHandler.js     # Global error handler
├── models/
│   └── User.js             # User schema and model
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── health.js           # Health check routes
│   └── index.js            # Main router
├── utils/
│   └── jwt.js              # JWT utility functions
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
├── server.js               # Main server file
└── README.md               # This file
```

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Mongoose schema validation
- **Rate Limiting**: Prevents brute force attacks
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet**: Sets various HTTP headers for security
- **Error Handling**: Comprehensive error handling and logging

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/coinbreakr` |
| `JWT_SECRET` | Secret key for JWT signing | Required |
| `JWT_EXPIRES_IN` | JWT token expiration time | `7d` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Success description",
  "data": {
    // Response data
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Start in development mode (with nodemon)
npm run dev

# Start in production mode
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
