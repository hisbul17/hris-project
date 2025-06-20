const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Database errors
  if (err.code === '23505') {
    return res.status(400).json({ 
      success: false, 
      message: 'Duplicate entry - record already exists' 
    });
  }
  
  if (err.code === '23503') {
    return res.status(400).json({ 
      success: false, 
      message: 'Referenced record not found' 
    });
  }

  if (err.code === '23502') {
    return res.status(400).json({ 
      success: false, 
      message: 'Required field is missing' 
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};

module.exports = { errorHandler };