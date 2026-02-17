// locations.validation.js

const ALLOWED_CATEGORIES = [
    "park",
    "restaurant",
    "museum",
    "education",
    "miscellaneous",
    "landmark",
    "historic",
    "waterfront",
    "hiking",
  ];
  
  
  function isNonEmptyString(v) {
    return typeof v === "string" && v.trim().length > 0;
  }
  
  function isValidRating(v) {
    return typeof v === "number" && v >= 0 && v <= 5;
  }
  
  /**
   * Supports increments of  (e.g., 30, 60, 90)
   * can do a string simple converson "90" to 90
   * 
   */
  function isValidTimeToComplete(v) {
    // Allow undefined / null (optional field)
    if (v === undefined || v === null || v === "") return true;
  
    // If number of minutes
    if (typeof v === "number") {
      return Number.isFinite(v) && v > 0 && v % 30 === 0;
    }
  
    // If string that can be converted to number like "90"
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 && n % 30 === 0;
    }
  
    return false;
  }
  
  function sendValidationError(res, errors) {
    return res.status(400).json({
      error: true,
      message: "Validation failed",
      errors,
    });
  }
  
  /**
   * validateLocationCreation
   * Used before createLocation controller
   */
  export function validateLocationCreation(req, res, next) {
    const errors = [];
    const {
      locationID,
      locationName,
      locationDescription,
      category,
      address,
      starRating,
      locationImage,
      neighborhood,
      timeToComplete,
      // distanceToPublicTransport intentionally removed maybe add back seemed extra complicated
    } = req.body;
  
    // Required fields
    if (!isNonEmptyString(locationID)) errors.push("locationID is required and must be a non-empty string.");
    if (!isNonEmptyString(locationName)) errors.push("locationName is required and must be a non-empty string.");
    if (!isNonEmptyString(locationDescription)) errors.push("locationDescription is required and must be a non-empty string.");
    if (!isNonEmptyString(address)) errors.push("address is required and must be a non-empty string.");
  
    // Category required - must be allowed
    if (!isNonEmptyString(category)) {
      errors.push("category is required and must be a non-empty string.");
    } else if (!ALLOWED_CATEGORIES.includes(category)) {
      errors.push(`category must be one of: ${ALLOWED_CATEGORIES.join(", ")}.`);
    }
  
    // Optional fields validation
    if (starRating !== undefined) {
      const ratingNum = typeof starRating === "string" ? Number(starRating) : starRating;
      if (!isValidRating(ratingNum)) errors.push("starRating must be a number between 0 and 5.");
      else req.body.starRating = ratingNum; 
    }
  
    if (locationImage !== undefined && locationImage !== null && locationImage !== "") {
      if (!isNonEmptyString(locationImage)) errors.push("locationImage must be a non-empty string when provided.");
    }
  
    if (neighborhood !== undefined && neighborhood !== null && neighborhood !== "") {
      if (!isNonEmptyString(neighborhood)) errors.push("neighborhood must be a non-empty string when provided.");
    }
  
    if (!isValidTimeToComplete(timeToComplete)) {
      errors.push("timeToComplete must be in 30-minute increments (e.g., 30, 60, 90...).");
    } else if (timeToComplete !== undefined && timeToComplete !== null && timeToComplete !== "") {
      // normalize to number if it's a numeric string
      if (typeof timeToComplete === "string" && !Number.isNaN(Number(timeToComplete))) {
        req.body.timeToComplete = Number(timeToComplete);
      }
    }
  
    // Disallow distanceToPublicTransport might remove
    //if ("distanceToPublicTransport" in req.body) {
     // errors.push("distanceToPublicTransport is not supported. Remove this field.");
    //}
  
    if (errors.length > 0) return sendValidationError(res, errors);
  
    return next();
  }
  
  /**
   * validateLocationUpdate
   * some partial updates but validates any fields.
   */
  export function validateLocationUpdate(req, res, next) {
    const errors = [];
    const body = req.body || {};
  
    // no changes allowed to locationID
    if ("locationID" in body) {
      if (!isNonEmptyString(body.locationID)) {
        errors.push("locationID must be a non-empty string .");
      }
  
      errors.push("locationID cannot be updated.");
    }
  
    if ("locationName" in body && !isNonEmptyString(body.locationName)) {
      errors.push("locationName must be a non-empty string.");
    }
  
    if ("locationDescription" in body && !isNonEmptyString(body.locationDescription)) {
      errors.push("locationDescription must be a non-empty string.");
    }
  
    if ("address" in body && !isNonEmptyString(body.address)) {
      errors.push("address must be a non-empty string.");
    }
  
    if ("category" in body) {
      if (!isNonEmptyString(body.category)) {
        errors.push("category must be a non-empty string.");
      } else if (!ALLOWED_CATEGORIES.includes(body.category)) {
        errors.push(`category must be one of: ${ALLOWED_CATEGORIES.join(", ")}.`);
      }
    }
  
    if ("starRating" in body) {
      const ratingNum = typeof body.starRating === "string" ? Number(body.starRating) : body.starRating;
      if (!isValidRating(ratingNum)) errors.push("starRating must be a number between 0 and 5.");
      else body.starRating = ratingNum; 
    }
  
    if ("locationImage" in body && body.locationImage !== null && body.locationImage !== "") {
      if (!isNonEmptyString(body.locationImage)) errors.push("locationImage must be a non-empty string.");
    }
  
    if ("neighborhood" in body && body.neighborhood !== null && body.neighborhood !== "") {
      if (!isNonEmptyString(body.neighborhood)) errors.push("neighborhood must be a non-empty string.");
    }
  
    if ("timeToComplete" in body) {
      if (!isValidTimeToComplete(body.timeToComplete)) {
        errors.push("timeToComplete must be in 30-minute increments (e.g., 30, 60, 90...).");
      } else if (typeof body.timeToComplete === "string" && !Number.isNaN(Number(body.timeToComplete))) {
        body.timeToComplete = Number(body.timeToComplete);
      }
    }
  
    //if ("distanceToPublicTransport" in body) {
      //errors.push("distanceToPublicTransport not used");
    //}
  
    if (errors.length > 0) return sendValidationError(res, errors);
  
    req.body = body;
    return next();
  }
  