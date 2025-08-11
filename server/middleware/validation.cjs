// Helper function to get local date string
function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const validUnits = [
  "serving",
  "cup",
  "tablespoon",
  "ounce",
  "gram",
  "small",
  "medium",
  "large",
  "slice",
  "piece",
  "bowl",
  "plate",
  "bunch",
  "can",
];

const mealTypes = [
  "breakfast",
  "morning_snack",
  "lunch",
  "afternoon_snack",
  "dinner",
  "evening_snack",
];

function validateFoodItem(foodItem) {
  const errors = [];

  if (
    !foodItem.name ||
    typeof foodItem.name !== "string" ||
    foodItem.name.trim().length === 0
  ) {
    errors.push("Food name is required and must be a non-empty string");
  }

  if (!foodItem.unit || !validUnits.includes(foodItem.unit)) {
    errors.push(`Unit must be one of: ${validUnits.join(", ")}`);
  }

  if (
    !foodItem.kcal ||
    typeof foodItem.kcal !== "number" ||
    foodItem.kcal <= 0
  ) {
    errors.push("Calories (kcal) must be a positive number");
  }

  return errors;
}

function validateDate(dateString) {
  const date = new Date(dateString);
  return (
    date instanceof Date &&
    !isNaN(date) &&
    dateString.match(/^\d{4}-\d{2}-\d{2}$/)
  );
}

function validateWeight(weight) {
  return typeof weight === "number" && weight > 0 && weight <= 1000; // reasonable bounds
}

function validateMealType(mealType) {
  return mealTypes.includes(mealType);
}

function validateRequest(req, res, next) {
  // Skip validation for GET requests and non-API routes
  if (req.method === "GET" || !req.path.startsWith("/api/")) {
    return next();
  }

  const { path, method, body } = req;

  try {
    // Validate meal-related requests
    if (path.includes("/api/meals/")) {
      const dateMatch = path.match(/\/api\/meals\/(\d{4}-\d{2}-\d{2})/);

      if (dateMatch) {
        const date = dateMatch[1];
        if (!validateDate(date)) {
          return res
            .status(400)
            .json({ error: "Invalid date format. Use YYYY-MM-DD" });
        }

        // Validate current date restriction for non-GET requests
        if (method !== "GET") {
          const today = getLocalDateString();
          if (date !== today) {
            return res.status(400).json({
              error: "Food items can only be modified for the current date",
            });
          }
        }
      }

      if (method === "POST" && path.includes("/food")) {
        const { mealType, name, unit, kcal } = body;

        if (!validateMealType(mealType)) {
          return res.status(400).json({
            error: `Invalid meal type. Must be one of: ${mealTypes.join(", ")}`,
          });
        }

        const foodErrors = validateFoodItem({ name, unit, kcal });
        if (foodErrors.length > 0) {
          return res.status(400).json({ error: foodErrors.join(". ") });
        }
      }

      if (method === "PUT" && path.includes("/food/")) {
        const foodErrors = validateFoodItem(body);
        if (foodErrors.length > 0) {
          return res.status(400).json({ error: foodErrors.join(". ") });
        }
      }
    }

    // Validate weight-related requests
    if (path.includes("/api/weight")) {
      if (method === "POST") {
        const { weight } = body;
        if (!validateWeight(weight)) {
          return res.status(400).json({
            error: "Weight must be a positive number between 0 and 1000",
          });
        }

        // Round to 1 decimal place
        body.weight = Math.round(weight * 10) / 10;
      }

      if (method === "PUT" && path.includes("/goal")) {
        const { goal } = body;
        if (!validateWeight(goal)) {
          return res.status(400).json({
            error: "Goal weight must be a positive number between 0 and 1000",
          });
        }

        // Round to 1 decimal place
        body.goal = Math.round(goal * 10) / 10;
      }
    }

    next();
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({ error: "Internal server error during validation" });
  }
}

module.exports = {
  validateRequest,
  validateFoodItem,
  validateDate,
  validateWeight,
  validateMealType,
  validUnits,
  mealTypes,
};
