/**
 * 404 Not Found Middleware
 * Catch-all for undefined route endpoints, returning standardized JSON response without revealing internal filesystem routes.
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found on Grow Green, Live Long backend API server.`
  });
};

module.exports = notFound;
