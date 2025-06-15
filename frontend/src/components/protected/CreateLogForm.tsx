import React, { useState } from 'react';
import axios from 'axios';
import { LogLevel, LogFormat } from '../../types/enums';

interface CreateLogFormProps {
  isOpen: boolean;
  onClose: () => void;
  onLogCreated?: () => void;
  onError?: (error: string) => void;
}

interface CreateLogData {
  level: LogLevel;
  service: string;
  message: string;
  format: LogFormat;
  meta: Record<string, string>;
}

const CreateLogForm: React.FC<CreateLogFormProps> = ({ 
  isOpen, 
  onClose, 
  onLogCreated, 
  onError 
}) => {
  const [formData, setFormData] = useState<CreateLogData>({
    level: LogLevel.INFO,
    service: '',
    message: '',
    format: LogFormat.JSON_LINES,
    meta: {}
  });
  
  const [metaInput, setMetaInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMetaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMetaInput(e.target.value);
    try {
      if (e.target.value.trim() === '') {
        setFormData(prev => ({ ...prev, meta: {} }));
      } else {
        const parsedMeta = JSON.parse(e.target.value);
        setFormData(prev => ({ ...prev, meta: parsedMeta }));
      }
      setError('');
    } catch {
      setError('Invalid JSON format in metadata');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service.trim() || !formData.message.trim()) {
      setError('Service and message are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL;
      await axios.post(`${apiUrl}/logs/ingest`, formData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      // Reset form
      setFormData({
        level: LogLevel.INFO,
        service: '',
        message: '',
        format: LogFormat.JSON_LINES,
        meta: {}
      });
      setMetaInput('');
      
      onLogCreated?.();
      onClose();
    } catch (err) {
      let errorMessage = 'Failed to create log';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.detail || err.message;
      }
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      level: LogLevel.INFO,
      service: '',
      message: '',
      format: LogFormat.JSON_LINES,
      meta: {}
    });
    setMetaInput('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create New Log Entry</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Log Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Log Level
            </label>
            <select
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Object.values(LogLevel).map(level => (
                <option key={level} value={level}>
                  {level.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="service"
              value={formData.service}
              onChange={handleInputChange}
              placeholder="e.g., api, database, auth-service"
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Enter the log message..."
              rows={3}
              className="w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Log Format
            </label>
            <select
              name="format"
              value={formData.format}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Object.values(LogFormat).map(format => (
                <option key={format} value={format}>
                  {format.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Metadata */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metadata (JSON)
            </label>
            <textarea
              value={metaInput}
              onChange={handleMetaChange}
              placeholder='{"key": "value", "number": 123}'
              rows={4}
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Enter valid JSON for additional metadata
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-150
                ${loading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </div>
              ) : (
                'Create Log'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLogForm; 