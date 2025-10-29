# Splitlyr API Services

A comprehensive Node.js REST API for expense splitting and friend management, built with MongoDB, JWT authentication, and robust security features.

## 🚀 Overview

Splitlyr API is the backend service powering the Splitlyr mobile application. It provides a complete expense-splitting platform with user management, friend networks, group functionality, and detailed expense tracking with automatic balance calculations.

## ✨ Key Features

### 🔐 Authentication & Security
- **JWT-based Authentication** - Secure token-based auth system
- **Password Hashing** - bcrypt with salt rounds for secure password storage
- **Rate Limiting** - Protection against brute force attacks (production)
- **Input Validation** - Comprehensive Joi validation schemas
- **Security Headers** - Helmet middleware for HTTP security
- **CORS Protection** - Configurable cross-origin resource sharing

### 👥 User Management
- **User Registration & Login** - Complete authentication flow
- **Profile Management** - Update user information and profile images
- **Password Management** - Secure password change functionality
- **User Search** - Find users by name or email
- **Account Status** - Active/inactive user management

### 🤝 Friend System
- **Friend Management** - Add, remove, and manage friends
- **Pending Friends** - Invite system for non-registered users
- **Contact Integration** - Support for email and phone-based invitations
- **Automatic Friend Conversion** - Convert pending friends when they join
- **Friend Search** - Search existing app users

### 👨‍👩‍👧‍👦 Group Management
- **Group Creation** - Create groups with multiple members
- **Member Management** - Add/remove members with role-based access
- **Group Roles** - Admin and member permissions
- **Group Settings** - Update group information and descriptions
- **Member Validation** - Automatic friend addition for group members

### 💰 Expense Tracking
- **Expense Creation** - Record shared expenses with detailed splits
- **Multiple Split Types** - Flexible expense splitting options
- **Balance Calculations** - Automatic balance tracking between users
- **Settlement System** - Mark expenses as settled
- **Group Expenses** - Track expenses within groups
- **Category Support** - Organize expenses by categories
- **Currency Support** - Multi-currency expense tracking

### 🏥 Health Monitoring
- **Health Checks** - Comprehensive system health monitoring
- **Database Status** - MongoDB connection monitoring
- **Memory Usage** - System resource tracking
- **Uptime Monitoring** - Service availability tracking

### 🏗️ Architecture
- **MVC Pattern** - Clean, organized code structure
- **MongoDB Integration** - Mongoose ODM with advanced schemas
- **Error Handling** - Comprehensive error handling and logging
- **Middleware Stack** - Modular middleware architecture
- **Docker Support** - Containerized deployment ready

## 📚 API Endpoints

### 🔐 Authentication (`/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - User login

### 👤 User Management (`/v1/users`)
- `GET /profile` - Get user profile (protected)
- `PATCH /profile` - Update user profile (protected)
- `PATCH /change-password` - Change user password (protected)
- `GET /` - Search users by name/email (protected)
- `GET /balances` - Get all user balances (protected)

### 🤝 Friend Management (`/v1/users/friends`)
- `GET /friends` - Get user's friends and pending friends (protected)
- `POST /friends` - Add friends (bulk operation) (protected)
- `DELETE /friends/:friendId` - Remove friend (protected)
- `GET /friends/:friendId/balance` - Get balance with specific friend (protected)

### 👨‍👩‍👧‍👦 Group Management (`/v1/groups`)
- `POST /` - Create new group (protected)
- `GET /` - Get user's groups (protected)
- `GET /:id` - Get specific group details (protected)
- `PUT /:id` - Update group information (protected)
- `DELETE /:id` - Delete group (protected)
- `POST /:id/members` - Add member to group (protected)
- `DELETE /:id/members/:memberId` - Remove member from group (protected)
- `DELETE /:id/leave` - Leave group (protected)

### 💰 Expense Management (`/v1/expenses`)
- `POST /` - Create new expense (protected)
- `GET /` - Get user's expenses (protected)
- `GET /:id` - Get specific expense details (protected)
- `PUT /:id` - Update expense (protected)
- `DELETE /:id` - Delete expense (protected)
- `PATCH /:id/settle` - Settle expense split (protected)
- `GET /group/:groupId` - Get group expenses (protected)
- `GET /group/:groupId/balance` - Get group balance (protected)

### 🏥 Health Check (`/v1/healthz`)
- `GET /` - System health check (public)

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone and navigate to services directory:**
   ```bash
   cd services
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/Splitlyr?retryWrites=true&w=majority

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   JWT_EXPIRES_IN=2d

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Security (Production)
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Start the server:**
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Verify installation:**
   Visit `http://localhost:3000/v1/healthz` to check if the server is running.

