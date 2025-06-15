const Role = {
  VIEWER: 'viewer',
  MANAGER: 'manager'
};

const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  NOTICE: 'notice',
  WARN: 'warn',
  WARNING: 'warn', // Alias, for compatibility
  ERROR: 'error',
  ERR: 'error',    // Alias, for compatibility
  CRITICAL: 'critical',
  CRIT: 'critical', // Alias
  ALERT: 'alert',
  EMERGENCY: 'emergency',
  EMERG: 'emergency', // Alias
  FATAL: 'fatal'   // For some app-specific logs
};


const LogFormat = {
  JSON_LINES: 'json_lines',
  SYSLOG: 'syslog',
  NGINX_ERROR: 'nginx_error',
  CLF: 'clf'
};

module.exports = {
  Role,
  LogLevel,
  LogFormat
}; 