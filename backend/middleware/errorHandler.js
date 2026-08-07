const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // SQLite errors
  if (err.message && err.message.includes('SQLITE_CONSTRAINT')) {
    return res.status(400).json({
      success: false,
      error: 'Database constraint violation',
      details: err.message
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;