### 🐳 Docker Deployment

1. **Build the Docker image:**
   ```bash
   docker build -t splitlyr-api .
   ```

2. **Run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Health check:**
   ```bash
   curl http://localhost:3000/v1/healthz
   ```

## 🔐 Authentication Flow

### 1. User Registration
```bash
POST /v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}

# Response
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### 2. User Login
```bash
POST /v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}

# Response
{
  "success": true,
  "message": "Login successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### 3. Using Protected Routes
Include the JWT token in the Authorization header:
```bash
GET /v1/users/profile
Authorization: Bearer <your-jwt-token>
```

## 💡 Usage Examples

### Adding Friends
```bash
POST /v1/users/friends
Authorization: Bearer <token>
Content-Type: application/json

{
  "friends": [
    {
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    {
      "name": "Bob Johnson",
      "phoneNumber": "+1234567890"
    }
  ]
}
```

### Creating a Group
```bash
POST /v1/groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Weekend Trip",
  "description": "Expenses for our weekend getaway",
  "members": ["friend_user_id_1", "friend_user_id_2"]
}
```

### Creating an Expense
```bash
POST /v1/expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Dinner at restaurant",
  "amount": 120.00,
  "currency": "USD",
  "paidBy": "user_id",
  "splitWith": [
    {
      "user": "friend_id_1",
      "amount": 40.00
    },
    {
      "user": "friend_id_2", 
      "amount": 40.00
    },
    {
      "user": "current_user_id",
      "amount": 40.00
    }
  ],
  "category": "food",
  "group": "group_id_optional"
}
```

### Getting Balances
```bash
GET /v1/users/balances
Authorization: Bearer <token>

# Response
{
  "success": true,
  "data": [
    {
      "friend": {
        "_id": "friend_id",
        "name": "Jane Smith",
        "profileImage": "image_url"
      },
      "balance": 25.50,
      "message": "You are owed 25.50"
    }
  ]
}
```

## 📁 Project Structure

```
services/
├── config/
│   └── database.js              # MongoDB connection configuration
├── controllers/
│   ├── authController.js        # Authentication logic (register, login)
│   ├── userController.js        # User management and friends
│   ├── groupController.js       # Group management operations
│   ├── expenseController.js     # Expense tracking and balances
│   └── healthController.js      # Health monitoring endpoints
├── middleware/
│   ├── auth.js                  # JWT authentication middleware
│   └── errorHandler.js          # Global error handling
├── models/
│   ├── User.js                  # User schema with friends system
│   ├── Group.js                 # Group schema with member management
│   ├── Expense.js               # Expense schema with split calculations
│   └── PendingFriend.js         # Pending friend invitations
├── routes/
│   ├── index.js                 # Main router configuration
│   ├── auth.js                  # Authentication routes
│   ├── users.js                 # User and friend management routes
│   ├── groups.js                # Group management routes
│   ├── expenses.js              # Expense tracking routes
│   └── health.js                # Health check routes
├── scripts/                     # Database scripts and utilities
├── utils/                       # Utility functions and helpers
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Environment variables template
├── docker-compose.yml           # Docker composition for deployment
├── Dockerfile                   # Docker container configuration
├── package.json                 # Dependencies and npm scripts
├── server.js                    # Main application entry point
└── README.md                    # This documentation
```

## 🛡️ Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication with configurable expiration
- **Password Hashing**: bcrypt with salt rounds (12) for secure password storage
- **Token Validation**: Comprehensive JWT verification with user status checks
- **Role-based Access**: Admin and user role management
- **Account Status**: Active/inactive user account management

### Input Validation & Sanitization
- **Joi Validation**: Comprehensive request validation schemas
- **Mongoose Validation**: Database-level data validation
- **Email Validation**: Advanced email format validation with edge case handling
- **MongoDB Sanitization**: Protection against NoSQL injection attacks
- **XSS Protection**: Input sanitization and output encoding

### Security Middleware
- **Helmet**: Security headers for HTTP protection
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Brute force attack prevention (production only)
- **HPP**: HTTP Parameter Pollution protection
- **Compression**: Response compression for performance
- **Morgan**: HTTP request logging for monitoring

### Error Handling & Monitoring
- **Global Error Handler**: Centralized error processing
- **Structured Logging**: Comprehensive request and error logging
- **Health Monitoring**: System health and database status checks
- **Graceful Shutdown**: Proper handling of unhandled rejections and exceptions

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGO_URL` | MongoDB connection string | - | ✅ |
| `JWT_SECRET` | Secret key for JWT signing | - | ✅ |
| `JWT_EXPIRES_IN` | JWT token expiration time | `2d` | ❌ |
| `PORT` | Server port | `3000` | ❌ |
| `NODE_ENV` | Environment mode | `development` | ❌ |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` | ❌ |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | ❌ |

### Database Schema Overview

#### User Model
- **Authentication**: Email, password (hashed), role, status
- **Profile**: Name, profile image, phone number
- **Relationships**: Friends array, pending friends array
- **Timestamps**: Created, updated, last login

#### Group Model
- **Basic Info**: Name, description, creator
- **Members**: User references with roles (admin/member)
- **Metadata**: Active status, member count, timestamps

#### Expense Model
- **Details**: Description, amount, currency, category
- **Participants**: Paid by, split with (amounts and settlement status)
- **Organization**: Group reference, date, settlement tracking
- **Calculations**: Automatic balance calculations and validations

#### PendingFriend Model
- **Contact Info**: Name, email, phone number
- **Relationship**: Added by user reference
- **Auto-conversion**: Converts to friend when user joins

## 📝 API Response Format

### Success Response
All successful API responses follow this consistent format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data object or array
  }
}
```

### Error Response
All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific field error"
    }
  ]
}
```

