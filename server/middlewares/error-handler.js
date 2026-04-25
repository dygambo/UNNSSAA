const logger = require("../config/logger");
const { ZodError } = require("zod");

function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(
    {
      err,
      path: req.path,
      method: req.method,
      statusCode
    },
    "Request failed"
  );

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {})
  });
}

module.exports = errorHandler;
