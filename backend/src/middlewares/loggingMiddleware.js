/**
 * Custom request logging middleware.
 * Captures method, path, response status, and processing duration.
 */
const loggingMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Custom response logging hook
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const status = res.statusCode;
    
    let statusColor = '\x1b[32m'; // Green for 2xx
    if (status >= 300 && status < 400) {
      statusColor = '\x1b[36m'; // Cyan for 3xx
    } else if (status >= 400 && status < 500) {
      statusColor = '\x1b[33m'; // Yellow for 4xx
    } else if (status >= 500) {
      statusColor = '\x1b[31m'; // Red for 5xx
    }
    
    const resetColor = '\x1b[0m';
    
    // Only print verbose logs if DEBUG mode is enabled or in development
    if (process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development') {
      console.log(
        `[${timestamp}] ${method} ${url} - ${statusColor}${status}${resetColor} (${duration}ms)`
      );
    }
  });

  next();
};

module.exports = loggingMiddleware;