### HTTP Status Codes

| Status Code | Description | Usage |
|-------------|-------------|-------|
| `200` | OK | Successful GET, PUT, PATCH requests |
| `201` | Created | Successful POST requests |
| `400` | Bad Request | Validation errors, malformed requests |
| `401` | Unauthorized | Authentication required or failed |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Duplicate resource creation |
| `422` | Unprocessable Entity | Validation errors |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server-side errors |
| `503` | Service Unavailable | Database connection issues |

## 🔍 Error Handling

### Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters long"
    }
  ]
}
```

### Authentication Errors
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Resource Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

## 🛠️ Development

### Available Scripts

```bash
# Install dependencies
npm install

# Start in development mode (with nodemon auto-reload)
npm run dev

# Start in production mode
npm start

# Run with Docker
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Development Workflow

1. **Setup Development Environment:**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd services
   
   # Install dependencies
   npm install
   
   # Copy environment template
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Database Setup:**
   - Set up MongoDB (local or cloud)
   - Update `MONGO_URL` in `.env`
   - The application will automatically connect on startup

3. **Testing the API:**
   ```bash
   # Health check
   curl http://localhost:3000/v1/healthz
   
   # Register a user
   curl -X POST http://localhost:3000/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
   ```

### Code Structure Guidelines

- **Controllers**: Handle HTTP requests and responses
- **Models**: Define database schemas and business logic
- **Middleware**: Handle cross-cutting concerns (auth, validation, errors)
- **Routes**: Define API endpoints and route handlers
- **Utils**: Utility functions and helpers

### Database Relationships

```
User
├── friends: [User] (many-to-many)
├── pendingFriends: [PendingFriend] (one-to-many)
└── groups: [Group] (many-to-many through members)

Group
├── members: [User] (many-to-many)
├── createdBy: User (many-to-one)
└── expenses: [Expense] (one-to-many)

Expense
├── createdBy: User (many-to-one)
├── paidBy: User (many-to-one)
├── splitWith: [User] (many-to-many with amounts)
└── group: Group (many-to-one, optional)

PendingFriend
└── addedBy: User (many-to-one)
```

## 🚀 Deployment

### Production Deployment

1. **Environment Setup:**
   ```bash
   # Set production environment variables
   NODE_ENV=production
   MONGO_URL=mongodb+srv://...
   JWT_SECRET=your-production-secret
   ```

2. **Docker Deployment:**
   ```bash
   # Build and run with Docker Compose
   docker-compose up -d
   
   # Check health
   curl http://your-domain.com:3000/v1/healthz
   ```

3. **Security Checklist:**
   - [ ] Strong JWT secret (64+ characters)
   - [ ] Secure MongoDB connection string
   - [ ] Rate limiting enabled
   - [ ] HTTPS configured (reverse proxy)
   - [ ] Environment variables secured
   - [ ] Database access restricted

### Monitoring & Maintenance

- **Health Checks**: `/v1/healthz` endpoint for monitoring
- **Logging**: Comprehensive request and error logging
- **Memory Monitoring**: Built-in memory usage tracking
- **Database Status**: Connection status monitoring

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Add comprehensive error handling
- Include input validation for all endpoints
- Write clear commit messages
- Test API endpoints thoroughly
- Update documentation for new features

## 📄 License

This project is licensed under the ISC License.

---

**API Version**: v1  
**Node.js**: v22+  
**MongoDB**: v4.4+  
**Docker**: Supported
