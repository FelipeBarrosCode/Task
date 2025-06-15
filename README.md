# Log Management System - Full Stack Application

A comprehensive log management system built with React frontend, Node.js backend, and MongoDB database. This project provides a complete solution for log ingestion, storage, search, and management with role-based access control.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│   Port: 5173    │    │   Port: 8000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Components

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + MongoDB + JWT Authentication
- **Database**: MongoDB 7 with optimized configuration (development only)
- **Orchestration**: Docker Compose with multi-stage builds for development and production

## 🚀 Quick Start with Docker Compose

### Prerequisites

- Docker and Docker Compose installed
- At least 2GB RAM available for containers
- Ports 5173, 8000, and 27017 available (development only)

### Development Environment Setup

```bash
# Clone the repository and start development services
docker compose --profile dev up --build
```

This command will:
1. Build the frontend React application in development mode with hot reload
2. Build the backend Node.js API in development mode with nodemon
3. Start MongoDB for local development
4. Configure networking between all services
5. Set up environment variables automatically
6. Mount source code for live reloading

### Production Environment Setup

```bash
# Start production services (no MongoDB included)
docker compose --profile prod up --build
```

This command will:
1. Build the frontend React application for production and serve static files
2. Build the backend Node.js API optimized for production
3. Use external MongoDB (configured via environment variables)
4. Optimize containers for production deployment

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **MongoDB** (dev only): localhost:27017

## 🐳 Docker Multi-Stage Architecture

### Frontend Multi-Stage Build

The frontend Dockerfile now supports multiple build targets:

- **Development Stage**: Runs Vite dev server with hot reload
- **Production Stage**: Builds static files and serves with `serve`

### Backend Multi-Stage Build

The backend Dockerfile supports:

- **Development Stage**: Full npm install with development dependencies and nodemon
- **Production Stage**: Production-only dependencies with optimized build

### Docker Compose Profiles

The system uses Docker Compose profiles for environment separation:

- **`dev` Profile**: Development environment with MongoDB, hot reload, and development tools
- **`prod` Profile**: Production environment without MongoDB, optimized builds

## 📚 Docker Commands Reference

### Development Commands

```bash
# Start development environment
docker compose --profile dev up

# Start development environment with build
docker compose --profile dev up --build

# Start development environment in background
docker compose --profile dev up -d

# View development logs
docker compose --profile dev logs -f

# Stop development environment
docker compose --profile dev down

# Stop and remove volumes (reset database)
docker compose --profile dev down -v
```

### Production Commands

```bash
# Start production environment
docker compose --profile prod up

# Start production environment with build
docker compose --profile prod up --build

# Start production environment in background
docker compose --profile prod up -d

# View production logs
docker compose --profile prod logs -f

# Stop production environment
docker compose --profile prod down
```

### Service-Specific Commands

```bash
# View logs from specific service
docker compose logs -f frontend-dev    # Development frontend
docker compose logs -f backend-dev     # Development backend
docker compose logs -f frontend        # Production frontend
docker compose logs -f backend         # Production backend
docker compose logs -f mongo           # MongoDB (dev only)

# Restart specific service
docker compose restart backend-dev
docker compose restart frontend

# Rebuild specific service
docker compose build --no-cache backend-dev
```

### Utility Commands

```bash
# Check running containers
docker compose ps

# Execute commands in running containers
docker compose exec backend-dev sh
docker compose exec mongo mongosh

# Scale services (if needed)
docker compose --profile dev up --scale backend-dev=2

# Clean up unused images and containers
docker system prune -a
```

## 📁 Project Structure

