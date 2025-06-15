import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import ProtectedRoute from '../lib/ProtectedRoute'
import { lazy } from 'react';

// Landing Components
export const Login = lazy(() => import('./components/landing/Login'));
export const Signup = lazy(() => import('./components/landing/Signup'));

// Protected Components
export const LogsDisplay = lazy(() => import('./components/protected/LogsDisplay'));
export const LogsList = lazy(() => import('./components/protected/LogsList'));
export const FileUpload = lazy(() => import('./components/protected/FileUpload'));
export const GeneralDisplay = lazy(() => import('./components/protected/SpecificLog/GeneralDisplay'));

// Shared Components
export const SearchEngine = lazy(() => import('./components/protected/SearchEngine')); 
export const CreateLogForm = lazy(() => import('./components/protected/CreateLogForm'));

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading...</h3>
        <p className="text-gray-500 text-center">Please wait while we load the content...</p>
      </div>
    </div>
  </div>
)

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<LogsDisplay />} />
            <Route path="/logs/:logId" element={<GeneralDisplay />} />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App 
