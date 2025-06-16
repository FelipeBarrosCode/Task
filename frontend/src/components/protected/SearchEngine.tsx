import React, { useEffect, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { LogFormat } from '../../types/enums';

interface SearchParams {
  level?: string;
  format?: LogFormat;
  tag?: string[];
  start_date?: string;
  end_date?: string;
  search?: string;
  limit: number;
  offset: number;
}

interface SearchEngineProps {
  searchParams: SearchParams;
  setSearchParams: (params: SearchParams) => void;
}

const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'critical'];
const ITEMS_PER_PAGE = [10, 25, 50, 100];
const LOG_FORMATS = Object.values(LogFormat);

export const SearchEngine: React.FC<SearchEngineProps> = ({ searchParams, setSearchParams }) => {
  const [searchValue, setSearchValue] = React.useState(searchParams.search || '');
  const [levelValue, setLevelValue] = React.useState(searchParams.level || '');
  const [formatValue, setFormatValue] = React.useState<LogFormat | ''>(searchParams.format || '');
  const [tagInput, setTagInput] = React.useState('');
  
  // Timeout refs for debouncing
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const formatTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dateTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleParamChange = (param: keyof SearchParams, value: string | number | string[] | undefined) => {
    const newParams = { 
      ...searchParams,
      [param]: value,
      // Reset offset to 0 when any parameter changes except limit
      offset: param === 'limit' ? searchParams.offset : 0
    };
    setSearchParams(newParams);
  };

  // Debounced handlers
  const debouncedSearchChange = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      handleParamChange('search', value || undefined);
    }, 500);
  }, [searchParams]);

  const debouncedFormatChange = useCallback((value: LogFormat | '') => {
    handleParamChange('format', value);
  }, [searchParams]);

  const debouncedLevelChange = useCallback((value: string) => {
    if (levelTimeoutRef.current) {
      clearTimeout(levelTimeoutRef.current);
    }
    levelTimeoutRef.current = setTimeout(() => {
      handleParamChange('level', value || undefined);
    }, 300);
  }, [searchParams]);

  const debouncedDateChange = useCallback((param: 'start_date' | 'end_date', value: string | undefined) => {
    if (dateTimeoutRef.current) {
      clearTimeout(dateTimeoutRef.current);
    }
    dateTimeoutRef.current = setTimeout(() => {
      handleParamChange(param, value);
    }, 500);
  }, [searchParams]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (formatTimeoutRef.current) clearTimeout(formatTimeoutRef.current);
      if (levelTimeoutRef.current) clearTimeout(levelTimeoutRef.current);
      if (dateTimeoutRef.current) clearTimeout(dateTimeoutRef.current);
    };
  }, []);

  const handleTagAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagInput.trim()) {
      const currentTags = searchParams.tag || [];
      if (!currentTags.includes(tagInput.trim())) {
        const newTags = [...currentTags, tagInput.trim()];
        handleParamChange('tag', newTags);
      }
      setTagInput('');
    }
  };

  const handleTagDelete = (tagToDelete: string) => {
    const newTags = (searchParams.tag || []).filter(tag => tag !== tagToDelete);
    handleParamChange('tag', newTags.length ? newTags : undefined);
  };

  const handleClearSearch = () => {
    // Clear local state
    setSearchValue('');
    setLevelValue('');
    setFormatValue('');
    setTagInput('');
    
    // Clear all timeouts
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (formatTimeoutRef.current) clearTimeout(formatTimeoutRef.current);
    if (levelTimeoutRef.current) clearTimeout(levelTimeoutRef.current);
    if (dateTimeoutRef.current) clearTimeout(dateTimeoutRef.current);
    
    // Reset search params
    setSearchParams({
      limit: 10,
      offset: 0,
    });
  };

  const inputClass = " cursor-pointer w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm";
  const labelClass = "  block text-sm font-medium text-gray-700 mb-1";
  const selectClass = " cursor-pointer w-full px-3 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white";

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => e.preventDefault()}>
        {/* Search Bar - Full Width */}
        <div className="mb-6">
          <label className={labelClass}>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Logs
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search messages, services, or any log content..."
              value={searchValue}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setSearchValue(e.target.value);
                debouncedSearchChange(e.target.value);
              }}
              className={`${inputClass} pl-10`}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Log Level */}
          <div>
            <label className={labelClass}>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-1.414.586H7a4 4 0 01-4-4V7a4 4 0 014-4z" />
                </svg>
                Log Level
              </span>
            </label>
            <select
              value={levelValue}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                setLevelValue(e.target.value);
                debouncedLevelChange(e.target.value);
              }}
              className={selectClass}
            >
              <option value="">All Levels</option>
              {LOG_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Log Format */}
          <div>
            <label className={labelClass}>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Log Format
              </span>
            </label>
            <select
              value={formatValue}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const value = e.target.value as LogFormat | '';
                setFormatValue(value);
                debouncedFormatChange(value);
              }}
              className={selectClass}
            >
              <option value="">All Formats</option>
              {LOG_FORMATS.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className={labelClass}>
              <span className="flex items-center mb-1">
                <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Start Date
              </span>
            </label>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                value={searchParams.start_date ? dayjs(searchParams.start_date) : null}
                onChange={(newValue) => {
                  debouncedDateChange('start_date', newValue ? newValue.toISOString() : undefined);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    className: inputClass,
                    placeholder: "Select date and time"
                  }
                }}
                views={['year', 'month', 'day', 'hours', 'minutes']}
              />
            </LocalizationProvider>
          </div>

          {/* End Date */}
          <div>
            <label className={labelClass}>
              <span className="flex items-center mb-1">
                <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                End Date
              </span>
            </label>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                value={searchParams.end_date ? dayjs(searchParams.end_date) : null}
                onChange={(newValue) => {
                  debouncedDateChange('end_date', newValue ? newValue.toISOString() : undefined);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    className: inputClass,
                    placeholder: "Select date and time"
                  }
                }}
                views={['year', 'month', 'day', 'hours', 'minutes']}
              />
            </LocalizationProvider>
          </div>
        </div>

        {/* Tags Section */}
        <div className="mb-6">
          <label className={labelClass}>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-1.414.586H7a4 4 0 01-4-4V7a4 4 0 014-4z" />
              </svg>
              Add Tag (Key or Value)
            </span>
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Add a tag to filter..."
              value={tagInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTagAdd(e);
                }
              }}
              className={`${inputClass} flex-1`}
            />
            <button 
              type="button" 
              onClick={handleTagAdd}
              disabled={!tagInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm"
            >
              <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add
            </button>
          </div>
          
          {/* Active Tags */}
          {searchParams.tag && searchParams.tag.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {searchParams.tag.map((tag) => (
                <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-1.414.586H7a4 4 0 01-4-4V7a4 4 0 014-4z" />
                  </svg>
                  {tag}
                  <button 
                    onClick={() => handleTagDelete(tag)}
                    className="ml-2 inline-flex items-center justify-center w-5 h-5 text-red-600 hover:text-white hover:bg-red-600 bg-red-50 rounded-full transition-colors duration-150"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#dc2626">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 pt-4 border-t border-gray-200">
          {/* Items per page */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Items per page:</label>
            <select
              value={searchParams.limit}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleParamChange('limit', Number(e.target.value))}
              className="px-3 py-1.5 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
            >
              {ITEMS_PER_PAGE.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button 
              type="button" 
              onClick={handleClearSearch}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150 shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="#dc2626">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All
            </button>
            
            
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchEngine;