```
log-management-system/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── landing/      # Login/Signup components
│   │   │   └── protected/    # Authenticated components
│   │   │       ├── LogsDisplay.tsx
│   │   │       ├── LogsList.tsx
│   │   │       ├── FileUpload.tsx
│   │   │       ├── SearchEngine.tsx
│   │   │       └── CreateLogForm.tsx
│   │   ├── types/
│   │   ├── contexts/
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   ├── Dockerfile            # Multi-stage build (dev/prod)
│   └── README.md
├── backendAtNode/           # Node.js backend API
│   ├── routes/
│   │   ├── auth.js
│   │   ├── logs.js          
│   │   └── users.js
│   ├── models/
│   ├── middleware/
│   ├── utils/
│   ├── package.json
│   ├── Dockerfile           # Multi-stage build (dev/prod)
│   └── README.md
├── docker-compose.yml       # Multi-profile orchestration
└── README.md               # This file
```

## 🔧 Environment Variables Reference

### Frontend Environment Variables

Create `frontend/.env`:
```bash
# Frontend Configuration
VITE_API_URL=http://localhost:8000
```

For production:
```bash
VITE_API_URL=https://your-api-domain.com
```

### Backend Environment Variables

Create `backendAtNode/.env`:
```bash
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration (Development)
MONGODB_URI=mongodb://mongo:27017/logs_db

# Database Configuration (Production)
# MONGODB_URI=mongodb://your-production-mongo-host:27017/logs_db

# JWT Configuration
JWT_SECRET=your-super-secure-256-bit-secret-key-change-this-in-production
JWT_EXPIRE_MINUTES=60

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://frontend:5173
```

## 🚦 Environment-Specific Setup

### Development Environment

**Features:**
- Hot reload for both frontend and backend
- Local MongoDB instance
- Development dependencies included
- Source code mounting for live changes
- Debug logging enabled

**Setup:**
```bash
# Create environment files
echo "VITE_API_URL=http://localhost:8000" > frontend/.env
cat > backendAtNode/.env << 'EOF'
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb://mongo:27017/logs_db
JWT_SECRET=your-development-secret-key
JWT_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=http://localhost:5173,http://frontend:5173
EOF

# Start development environment
docker compose --profile dev up --build
```

### Production Environment

**Features:**
- Optimized builds with minimal dependencies
- Static file serving for frontend
- External MongoDB connection
- Production logging
- Security optimizations

**Setup:**
```bash
# Create production environment files
echo "VITE_API_URL=https://your-api-domain.com" > frontend/.env
cat > backendAtNode/.env << 'EOF'
PORT=8000
NODE_ENV=production
MONGODB_URI=mongodb://your-production-mongo-host:27017/logs_db
JWT_SECRET=your-production-256-bit-secret-key-very-secure
JWT_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=https://your-frontend-domain.com
EOF

# Start production environment
docker compose --profile prod up --build -d
```

## 🔒 Security Features

### Authentication & Authorization
- JWT tokens with configurable expiration
- Role-based access control (Manager/Viewer)
- Secure password hashing with bcrypt
- Protected routes and API endpoints
- Manager-only log creation permissions

### Network Security
- Internal Docker network isolation
- CORS configuration with environment-based origins
- Environment variable security
- No exposed credentials in code
- Production-optimized security headers

### Data Security
- Organization-based data isolation
- Input validation and sanitization
- SQL injection prevention
- XSS protection headers

## 📈 Performance Optimizations

### Development Optimizations
- Hot reload for rapid development
- Source map support for debugging
- Development-specific logging
- Unoptimized builds for faster compilation

### Production Optimizations
- Minified and optimized builds
- Production-only dependencies
- Static file serving with caching
- Optimized Docker layers
- Resource limits and health checks

### Database Optimizations (Development)
- Local MongoDB with persistent volumes
- Development-friendly configuration
- Easy data reset capabilities

## 🆕 Recent Updates

### Docker Multi-Stage Architecture
- **Multi-Stage Dockerfiles**: Separate development and production builds
- **Profile-Based Deployment**: Use `--profile dev` or `--profile prod`
- **Optimized Builds**: Production builds exclude development dependencies
- **Hot Reload Support**: Development environment supports live code changes

