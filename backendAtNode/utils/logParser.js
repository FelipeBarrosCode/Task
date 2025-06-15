const moment = require('moment');
const { LogFormat } = require('../enums');

const isJsonLines = (line) => {
  try {
    JSON.parse(line.trim());
    return true;
  } catch (error) {
    return false;
  }
};

const isSyslog = (line) => {
  const syslogPattern = /^[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\S+\s+[^:\[]+(?:\[\d+\])?:\s+.*/;
  return syslogPattern.test(line);
};

const isNginxError = (line) => {
  const nginxPattern = /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} \[[^\]]+\] \d+#\d+: (?:\*\d+ )?.*/;
  return nginxPattern.test(line);
};

const isClf = (line) => {
  const clfPattern = /^\S+ \S+ \S+ \[[\w:/]+\s[+\-]\d{4}\] "[^"]*" \d{3} \d+$/;
  return clfPattern.test(line);
};

const parseJsonLines = (line) => {
  const data = JSON.parse(line);
  
  // Extract timestamp and convert to UTC
  const timestampField = data.timestamp || data.time || data['@timestamp'];
  let timestamp = moment(timestampField);
  if (!timestamp.isValid()) {
    timestamp = moment();
  }
  
  // Extract level
  const level = (data.level || data.severity || 'info').toLowerCase();
  
  // Extract service
  const service = data.service || data.application || data.app || 'unknown';
  
  // Extract message
  const message = data.message || data.msg || '';
  
  // Everything else goes to meta
  const meta = { ...data };
  delete meta.timestamp;
  delete meta.time;
  delete meta['@timestamp'];
  delete meta.level;
  delete meta.severity;
  delete meta.service;
  delete meta.application;
  delete meta.app;
  delete meta.message;
  delete meta.msg;
  
  return {
    timestamp: timestamp.toISOString(),
    level: level,
    service: service,
    message: message,
    meta: Object.keys(meta).length > 0 ? meta : null,
    format: LogFormat.JSON_LINES
  };
};

const parseSyslog = (line) => {
  // Example: Mar 15 12:34:56 myhost sshd[12345]: Failed password for user from 192.168.1.1 port 22 ssh2
  const syslogPattern = /^([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+([^:\[]+)(?:\[(\d+)\])?:\s+(.*)$/;
  const match = line.match(syslogPattern);
  
  if (!match) {
    throw new Error("Invalid syslog format");
  }
  
  const [, timestampStr, host, service, pid, message] = match;
  
  // Convert timestamp to UTC (assume current year if not provided)
  const currentYear = new Date().getFullYear();
  const timestamp = moment(`${timestampStr} ${currentYear}`, 'MMM D HH:mm:ss YYYY');
  
  // Extract level from message (if present)
  const levelMatch = message.match(/^(debug|info|notice|warning|warn|error|err|crit|alert|emerg):/i);
  const level = levelMatch ? levelMatch[1].toLowerCase() : 'info';
  
  // Clean up service name (remove pid if present in service name)
  const cleanService = service.split('[')[0].trim();
  
  const meta = {
    host: host,
    pid: pid || null
  };
  
  return {
    timestamp: timestamp.toISOString(),
    level: level,
    service: cleanService,
    message: message,
    meta: meta,
    format: LogFormat.SYSLOG
  };
};

const parseNginxError = (line) => {
  // Example: 2024/03/15 12:34:56 [error] 12345#12345: *1234 Something went wrong, client: 192.168.1.1
  const nginxPattern = /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}) \[([^\]]+)\] (\d+)#(\d+): (?:\*(\d+) )?(.*)$/;
  const match = line.match(nginxPattern);
  
  if (!match) {
    throw new Error("Invalid nginx error format");
  }
  
  const [, timestampStr, level, pid, tid, connectionId, message] = match;
  
  // Convert timestamp to UTC
  const timestamp = moment(timestampStr, 'YYYY/MM/DD HH:mm:ss');
  
  const meta = {
    pid: pid,
    thread_id: tid,
    connection_id: connectionId || null
  };
  
  // Extract client IP if present
  const clientMatch = message.match(/client: (\d+\.\d+\.\d+\.\d+)/);
  if (clientMatch) {
    meta.client_ip = clientMatch[1];
  }
  
  return {
    timestamp: timestamp.toISOString(),
    level: level.toLowerCase(),
    service: 'nginx',
    message: message,
    meta: meta,
    format: LogFormat.NGINX_ERROR
  };
};

const parseClf = (line) => {
  // Example: 127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326
  const clfPattern = /^(\S+) (\S+) (\S+) \[([\w:/]+\s[+\-]\d{4})\] "([^"]*)" (\d{3}) (\d+)$/;
  const match = line.match(clfPattern);
  
  if (!match) {
    throw new Error("Invalid CLF format");
  }
  
  const [, ip, ident, user, timestampStr, request, status, size] = match;
  
  // Parse timestamp
  const timestamp = moment(timestampStr.replace(':', ' ', 1), 'DD/MMM/YYYY HH:mm:ss ZZ');
  
  // Determine level based on status code
  const statusCode = parseInt(status);
  let level;
  if (statusCode >= 500) {
    level = "error";
  } else if (statusCode >= 400) {
    level = "warn";
  } else {
    level = "info";
  }
  
  // Parse request
  const requestParts = request.split(' ');
  const method = requestParts[0] || '';
  const path = requestParts[1] || '';
  const protocol = requestParts[2] || '';
  
  const meta = {
    ip: ip,
    ident: ident !== '-' ? ident : null,
    user: user !== '-' ? user : null,
    status: statusCode,
    size: parseInt(size),
    method: method,
    path: path,
    protocol: protocol
  };
  
  return {
    timestamp: timestamp.toISOString(),
    level: level,
    service: 'http',
    message: `${method} ${path} ${statusCode}`,
    meta: meta,
    format: LogFormat.CLF
  };
};

const detectLogFormatAndParse = (line) => {
  try {
    if (isJsonLines(line)) {
      return parseJsonLines(line);
    } else if (isSyslog(line)) {
      return parseSyslog(line);
    } else if (isNginxError(line)) {
      return parseNginxError(line);
    } else if (isClf(line)) {
      return parseClf(line);
    } else {
      throw new Error("Unknown log format");
    }
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      level: 'error',
      service: 'parser',
      message: `Failed to parse log line: ${error.message}`,
      meta: { original_line: line },
      format: LogFormat.JSON_LINES
    };
  }
};

module.exports = {
  isJsonLines,
  isSyslog,
  isNginxError,
  isClf,
  parseJsonLines,
  parseSyslog,
  parseNginxError,
  parseClf,
  detectLogFormatAndParse
}; 