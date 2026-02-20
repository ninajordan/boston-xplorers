// locations.validation.js

//const ALLOWED_CATEGORIES = [
//    "park",
//    "restaurant",
//    "museum",
//    "education",
//    "miscellaneous",
//    "landmark",
//    "historic",
//    "waterfront",
//    "hiking",
//  ];
  
  
  function isNonEmptyString(v) {
    return typeof v === "string" && v.trim().length > 0;
  }
  
  
  /**
   * Supports increments of 1 hour / 60 mins 
   * 
   * 
   */
  function isValidTimeToComplete(timeToComplete) {
    if (timeToComplete === undefined || timeToComplete === null || timeToComplete === "") return true;
  
    const n = Number(timeToComplete);
    if (!Number.isFinite(n)) return false;
  
    return n > 0 && n % 60 === 0; // ✅ hours only
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
      locationName,
      locationDescription,
      category,
      address,
      locationImage,
      neighborhood,
      timeToComplete,
      // distanceToPublicTransport intentionally removed maybe add back seemed extra complicated
    } = req.body;
  
    // Required fields
    if (!isNonEmptyString(locationName)) errors.push("locationName is required and must be a non-empty string.");
    if (!isNonEmptyString(locationDescription)) errors.push("locationDescription is required and must be a non-empty string.");
    if (!isNonEmptyString(address)) errors.push("address is required and must be a non-empty string.");
  
    // Category required - must be allowed
    if (!isNonEmptyString(category)) {
      errors.push("category is required and must be a non-empty string.");
    }
  
    
    if (locationImage !== undefined && locationImage !== null && locationImage !== "") {
      if (!isNonEmptyString(locationImage)) errors.push("locationImage must be a non-empty string when provided.");
    }
  
    if (neighborhood !== undefined && neighborhood !== null && neighborhood !== "") {
      if (!isNonEmptyString(neighborhood)) errors.push("neighborhood must be a non-empty string when provided.");
    }
  
    if (!isValidTimeToComplete(timeToComplete)) {
      errors.push("timeToComplete must be in 60-minute increments (e.g., 60, 120, 180...).");
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
  
    if ("locationImage" in body && body.locationImage !== null && body.locationImage !== "") {
      if (!isNonEmptyString(body.locationImage)) errors.push("locationImage must be a non-empty string.");
    }
  
    if ("neighborhood" in body && body.neighborhood !== null && body.neighborhood !== "") {
      if (!isNonEmptyString(body.neighborhood)) errors.push("neighborhood must be a non-empty string.");
    }
  
    if ("timeToComplete" in body) {
      if (!isValidTimeToComplete(body.timeToComplete)) {
        errors.push("timeToComplete must be in 60-minute increments (e.g., 60, 120, 180...).");
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
  