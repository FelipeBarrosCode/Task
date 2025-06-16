import React, { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import LogsList from './LogsList';
import FileUpload from './FileUpload';
import SearchEngine from './SearchEngine';
import { LogLevel, LogFormat, Role } from '../../types/enums';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  role: Role;
  sub: string;
  email: string;
  organizationId: string;
}

interface Log {
  _id: string;
  timestamp: string;
  level:  LogLevel;
  service: string;
  message: string;
  format: LogFormat;
  original_level: string;
  meta?: Record<string, string | number | boolean | null>;
}

interface LogsResponse {
  logs: Log[];
  pagination: {
    offset: number;
    limit: number;
    total_pages: number;
  }
}

interface SearchParams {
  level?: string;
  service?: string;
  tag?: string[];
  start_date?: string;
  end_date?: string;
  search?: string;
  limit: number;
  offset: number;
}

const LogsDisplay: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [logsData, setLogsData] = useState<LogsResponse>({
    logs: [],
    pagination: {
      offset: 0,
      limit: 10,
      total_pages: 0
    }
  });
  const [searchFilters, setSearchFilters] = useState<SearchParams>({
    limit: 10,
    offset: 0
  });
  const navigate = useNavigate();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const userRole = jwtDecode<JwtPayload>(token!);
      setUserRole(userRole.role);     
      console.log('Raw token from localStorage:', token);

      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      // Build query string from searchFilters
      const queryParams = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });

      const authHeader = `Bearer ${token}`;
      console.log('Authorization header:', authHeader);
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.get<LogsResponse>(
        `${apiUrl}/logs?${queryParams.toString()}`,
        {
          headers: {
            Authorization: authHeader
          }
        }
      );
      console.log('Response data:', response.data);

      // If we get an empty logs array and we're not on the first page,
      // reset to first page and fetch again
      if (response.data.logs.length === 0 && searchFilters.offset > 0) {
        setSearchFilters(prev => ({
          ...prev,
          offset: 0
        }));
        return; // This will trigger another fetch due to the useEffect
      }

      setLogsData({
        logs: response.data.logs,
        pagination: {
          offset: response.data.pagination.offset || 0,
          limit: response.data.pagination.limit || 10,
          total_pages: response.data.pagination.total_pages || 0
        }
      });
      setIsInitialLoad(false);
    } catch (err) {
      setError('Failed to fetch logs. Please try again later.');
      console.error('Error fetching logs:', err);

      const axiosError = err as AxiosError;
      if(axiosError.response?.status && axiosError.response?.status >= 401){
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchFilters]);

  const handlePageChange = (page: number) => {
    const newOffset = (page - 1) * searchFilters.limit;
    setSearchFilters(prev => ({
      ...prev,
      offset: newOffset
    }));
  };

  const handleUploadSuccess = () => {
    setUploadSuccess('File uploaded and processed successfully!');
    setTimeout(() => setUploadSuccess(null), 5000);
    fetchLogs();
  };

  const handleLogCreated = () => {
    fetchLogs();
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Only show full page loading on initial load when there are no logs yet
  if (loading && isInitialLoad && logsData.logs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Logs</h3>
            <p className="text-gray-500 text-center">Please wait while we fetch your system logs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 border border-red-200">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Logs</h3>
            <p className="text-red-700 text-center mb-4">{error}</p>
            <button
              onClick={()=>{
                navigate("/login");
                localStorage.removeItem('token');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 shadow-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-screen mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
                <p className="text-sm text-gray-500">Monitor and analyze your application logs</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {userRole === Role.MANAGER && <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150 shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Logs
              </button>}
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-red-500 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150 shadow-sm"
              >
                <svg className="w-4 h-4 mr-2 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {uploadSuccess && (
        <div className="w-screen mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{uploadSuccess}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setUploadSuccess(null)}
                    className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-screen  mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Search Engine */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search & Filter
            </h2>
      <SearchEngine 
        searchParams={searchFilters}
        setSearchParams={setSearchFilters}
      />
          </div>

          {/* Logs Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900">Log Entries</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {logsData.logs.length} entries
                </span>
              </div>
              
              <button
                onClick={fetchLogs}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 shadow-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
      </button>
            </div>

      <LogsList
        logs={logsData.logs}
        currentPage={Math.floor(searchFilters.offset / searchFilters.limit) + 1}
        totalPages={logsData.pagination.total_pages}
        onPageChange={handlePageChange}
              loading={loading}
        onLogCreated={handleLogCreated}
      />
          </div>
        </div>
      </div>

      {/* File Upload Modal */}
      <FileUpload
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
      />
    </div>
  );
};

export default LogsDisplay;
