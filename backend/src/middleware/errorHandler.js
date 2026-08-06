export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};

export const errorHandler = (err, req, res, _next) => {
  console.error(err);
  if (err.name === 'ValidationError' || err.array) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.array?.() || err.message,
    });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'Ảnh quá lớn (tối đa 5MB)' });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ success: false, message: 'Vượt quá số ảnh cho phép' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ success: false, message: 'Định dạng upload không hợp lệ' });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};
