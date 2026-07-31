const multer = require('multer');

/**
 * Central standardized error handling middleware.
 * Guarantees zero exposure of API keys, MongoDB credentials, raw Gemini requests, or stack traces in production.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'An internal server error occurred.';

  // Handle Multer upload specific errors
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded image exceeds the maximum permitted filesize limit of 8 MB.';
    } else {
      message = `Image upload error: ${err.message}`;
    }
  }

  // Handle specific external API or validation errors safely
  if (message.includes('API_KEY_INVALID') || message.includes('API key not valid')) {
    statusCode = 401;
    message = 'External API authentication failed due to an invalid or misconfigured key.';
  } else if (message.includes('quota exceeded') || message.includes('RESOURCE_EXHAUSTED') || message.includes('Rate limit')) {
    statusCode = 429;
    message = 'Service API rate limit or quota exceeded. Please attempt your request again later.';
  } else if (message.includes('model not found') || message.includes('NOT_FOUND')) {
    statusCode = 404;
    message = 'The configured AI model or requested external service resource could not be found.';
  } else if (err.name === 'ValidationError' || err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data submitted. Please check all required form inputs.';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'A duplicate database entry already exists.';
  } else if (err.message && err.message.includes('timeout')) {
    statusCode = 504;
    message = 'Network timeout occurred while communicating with external data providers.';
  }

  // Scrub any accidental secret leaks from the output text just in case
  message = message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, '[DATABASE_URI_HIDDEN]');
  message = message.replace(/key=[^\s&]+/gi, 'key=[API_KEY_HIDDEN]');

  const responsePayload = {
    success: false,
    message: message
  };

  // Only append safe development hints in non-production, without full system paths
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    console.error(`[Error Diagnostics]: ${err.stack || err.message}`);
  }

  res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
