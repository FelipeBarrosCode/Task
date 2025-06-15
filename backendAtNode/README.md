# Backend - Log Management API

A robust Node.js/Express API for managing log entries with authentication, role-based access control, and advanced search capabilities. Built with MongoDB and comprehensive middleware for security and performance.

## 🚀 Features

- **JWT Authentication**: Secure token-based authentication system
- **Role-Based Access Control**: Manager and Viewer roles with different permissions
- **Advanced Log Search**: Filter by level, service, date range, and metadata tags
- **File Upload Processing**: Support for multiple log formats with intelligent parsing
- **Manual Log Creation**: API endpoint for creating individual log entries (Manager only)
- **Flattened Metadata Storage**: Optimized metadata structure for better querying
- **Organization Isolation**: Multi-tenant architecture with organization-based data separation
- **Comprehensive Validation**: Input validation and sanitization
- **Error Handling**: Structured error responses and logging
- **CORS Support**: Configurable cross-origin resource sharing

## 🛠️ Tech Stack

- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file upload handling
- **Express Validator** for input validation
- **Moment.js** for date manipulation
- **Winston** for logging
- **Bcrypt** for password hashing

## 📁 Project Structure

```
backendAtNode/
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── logs.js              # Log management endpoints (UPDATED)
│   └── users.js             # User management endpoints
├── models/
│   ├── User.js              # User schema and model
│   ├── Log.js               # Log schema and model
│   └── Organization.js      # Organization schema
├── middleware/
│   ├── jwtValidation.js     # JWT token validation
│   └── roleCheck.js         # Role-based access control
├── utils/
│   ├── jwt.js               # JWT utility functions
│   ├── logger.js            # Winston logger configuration
│   └── logParser.js         # Log format detection and parsing
├── uploads/                 # Temporary file storage
├── app.js                   # Express app configuration
├── database.js              # MongoDB connection
├── config.js                # Environment configuration
├── enums.js                 # Application enums
└── package.json
```

## 🔧 Installation & Setup

### Prerequisites

- Node.js 18+ and npm (for local development)
- Docker and Docker Compose (for containerized development)
- MongoDB 7+ (local, cloud instance, or Docker container)

### Docker Development (Recommended)

#### Development Environment
```bash
# Start development environment with hot reload and MongoDB
docker compose --profile dev up --build

# View backend logs
docker compose logs -f backend-dev

# API will be available at http://localhost:8000
```

#### Production Environment
```bash
# Start production environment (requires external MongoDB)
docker compose --profile prod up --build

# View backend logs
docker compose logs -f backend

# API will be available at http://localhost:8000
```

### Local Development (Manual Setup)

1. **Navigate to backend directory**
   ```bash
   cd backendAtNode
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file or set environment variables:
   ```bash
   PORT=8000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/logs_db
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE_MINUTES=60
   ALLOWED_ORIGINS=http://localhost:5173,http://frontend:5173
   ```

4. **Start the server**
   ```bash
   npm start          # Production mode
   npm run dev        # Development mode with nodemon
   ```

5. **API will be available at**
   - http://localhost:8000

### Docker Multi-Stage Build

The backend Dockerfile supports multiple build targets:

- **Development Stage**: 
  - Full npm install with development dependencies
  - Runs with nodemon for automatic restarts
  - Source code mounted for live changes
  - Debug logging enabled

- **Production Stage**: 
  - Production-only dependencies (`npm ci --only=production`)
  - Optimized for performance and security
  - Minimal container size
  - Production logging configuration

### Production Deployment

#### Docker Production
```bash
# Using Docker Compose
docker compose --profile prod up --build -d