### Environment Separation
- **Development Profile**: Includes MongoDB, development tools, hot reload
- **Production Profile**: Optimized builds, external database, production settings
- **Flexible Configuration**: Easy switching between environments

### Enhanced CORS Configuration
- **Environment-Based Origins**: CORS origins configured via environment variables
- **Multi-Origin Support**: Support for multiple allowed origins
- **Development/Production Separation**: Different CORS settings per environment

### Improved Documentation
- **Comprehensive Docker Commands**: Complete reference for all Docker operations
- **Environment-Specific Guides**: Separate setup instructions for dev/prod
- **Troubleshooting Sections**: Enhanced debugging information

## 🛠️ Troubleshooting

### Common Issues

1. **Port Conflicts**:
   ```bash
   # Check if ports are in use
   lsof -i :5173 -i :8000 -i :27017
   
   # Stop conflicting services
   docker compose --profile dev down
   docker compose --profile prod down
   ```

2. **Environment Variable Issues**:
   ```bash
   # Check if .env files exist
   ls -la frontend/.env backendAtNode/.env
   
   # Rebuild with environment variables
   docker compose --profile dev up --build
   ```

3. **Database Connection Issues (Development)**:
   ```bash
   # Check MongoDB logs
   docker compose logs mongo
   
   # Restart MongoDB
   docker compose restart mongo
   
   # Reset database
   docker compose --profile dev down -v
   docker compose --profile dev up
   ```

4. **Build Issues**:
   ```bash
   # Clean rebuild
   docker compose build --no-cache
   
   # Remove all containers and rebuild
   docker compose down
   docker system prune -a
   docker compose --profile dev up --build
   ```

5. **Production Database Connection**:
   - Ensure `MONGODB_URI` points to your production database
   - Verify network connectivity to external MongoDB
   - Check authentication credentials

### Health Checks

```bash
# Check all services status
docker compose ps

# Test backend API
curl http://localhost:8000/health

# Test frontend
curl http://localhost:5173

# Test MongoDB connection (development only)
docker compose exec mongo mongosh --eval "db.adminCommand('ping')"
```

## 🎯 Usage Examples

### Development Workflow

```bash
# Start development environment
docker compose --profile dev up -d

# Make code changes (automatically reloaded)
# View logs
docker compose logs -f backend-dev

# Reset database if needed
docker compose --profile dev down -v
docker compose --profile dev up -d
```

### Production Deployment

```bash
# Build and deploy production
docker compose --profile prod up --build -d

# Monitor production logs
docker compose logs -f

# Update production deployment
docker compose pull
docker compose --profile prod up --build -d
```

### Switching Between Environments

```bash
# Stop current environment
docker compose down

# Switch to development
docker compose --profile dev up -d

# Switch to production
docker compose --profile prod up -d
```

## 🚀 Features

### Frontend Features
- Modern React 18 with TypeScript
- Role-based authentication (Manager/Viewer)
- Advanced log search and filtering
- Real-time log display with pagination
- File upload for log ingestion
- Manual log creation form (Manager only)
- Environment variable configuration with VITE_API_URL
- Responsive design with Tailwind CSS
- Hot reload in development, optimized builds in production

### Backend Features
- RESTful API with Express.js
- JWT-based authentication with CORS support
- Role-based access control
- Advanced log filtering and search
- File upload processing with intelligent parsing
- Manual log creation endpoint (`POST /logs/ingest`)
- Flattened metadata storage for better performance
- MongoDB integration with Mongoose
- Development and production optimizations

### Database Features
- MongoDB 7 for development environment
- External MongoDB support for production
- Persistent data storage with Docker volumes
- Efficient indexing for log queries
- Organization-based data isolation
- Flattened metadata structure for better querying

This updated architecture provides a robust, scalable solution that supports both rapid development and production deployment with optimized performance and security.





