import React, { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Role, LogLevel, LogFormat } from '../../../types/enums';
import { jwtDecode } from "jwt-decode";

interface MetaItem {
  key: string;
  value: string;
}

interface Log {
  _id: string;
  timestamp: string;
  level:  LogLevel;
  service: string;
  message: string;
  format:  LogFormat;
  original_level: string;
  meta?: MetaItem[];
}

interface CustomJwtPayload {
  sub: string;
  role: Role;
  exp: number;
}

const GeneralDisplay: React.FC = () => {
  const { logId } = useParams();
  const [log, setLog] = useState<Log | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Log>>({});
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  // Parse JWT token and get user role
  const getUserRoleFromToken = (): Role | null => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = jwtDecode<CustomJwtPayload>(token);
      
      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        navigate('/login');
        return null;
      }

      return payload.role;
    } catch (err) {
      console.error('Error parsing JWT token:', err);
      return null;
    }
  };

  // Load log data and user role when component mounts
  useEffect(() => {
    const role = getUserRoleFromToken();
    setUserRole(role);
    console.log("This is the search params", logId);
    
    const fetchLogData = async () => {
      if (!logId) {
        setError('No log ID provided');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await axios.get<{ meta: Record<string, string> } & Omit<Log, 'meta'>>(
          `${apiUrl}/logs/${logId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        console.log(response.data);
        const formattedResponse = {
          ...response.data,
          meta: Object.entries(response.data.meta || {}).map(([key, value]) => ({ key, value }))
        };
        setLog(formattedResponse as Log);
        setEditForm(formattedResponse as Log);
        setError(null);

      } catch (err) {
        console.error('Error fetching log:', err);
        const axiosError = err as AxiosError;
        const status = axiosError.response?.status;

        if (status === 404) {
          setError('Log not found.');
        } else if (status === 401 || status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
        } else if (status && status >= 400) {
          setError('Failed to fetch log data. Please try again.');
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLogData();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: keyof Log, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save changes to backend
  const saveChanges = async () => {
    if (userRole === Role.VIEWER) {
      setError('You do not have permission to edit logs.');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Convert meta array back to object for API
      const metaObject = editForm.meta?.reduce<Record<string, string>>((acc, { key, value }) => {
        if (key) acc[key] = value;
        return acc;
      }, {});
      const apiUrl = import.meta.env.VITE_API_URL;
      await axios.patch(
        `${apiUrl}/logs/${logId}`,
        {
          ...editForm,
          meta: metaObject
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setLog(prev => ({
        ...prev!,
        ...editForm
      }));

      setIsEditing(false);
      console.log('Log updated successfully');
    } catch (err) {
      console.error('Error updating log:', err);
      const axiosError = err as AxiosError;
      const status = axiosError.response?.status;

      if (status && status >= 400) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to update log. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditForm(log || {});
    setIsEditing(false);
  };

  // Delete log
  const handleDelete = async () => {
    if (userRole === Role.VIEWER) {
      setError('You do not have permission to delete logs.');
      return;
    }

    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL;
      await axios.delete(
        `${apiUrl}/logs/${logId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting log:', err);
      const axiosError = err as AxiosError;
      const status = axiosError.response?.status;

      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to delete log. Please try again.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Log Details</h3>
            <p className="text-gray-500 text-center">Please wait while we fetch the log information...</p>
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
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Log</h3>
            <p className="text-red-700 text-center mb-4">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 shadow-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 border border-yellow-200">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Log Data Found</h3>
            <p className="text-yellow-700 text-center mb-4">The requested log entry could not be found.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 shadow-sm"
            >
              Back to Dashboard
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
                <h1 className="text-2xl font-bold text-gray-900">Log Details</h1>
                <p className="text-sm text-gray-500">View and manage individual log entry</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-white bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Logs
              </button>
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-red-500 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150 shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-screen mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Main Log Details */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Log Information
                </h2>
                {userRole === Role.MANAGER && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 shadow-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Log
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150 shadow-sm disabled:bg-red-400 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {deleting ? 'Deleting...' : 'Delete Log'}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Log ID
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border">
                    {log._id}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timestamp
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level
                  </label>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    log.level === 'error' ? 'bg-red-100 text-red-800' :
                    log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                    log.level === 'info' ? 'bg-blue-100 text-blue-800' :
                    log.level === 'debug' ? 'bg-gray-100 text-gray-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {log.level.toUpperCase()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border">
                    {log.service}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border">
                    {log.format}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Level
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border">
                    {log.original_level}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <div className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg border min-h-[80px] whitespace-pre-wrap">
                  {log.message}
                </div>
              </div>

              {log.meta && log.meta.length > 0 && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metadata
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <pre className="text-xs text-gray-900 overflow-x-auto">
                      { "{\n\n" + log.meta.map(item => `${item.key}: ${item.value},`).join('\n\n') + "\n\n}"} 
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel for Editing */}
          {isEditing && userRole === Role.MANAGER && (
            <div className="w-96">
              <div className="bg-white rounded-xl w-max shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Log
                  </h2>
                  <button
                    onClick={cancelEdit}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Level
                    </label>
                    <select
                      value={editForm.level || ''}
                      onChange={(e) => handleInputChange('level', e.target.value as LogLevel)}
                      className="w-full text-black border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {Object.values(LogLevel).map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service
                    </label>
                    <input
                      type="text"
                      value={editForm.service || ''}
                      onChange={(e) => handleInputChange('service', e.target.value)}
                      className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={editForm.message || ''}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      rows={4}
                      className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format
                    </label>
                    <select
                      value={editForm.format || ''}
                      onChange={(e) => handleInputChange('format', e.target.value as LogFormat)}
                      className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {Object.values(LogFormat).map(format => (
                        <option key={format} value={format}>{format}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Level
                    </label>
                    <input
                      type="text"
                      value={editForm.original_level || ''}
                      onChange={(e) => handleInputChange('original_level', e.target.value)}
                      className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Metadata
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setEditForm(prev => ({
                            ...prev,
                            meta: [...(prev.meta || []), { key: '', value: '' }]
                          }));
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-150"
                      >
                        + Add Field
                      </button>
                    </div>
                    <div className="space-y-3 w-max">
                      {editForm.meta && editForm.meta.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Key"
                            value={item.key}
                            onChange={(e) => {
                              const newMeta = [...(editForm.meta || [])];
                              newMeta[index] = { ...item, key: e.target.value };
                              setEditForm(prev => ({ ...prev, meta: newMeta }));
                            }}
                            className="flex-1 border text-black border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={item.value}
                            onChange={(e) => {
                              const newMeta = [...(editForm.meta || [])];
                              newMeta[index] = { ...item, value: e.target.value };
                              setEditForm(prev => ({ ...prev, meta: newMeta }));
                            }}
                            className="flex-1 border text-black border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newMeta = [...(editForm.meta || [])];
                              newMeta.splice(index, 1);
                              setEditForm(prev => ({ ...prev, meta: newMeta }));
                            }}
                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-red-600 hover:text-white hover:bg-red-600 border border-red-300 hover:border-red-600 rounded transition-colors duration-150 text-sm font-medium"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <button
                      type="button"
                      onClick={saveChanges}
                      disabled={saving}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="w-full bg-gray-300 text-red-500 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-150 shadow-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneralDisplay;
