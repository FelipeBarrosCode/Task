enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  CRITICAL = "critical"
}

enum LogFormat {
  JSON_LINES = "json_lines",
  SYSLOG = "syslog",
  NGINX_ERROR = "nginx_error",
  CLF = "clf"
}

enum Role {
  MANAGER = "manager",
  VIEWER = "viewer"
}

export {
  Role,
  LogFormat,
  LogLevel
}