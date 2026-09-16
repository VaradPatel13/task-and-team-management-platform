import { validationResult } from 'express-validator';

// Reusable validation middleware.

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors into a clean array of { field, message } objects
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      error: formattedErrors[0].message,
      errors: formattedErrors,
    });
  };
};

export default validate;
