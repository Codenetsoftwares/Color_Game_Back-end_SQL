export const notFound = (req, res, next) => {
  const err = new Error(`can't find ${req.originalUrl} on server!`);
  err.statusCode = 404;
  err.message = 'Failed ';
  next(err);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    message: message,
    status: statusCode,
  });
};
