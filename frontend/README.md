# Frontend - Log Management System

A modern React-based frontend application for managing and viewing log entries with advanced search capabilities, built with TypeScript and Tailwind CSS.

## 🚀 Features

- **Authentication System**: Secure login/signup with JWT tokens
- **Role-Based Access Control**: Different permissions for managers and viewers
- **Advanced Log Search**: Filter by level, service, date range, and custom tags
- **Real-time Log Display**: View logs with pagination and sorting
- **Log Management**: Edit, delete, and view detailed log information (manager only)
- **File Upload**: Upload log files in various formats (.log, .txt, .json, .jsonl)
- **Manual Log Creation**: Create individual log entries with comprehensive form (manager only)
- **Environment Configuration**: Flexible API URL configuration with VITE_API_URL
- **Responsive Design**: Modern UI with gradient backgrounds and smooth animations
- **Lazy Loading**: Optimized performance with React.lazy()

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **React Router** for navigation
- **Axios** for API communication
- **Tailwind CSS** for styling
- **Material-UI (MUI)** for advanced components
- **Day.js** for date handling
- **Vite** for build tooling

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── landing/           # Login/Signup components
│   │   │   ├── Login.tsx
│   │   │   └── Signup.tsx
│   │   ├── protected/         # Authenticated user components
│   │   │   ├── LogsDisplay.tsx      # Main dashboard
│   │   │   ├── LogsList.tsx         # Log list with pagination
│   │   │   ├── FileUpload.tsx       # File upload modal
│   │   │   ├── SearchEngine.tsx     # Advanced search filters
│   │   │   ├── CreateLogForm.tsx    # Manual log creation form (NEW)
│   │   │   └── SpecificLog/
│   │   │       └── GeneralDisplay.tsx  # Individual log view
│   │   ├── LazyComponents.tsx # Lazy-loaded component exports
│   │   └── SearchEngine.tsx   # Shared search component
│   ├── types/
│   │   ├── index.ts          # Type definitions
│   │   └── enums.ts          # Enum definitions
│   ├── contexts/
│   │   └── LogsContext.tsx   # Log management context
│   ├── App.tsx               # Main app component with routing
│   └── main.tsx              # App entry point
├── lib/
│   └── ProtectedRoute.tsx    # Route protection component
├── public/                   # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── Dockerfile
```

## 🔧 Installation & Setup

### Prerequisites

- Node.js 18+ and npm (for local development)
- Docker and Docker Compose (for containerized development)
- Backend API running on configured port (default: 8000)

### Docker Development (Recommended)

#### Development Environment
```bash
# Start development environment with hot reload
docker compose --profile dev up --build

# View frontend logs
docker compose logs -f frontend-dev

# Access the application at http://localhost:5173
```

#### Production Environment
```bash
# Start production environment with optimized build
docker compose --profile prod up --build

# View frontend logs
docker compose logs -f frontend