# Monitor logs
docker compose logs -f backend
```

#### Manual Production
```bash
NODE_ENV=production npm start
```

## 🔐 Authentication & Authorization

### JWT Token System

The API uses JSON Web Tokens for stateless authentication:

1. **Login Process**:
   - User provides email/password
   - Server validates credentials
   - Returns JWT token with user info and role
   - Token expires after configured time (default: 60 minutes)

2. **Token Structure**:
   ```json
   {
     "sub": "user_id",
     "email": "user@example.com",
     "role": "manager",
     "organizationID": "org_id",
     "exp": 1234567890
   }
   ```

### User Roles

- **Manager**: Full CRUD access to logs, can upload files, create logs manually, manage users
- **Viewer**: Read-only access to logs and search functionality

### Middleware Chain

1. **JWT Validation** (`jwtValidation.js`):
   - Validates token signature and expiration
   - Fetches user data and stores in `res.locals.userData`
   - Handles token refresh logic

2. **Role Check** (`roleCheck.js`):
   - Verifies user has required role for endpoint
   - Uses cached user data from JWT validation

## 📊 API Endpoints

### Authentication Routes (`/auth`)

#### POST `/auth/signup`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "viewer",
  "organizationID": "org_123"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user_id": "user_id_here"
}
```

#### POST `/auth/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "manager",
    "organizationID": "org_123"
  }
}
```

### Log Management Routes (`/logs`)

#### GET `/logs`
Retrieve logs with advanced filtering and pagination.

**Query Parameters:**
- `level` - Filter by log level (debug, info, warn, error, critical)
- `service` - Filter by service name
- `tag` - Filter by metadata tags (supports multiple values)
- `start_date` - Filter logs after this date (ISO 8601)
- `end_date` - Filter logs before this date (ISO 8601)
- `search` - Text search in message, service, and metadata
- `limit` - Number of results per page (1-100, default: 10)
- `offset` - Number of results to skip (default: 0)

**Example Request:**
```
GET /logs?level=error&service=api&limit=25&offset=0&tag=database&tag=timeout
```

**Response:**
```json
{
  "logs": [
    {
      "_id": "log_id",
      "timestamp": "2024-01-15T10:30:00Z",
      "level": "error",
      "service": "api",
      "message": "Database connection timeout",
      "format": "json_lines",
      "organizationID": "org_123",
      "meta": {
        "database": "users",
        "timeout": "5000ms",
        "connection_id": "conn_123"
      },
      "original_level": "ERROR"
    }
  ],
  "pagination": {
    "offset": 0,
    "limit": 25,
    "total_pages": 5
  }
}
```

#### GET `/logs/:log_id`
Retrieve a specific log entry by ID.

**Response:**
```json
{
  "_id": "log_id",
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "error",
  "service": "api",
  "message": "Database connection timeout",
  "format": "json_lines",
  "organizationID": "org_123",
  "meta": {
    "database": "users",
    "timeout": "5000ms"
  },
  "original_level": "ERROR"
}
```

#### POST `/logs/upload`
Upload and process log files (Manager only).

**Request:**
- Content-Type: `multipart/form-data`
- File field: `file`
- Supported formats: `.log`, `.txt`, `.json`, `.jsonl`
- Max file size: 5MB

**Processing Features:**
- **Automatic Format Detection**: Intelligently detects log format
- **Metadata Flattening**: Nested objects are flattened to single-level structure
- **Error Handling**: Invalid lines are logged as error entries
- **Streaming Processing**: Efficient handling of large files
- **Batch Insert**: Optimized database operations

**Response:**
```json
{
  "message": "File processed successfully",
  "stats": {
    "total_lines": 1000,
    "parsed_logs": 995,
    "error_count": 5,
    "file_name": "app.log",
    "file_size": 1048576
  }
}
```

#### POST `/logs/ingest`
Create a single log entry manually (Manager only).

**Request Body:**
```json
{
  "level": "error",
  "service": "api-gateway",
  "message": "Authentication failed for user request",
  "format": "json_lines",
  "meta": {
    "user_id": "user_123",
    "endpoint": "/api/protected",
    "ip_address": "192.168.1.100",
    "response_time": 250
  }
}
```

**Validation Rules:**
- `level`: Required, must be one of: debug, info, warn, error, critical
- `service`: Required, non-empty string
- `message`: Required, non-empty string
- `format`: Required, must be valid LogFormat enum value
- `meta`: Optional, must be valid JSON object

**Response:**
```json
{
  "message": "Log created successfully",
  "log_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "log": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "level": "error",
    "service": "api-gateway",
    "message": "Authentication failed for user request",
    "format": "json_lines",
    "meta": {
      "user_id": "user_123",
      "endpoint": "/api/protected",
      "ip_address": "192.168.1.100",
      "response_time": 250
    },
    "original_level": "error"
  }
}
```

#### PATCH `/logs/:log_id`
Update a log entry (Manager only).

**Request Body:**
```json
{
  "level": "warn",
  "service": "updated-service",
  "message": "Updated message",
  "meta": {
    "updated": "true"
  }
}
```

#### DELETE `/logs/:log_id`
Delete a log entry (Manager only).

**Response:**
```json
{
  "message": "Log deleted successfully"
}
```

## 🔍 Advanced Search Features

### Tag-Based Search

The API implements sophisticated tag searching that looks for matches in both metadata keys and values:

```javascript
// Searches for tags in both keys and values of the meta object
const tagFilter = (log, searchTags) => {
  return searchTags.every(tag => {
    // Check if tag matches any key
    if (Object.keys(log.meta).some(k => k === tag)) return true;
    // Check if tag matches any value
    if (Object.values(log.meta).some(v => String(v) === tag)) return true;
    return false;
  });
};
```

### Text Search

Full-text search across multiple fields:
- Log messages
- Service names
- Metadata values (flattened structure improves search performance)

### Date Range Filtering

Supports precise timestamp filtering with ISO 8601 date formats.

## 📁 File Upload & Processing

### Supported Log Formats

1. **JSON Lines (.jsonl)**:
   ```json
   {"timestamp": "2024-01-15T10:30:00Z", "level": "error", "message": "Error occurred", "meta": {"user": {"id": 123}}}
   ```

2. **Standard JSON (.json)**:
   ```json
   [
     {"timestamp": "2024-01-15T10:30:00Z", "level": "error", "message": "Error occurred", "meta": {"user": {"id": 123}}}
   ]
   ```

3. **Plain Text (.log, .txt)**:
   ```
   2024-01-15 10:30:00 ERROR Error occurred in service
   ```

### Processing Pipeline

1. **File Validation**: Check file type and size
2. **Format Detection**: Automatically detect log format
3. **Line-by-Line Processing**: Stream processing for large files
4. **Metadata Flattening**: Nested objects are flattened to improve query performance
5. **Error Handling**: Invalid lines are logged as error entries
6. **Batch Insert**: Efficient database insertion
7. **Cleanup**: Temporary files are removed after processing

### Metadata Flattening Process

**Before Flattening:**
```json
{
  "meta": {
    "user": {
      "id": 123,
      "details": {
        "role": "admin",
        "permissions": ["read", "write"]
      }
    },
    "request": {
      "method": "POST",
      "url": "/api/users"
    }
  }
}
```

**After Flattening:**
```json
{
  "meta": {
    "id": 123,
    "role": "admin",
    "permissions": ["read", "write"],
    "method": "POST",
    "url": "/api/users"
  }
}
```

**Benefits:**
- Simplified query structure
- Better search performance
- Consistent metadata format
- Reduced storage complexity

## 🗄️ Database Schema

### User Model
```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  role: Enum ['manager', 'viewer'],
  organizationID: ObjectId (required),
  createdAt: Date,
  updatedAt: Date
}
```

### Log Model
```javascript
{
  timestamp: Date (required),
  level: Enum ['debug', 'info', 'warn', 'error', 'critical'],
  service: String (required),
  message: String (required),
  format: Enum ['json_lines', 'syslog', 'nginx_error', 'clf'],
  organizationID: ObjectId (required),
  meta: Object (flattened metadata structure),
  original_level: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Organization Model
```javascript
{
  name: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 8000 | No |
| `NODE_ENV` | Environment mode | development | No |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRE_MINUTES` | Token expiration time | 60 | No |
| `ALLOWED_ORIGINS` | CORS allowed origins | * | No |

### Security Configuration

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Security**: Strong secret key required
- **Input Validation**: All inputs validated and sanitized
- **Rate Limiting**: Configurable request limits
- **CORS**: Configurable origin restrictions

## 🚀 Performance Optimizations

### Database Optimizations

- **Indexes**: Optimized queries with proper indexing
- **Flattened Metadata**: Simplified structure improves query performance
- **Aggregation**: Efficient filtering using MongoDB aggregation
- **Pagination**: Cursor-based pagination for large datasets

### Memory Management

- **Streaming**: Large file processing with streams
- **Cleanup**: Automatic temporary file cleanup
- **Connection Pooling**: MongoDB connection optimization

### Caching Strategy

- **User Data Caching**: User information cached in JWT validation
- **Query Optimization**: Efficient database queries with flattened metadata

## 🆕 Recent Updates

### Manual Log Creation
- **POST /logs/ingest**: New endpoint for creating individual log entries
- **Manager-only Access**: Role-based permission enforcement
- **Comprehensive Validation**: Input validation with detailed error messages
- **Metadata Support**: Accepts structured metadata objects

### Enhanced File Processing
- **Metadata Flattening**: Nested objects are automatically flattened
- **Original Key Preservation**: Maintains original key names without prefixes
- **Improved Performance**: Flattened structure enables faster queries
- **Better Search**: Simplified metadata structure improves search capabilities

### API Improvements
- **Enhanced Error Handling**: More detailed error responses
- **Better Validation**: Improved input validation and sanitization
- **Consistent Responses**: Standardized response formats across endpoints
- **Performance Monitoring**: Better logging and performance tracking

## 🐛 Error Handling

### Error Response Format

```json
{
  "detail": "Error description",
  "errors": [
    {
      "field": "level",
      "message": "Invalid log level",
      "value": "invalid_level"
    }
  ]
}
```

### Common Error Codes

- **400 Bad Request**: Validation errors, malformed requests
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Insufficient permissions for operation
- **404 Not Found**: Resource not found
- **413 Payload Too Large**: File upload exceeds size limit
- **422 Unprocessable Entity**: Valid request format but semantic errors
- **500 Internal Server Error**: Server-side errors

### Validation Errors

The API provides detailed validation errors for all endpoints:

```json
{
  "detail": "Validation errors",
  "errors": [
    {
      "field": "service",
      "message": "Service is required",
      "location": "body"
    },
    {
      "field": "level",
      "message": "Invalid log level",
      "value": "invalid",
      "location": "body"
    }
  ]
}
```

## 🧪 Testing

### API Testing Examples

```bash
# Test log creation
curl -X POST http://localhost:8000/logs/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "level": "error",
    "service": "test-service",
    "message": "Test log message",
    "format": "json_lines",
    "meta": {
      "test": true,
      "environment": "development"
    }
  }'

# Test file upload
curl -X POST http://localhost:8000/logs/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.log"

# Test log search
curl "http://localhost:8000/logs?level=error&service=api&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📝 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🎯 Usage Examples

### Creating Logs Programmatically

```javascript
// Example: Creating a log entry via API
const createLog = async (logData) => {
  const response = await fetch('/logs/ingest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      level: 'info',
      service: 'user-service',
      message: 'User login successful',
      format: 'json_lines',
      meta: {
        user_id: '12345',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0...'
      }
    })
  });
  
  return response.json();
};
```

### Metadata Flattening Example

```javascript
// Input metadata (nested)
const nestedMeta = {
  user: {
    id: 123,
    profile: {
      name: 'John Doe',
      role: 'admin'
    }
  },
  request: {
    method: 'GET',
    path: '/api/users'
  }
};

// After flattening (stored in database)
const flattenedMeta = {
  id: 123,
  name: 'John Doe',
  role: 'admin',
  method: 'GET',
  path: '/api/users'
};
```
