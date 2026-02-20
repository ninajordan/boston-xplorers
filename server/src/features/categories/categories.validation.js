export function validateCategoryCreation(req, res, next) {
  const { categoryName } = req.body;
  const errors = [];
  if (!categoryName) {
    errors.push("category name is required");
  } else if (typeof categoryName !== "string") {
    errors.push("category name must be string");
  } else if (categoryName.length === 0) {
    errors.push("category name cannot be empty");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: true,
      message: "Validation failed",
      errors: errors,
    });
  }

  next();
}
