/**
 * Structured Logger Utility
 * 
 * Provides consistent logging across all modules
 * Formats logs for Firebase Functions Cloud Logging
 */

/**
 * Log levels
 */
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Base logger function
 * @param {string} level - Log level
 * @param {string} event - Event name/type
 * @param {Object} data - Additional data to log
 */
function log(level, event, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    event,
    ...data
  };

  // Use console methods that map to Cloud Logging severity levels
  switch (level) {
    case LOG_LEVELS.ERROR:
      console.error(JSON.stringify(logEntry));
      break;
    case LOG_LEVELS.WARN:
      console.warn(JSON.stringify(logEntry));
      break;
    case LOG_LEVELS.INFO:
      console.info(JSON.stringify(logEntry));
      break;
    case LOG_LEVELS.DEBUG:
      console.log(JSON.stringify(logEntry));
      break;
    default:
      console.log(JSON.stringify(logEntry));
  }
}

/**
 * Error logger
 * @param {string} event - Event name
 * @param {Object} data - Additional data
 */
function error(event, data = {}) {
  log(LOG_LEVELS.ERROR, event, data);
}

/**
 * Warning logger
 * @param {string} event - Event name
 * @param {Object} data - Additional data
 */
function warn(event, data = {}) {
  log(LOG_LEVELS.WARN, event, data);
}

/**
 * Info logger
 * @param {string} event - Event name
 * @param {Object} data - Additional data
 */
function info(event, data = {}) {
  log(LOG_LEVELS.INFO, event, data);
}

/**
 * Debug logger
 * @param {string} event - Event name
 * @param {Object} data - Additional data
 */
function debug(event, data = {}) {
  log(LOG_LEVELS.DEBUG, event, data);
}

/**
 * Performance logger for timing operations
 * @param {string} operation - Operation name
 * @param {number} startTime - Start timestamp
 * @param {Object} additionalData - Additional data
 */
function performance(operation, startTime, additionalData = {}) {
  const duration = Date.now() - startTime;
  info('performance_metric', {
    operation,
    duration_ms: duration,
    ...additionalData
  });
}

/**
 * Request logger for HTTP requests
 * @param {Object} req - Express request object
 * @param {string} event - Event name
 * @param {Object} additionalData - Additional data
 */
function request(req, event, additionalData = {}) {
  info(event, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    ...additionalData
  });
}

/**
 * Security logger for authentication and authorization events
 * @param {string} event - Security event name
 * @param {Object} data - Security-related data
 */
function security(event, data = {}) {
  // Security events are always logged as warnings or errors
  const level = event.includes('failure') || event.includes('error') ? LOG_LEVELS.ERROR : LOG_LEVELS.WARN;
  log(level, `security_${event}`, data);
}

/**
 * API logger for external API calls
 * @param {string} service - Service name (e.g., 'cartesia', 'firebase')
 * @param {string} operation - Operation name
 * @param {Object} data - API call data
 */
function api(service, operation, data = {}) {
  info(`api_${service}_${operation}`, data);
}

/**
 * Database logger for Firestore operations
 * @param {string} operation - Database operation
 * @param {Object} data - Database operation data
 */
function database(operation, data = {}) {
  info(`database_${operation}`, data);
}

/**
 * Storage logger for Firebase Storage operations
 * @param {string} operation - Storage operation
 * @param {Object} data - Storage operation data
 */
function storage(operation, data = {}) {
  info(`storage_${operation}`, data);
}

/**
 * Creates a child logger with default context
 * @param {Object} context - Default context to include in all logs
 * @returns {Object} - Child logger with context
 */
function createChildLogger(context = {}) {
  return {
    error: (event, data = {}) => error(event, { ...context, ...data }),
    warn: (event, data = {}) => warn(event, { ...context, ...data }),
    info: (event, data = {}) => info(event, { ...context, ...data }),
    debug: (event, data = {}) => debug(event, { ...context, ...data }),
    performance: (operation, startTime, additionalData = {}) => 
      performance(operation, startTime, { ...context, ...additionalData }),
    request: (req, event, additionalData = {}) => 
      request(req, event, { ...context, ...additionalData }),
    security: (event, data = {}) => security(event, { ...context, ...data }),
    api: (service, operation, data = {}) => api(service, operation, { ...context, ...data }),
    database: (operation, data = {}) => database(operation, { ...context, ...data }),
    storage: (operation, data = {}) => storage(operation, { ...context, ...data })
  };
}

// Export the logger object
const logger = {
  error,
  warn,
  info,
  debug,
  performance,
  request,
  security,
  api,
  database,
  storage,
  createChildLogger,
  LOG_LEVELS
};

module.exports = {
  logger
};