# Access the application at http://localhost:5173
```

### Environment Configuration

Create a `.env` file in the frontend directory:

```bash
# API Configuration
VITE_API_URL=http://localhost:8000
```

For production:
```bash
VITE_API_URL=https://your-api-domain.com
```

### Local Development (Manual Setup)

1. **Clone and navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   echo "VITE_API_URL=http://localhost:8000" > .env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open http://localhost:5173
   - Default login credentials depend on your backend setup

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

### Docker Multi-Stage Build

The frontend Dockerfile supports multiple build targets:

- **Development Stage**: 
  - Runs Vite dev server with hot reload
  - Includes all development dependencies
  - Source code mounted for live changes
  - Optimized for rapid development

- **Production Stage**: 
  - Builds optimized static files
  - Serves with lightweight `serve` package
  - Minimal container size
  - Production-ready performance

## 🔐 Authentication & Authorization

### User Roles

- **Manager**: Full access - can view, edit, delete logs, upload files, and create logs manually
- **Viewer**: Read-only access - can only view logs and search

### Authentication Flow

1. User logs in with credentials
2. Backend returns JWT token
3. Token stored in localStorage
4. Token included in all API requests via Authorization header
5. Protected routes check token validity
6. Automatic redirect to login if token expired

## 🆕 Manual Log Creation (Manager Only)

### CreateLogForm Component

A comprehensive form for creating individual log entries:

**Features:**
- **Log Level Selection**: Choose from debug, info, warn, error, critical
- **Service Input**: Specify the service generating the log
- **Message Input**: Multi-line text area for log messages
- **Format Selection**: Choose log format (JSON Lines, Syslog, etc.)
- **Metadata Input**: JSON editor for additional metadata
- **Real-time Validation**: Form validation with error feedback
- **Loading States**: Visual feedback during submission

**Usage:**
1. Manager clicks "Create Log" button in dashboard
2. Modal opens with comprehensive form
3. Fill required fields (service, message) and optional metadata
4. Submit to create log entry
5. Form resets and closes on success

**API Integration:**
- Uses `VITE_API_URL` environment variable
- Sends POST request to `/logs/ingest` endpoint
- Includes JWT token for authentication
- Handles validation errors and success responses

## 🔍 Search & Filtering

The application provides comprehensive search capabilities:

### Search Parameters

- **Text Search**: Search in messages, services, and metadata
- **Log Level**: Filter by debug, info, warn, error, critical
- **Service**: Filter by specific service names
- **Date Range**: Start and end date/time filtering
- **Tags**: Search in metadata keys and values
- **Pagination**: Configurable page size (10, 25, 50, 100)

### Advanced Features

- **Debounced Search**: Optimized performance with 300-500ms delays
- **Real-time Filtering**: Results update as you type
- **Tag Management**: Add custom tags and remove existing ones
- **Persistent State**: Search parameters maintained across navigation

## 📊 Log Management

### Log Display Features

- **Color-coded Levels**: Visual distinction for different log levels
- **Metadata Visualization**: Structured display of flattened metadata
- **Timestamp Formatting**: Human-readable date/time display
- **Responsive Layout**: Optimized for desktop and mobile

### File Upload

Supports multiple log formats:
- `.log` - Standard log files
- `.txt` - Plain text logs
- `.json` - JSON formatted logs
- `.jsonl` - JSON Lines format

**Processing Features:**
- Automatic format detection
- Metadata flattening for consistent storage
- Progress feedback and statistics
- Error handling for invalid files

## 🎨 UI/UX Features

### Design System

- **Gradient Backgrounds**: Modern indigo-to-blue gradients
- **Consistent Colors**: Semantic color system for actions
  - Blue: Primary actions (login, edit, view)
  - Green: Success actions (save, upload, create)
  - Red: Destructive actions (delete, remove)
  - Gray: Secondary actions (cancel, logout)

### Interactive Elements

- **Loading States**: Spinners and skeleton screens
- **Error Handling**: User-friendly error messages
- **Success Feedback**: Confirmation messages for actions
- **Hover Effects**: Smooth transitions and visual feedback
- **Modal Dialogs**: Clean overlay interfaces for forms

## 🚀 Performance Optimizations

### Code Splitting

- **Lazy Loading**: Components loaded on-demand
- **Route-based Splitting**: Each page loads independently
- **Suspense Boundaries**: Graceful loading states

### API Optimizations

- **Environment-based URLs**: Flexible API endpoint configuration
- **Debounced Requests**: Reduced API calls during typing
- **Request Caching**: Efficient data fetching
- **Error Boundaries**: Graceful error handling

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API base URL | http://localhost:8000 | Yes |

### API Endpoints Used

- `POST /auth/login` - User authentication
- `POST /auth/signup` - User registration
- `GET /logs` - Fetch logs with filters
- `GET /logs/:id` - Get specific log
- `PATCH /logs/:id` - Update log (managers only)
- `DELETE /logs/:id` - Delete log (managers only)
- `POST /logs/upload` - Upload log files
- `POST /logs/ingest` - Create individual log entries (managers only)

### API Communication

All API requests include:
- **Base URL**: From `VITE_API_URL` environment variable
- **Authorization Header**: JWT token from localStorage
- **Content-Type**: Appropriate headers for request type
- **Error Handling**: Consistent error response processing

## 🆕 Recent Updates

### Environment Variable Integration
- **VITE_API_URL**: Centralized API URL configuration
- **Flexible Deployment**: Easy configuration for different environments
- **Docker Support**: Automatic environment setup in containers

### Manual Log Creation
- **CreateLogForm Component**: Comprehensive form for log creation
- **Manager Permissions**: Role-based access control
- **Validation**: Real-time form validation and error handling
- **Metadata Support**: JSON editor for structured metadata

### Enhanced User Experience
- **Loading States**: Better visual feedback during operations
- **Error Messages**: Improved error handling and user feedback
- **Responsive Design**: Optimized for various screen sizes
- **Accessibility**: Better keyboard navigation and screen reader support

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variable Issues**:
   ```bash
   # Check if VITE_API_URL is set
   echo $VITE_API_URL
   
   # Create .env file if missing
   echo "VITE_API_URL=http://localhost:8000" > .env
   ```

2. **Build Errors**: 
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **API Connection**: 
   - Verify backend is running on configured port
   - Check CORS configuration on backend
   - Verify JWT token in localStorage

4. **TypeScript Errors**: 
   ```bash
   # Run type checking
   npm run type-check
   
   # Build to check for errors
   npm run build
   ```

### Development Tips

- Use browser dev tools to inspect network requests
- Check console for error messages and warnings
- Verify JWT token expiration in Application tab
- Test API endpoints directly with curl or Postman
- Use React Developer Tools for component debugging

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality
- `npm run type-check` - Run TypeScript compiler check

## 🎯 Usage Examples

### Creating a Log Entry

```typescript
// Example of manual log creation
const createLog = async (logData: CreateLogData) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');
  
  await axios.post(`${apiUrl}/logs/ingest`, logData, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
};
```

### Environment Configuration

```typescript
// Using environment variable for API calls
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Example API call
const fetchLogs = async () => {
  const response = await axios.get(`${API_BASE_URL}/logs`);
  return response.data;
};
```

### Role-based Rendering

```typescript
// Conditional rendering based on user role
const Dashboard = () => {
  const userRole = getUserRole(); // Get from context or localStorage
  
  return (
    <div>
      {userRole === 'manager' && (
        <CreateLogForm 
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onLogCreated={handleLogCreated}
        />
      )}
    </div>
  );
};
```


