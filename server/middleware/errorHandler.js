// errorHandler.js

/**
 * Sanitize a URL string to prevent log injection.
 * Strips control characters, newlines, and carriage returns.
 */
const sanitizeUrl = (url) => {
  if (!url || typeof url !== "string") return "unknown";
  return url.replace(/[\r\n\t]/g, "_").replace(/[^\x20-\x7E]/g, "");
};

const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    const safeUrl = sanitizeUrl(req.originalUrl);
    console.error(`[ERROR] ${req.method} ${safeUrl}`);
    // Log only message and stack — avoid logging full err object which may contain secrets
    console.error(err.message);
    if (err.stack) console.error(err.stack);
  }

  // Malformed JSON body
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({
      success: false,
      error: "Malformed JSON in request body",
    });
  }

  // Mongoose ValidationError
  if (err.name === "ValidationError") {
    let message;
    if (process.env.NODE_ENV === "production") {
      // In production, return a generic message to avoid leaking schema internals
      message = "Validation failed. Please check your input and try again.";
    } else {
      const messages = Object.values(err.errors).map((e) => e.message);
      message = messages.join(", ");
    }
    return res.status(400).json({
      success: false,
      error: message,
    });
  }

  // Mongoose DuplicateKeyError
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(400).json({
      success: false,
      error: `Duplicate value for "${field}". A record with this value already exists.`,
    });
  }

  // Mongoose CastError
  if (err.name === "CastError") {
    return res.status(404).json({
      success: false,
      error: "Resource not found",
    });
  }

  // JWT — signature error
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }

  // JWT — token expired
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Token expired, please login again",
    });
  }

  // Generic server error
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Server error"
      : err.message || "Server error";

  return res.status(statusCode).json({
    success: false,
    error: message,
  });
};

export default errorHandler;
