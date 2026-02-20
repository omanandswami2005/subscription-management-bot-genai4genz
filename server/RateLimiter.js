/**
 * RateLimiter implements rate limiting using in-memory storage
 * Tracks request counts per client IP and enforces limits
 */
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.clients = new Map(); // Map<clientIp, { count, resetTime }>
    
    // Start cleanup interval to remove expired entries
    this.cleanupInterval = setInterval(() => this.cleanup(), this.windowMs);
  }

  /**
   * Check if a request from client IP is allowed
   * @param {string} clientIp - Client IP address
   * @returns {boolean} True if request is allowed
   */
  isAllowed(clientIp) {
    const now = Date.now();
    const clientData = this.clients.get(clientIp);

    // No previous requests or window expired
    if (!clientData || now >= clientData.resetTime) {
      return true;
    }

    // Check if under limit
    return clientData.count < this.maxRequests;
  }

  /**
   * Record a request from client IP
   * @param {string} clientIp - Client IP address
   */
  recordRequest(clientIp) {
    const now = Date.now();
    const clientData = this.clients.get(clientIp);

    // New client or window expired
    if (!clientData || now >= clientData.resetTime) {
      this.clients.set(clientIp, {
        count: 1,
        resetTime: now + this.windowMs
      });
    } else {
      // Increment count
      clientData.count++;
    }
  }

  /**
   * Get time until reset for a client
   * @param {string} clientIp - Client IP address
   * @returns {number} Milliseconds until reset, or 0 if no limit
   */
  getResetTime(clientIp) {
    const clientData = this.clients.get(clientIp);
    
    if (!clientData) {
      return 0;
    }

    const now = Date.now();
    const timeUntilReset = clientData.resetTime - now;
    
    return timeUntilReset > 0 ? timeUntilReset : 0;
  }

  /**
   * Clean up expired entries from memory
   */
  cleanup() {
    const now = Date.now();
    
    for (const [clientIp, clientData] of this.clients.entries()) {
      if (now >= clientData.resetTime) {
        this.clients.delete(clientIp);
      }
    }
  }

  /**
   * Express middleware for rate limiting
   * @returns {Function} Express middleware function
   */
  middleware() {
    return (req, res, next) => {
      const clientIp = req.ip || req.connection.remoteAddress;

      if (!this.isAllowed(clientIp)) {
        const retryAfter = Math.ceil(this.getResetTime(clientIp) / 1000);
        
        res.status(429).json({
          error: true,
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: retryAfter
        });
        
        return;
      }

      this.recordRequest(clientIp);
      next();
    };
  }

  /**
   * Stop cleanup interval (for testing/shutdown)
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export default RateLimiter;
