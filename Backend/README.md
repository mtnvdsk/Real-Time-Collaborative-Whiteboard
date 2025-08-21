# Whiteboard Backend API

A Node.js backend API for a collaborative whiteboard application with user authentication and canvas management.

## Features

- User registration and authentication with JWT
- Canvas creation, editing, and sharing
- User profile management
- Secure password hashing with bcrypt
- Input validation with express-validator
- MongoDB database with Mongoose ODM

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/whiteboard
   # or for MongoDB Atlas
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whiteboard

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure

   # Server Configuration
   PORT=3000

   # Optional: For production
   NODE_ENV=development
   ```

4. Start the server:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes (`/users`)

#### POST `/users/register`
Register a new user
- **Body**: `{ "name": "string", "email": "string", "password": "string" }`
- **Response**: `{ "message": "User registered successfully", "user": {...} }`

#### POST `/users/login`
User login
- **Body**: `{ "email": "string", "password": "string" }`
- **Response**: `{ "message": "Login successful", "token": "jwt_token", "user": {...} }`

#### GET `/users/profile`
Get user profile (requires authentication)
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response**: `{ "user": {...} }`

### Canvas Routes (`/api/canvas`)

#### POST `/api/canvas/create`
Create a new canvas (requires authentication)
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Body**: `{ "elements": [...] }`
- **Response**: `{ "message": "Canvas created successfully", "canvas": {...} }`

#### PUT `/api/canvas/update`
Update canvas elements (requires authentication)
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Body**: `{ "id": "canvas_id", "elements": [...] }`
- **Response**: `{ "message": "Canvas updated successfully", "canvas": {...} }`

#### GET `/api/canvas/load/:id`
Load a specific canvas (requires authentication)
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response**: `{ "canvas": {...} }`

#### PUT `/api/canvas/share/:id`
Share canvas with another user (requires authentication)
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Body**: `{ "userEmail": "user@example.com" }`
- **Response**: `{ "message": "Canvas shared successfully" }`

#### PUT `/api/canvas/unshare/:id`
Unshare canvas with a user (requires authentication)
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Body**: `{ "userEmail": "user@example.com" }`
- **Response**: `{ "message": "Canvas unshared successfully" }`

#### DELETE `/api/canvas/delete/:id`
Delete a canvas (requires authentication, owner only)
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response**: `{ "message": "Canvas deleted successfully" }`

#### GET `/api/canvas/list`
Get all user's canvases (requires authentication)
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response**: `{ "canvases": [...] }`

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Database Models

### User Model
- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `timestamps`: Created/updated timestamps

### Canvas Model
- `owner`: ObjectId (required, references User)
- `shared`: Array of ObjectIds (references User)
- `elements`: Array of mixed types (canvas elements)
- `createdAt`: Date (auto-generated)

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token authentication
- Input validation and sanitization
- CORS enabled
- Environment variable configuration

## Development

- **Port**: 3000 (configurable via PORT env variable)
- **Database**: MongoDB with Mongoose
- **Validation**: express-validator
- **Authentication**: JWT with jsonwebtoken
- **Password Hashing**: bcrypt

## License

ISC

