function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
} 

export function validateItineraryCreation(req, res, next) {
    const {itineraryName, startDate, endDate } = req.body;
    const errors = [];
    
    if (!itineraryName) {
        errors.push('itineraryName is required');
      } else if (typeof itineraryName !== 'string') {
        errors.push('itineraryName must be a string');
      } else if (itineraryName.trim().length === 0) {
        errors.push('itineraryName cannot be empty');
      } else if (itineraryName.length > 100) {
        errors.push('itineraryName cannot exceed 100 characters');
    }
    
    if (!startDate) {
        errors.push('startDate is required');
      } else if (!isValidDate(startDate)) {
        errors.push('startDate must be a valid date (e.g., "2026-02-06" or "February 06, 2026")');
    }

    if (!endDate) {
        errors.push('endDate is required');
    } else if (!isValidDate(endDate)) {
        errors.push('endDate must be a valid date (e.g., "2026-02-12" or "February 12, 2026")');
    }

    if (startDate && endDate && isValidDate(startDate) && isValidDate(endDate)) {
        const start = new Date(startDate);
        const end = new Date(endDate);
    
        if (end < start) {
        errors.push('endDate must be after or equal to startDate');
        }
    }
  
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        });
    }

    next();

}