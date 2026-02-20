function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
} 

function isValidTime(timeString) {
    // Matches "14:00" or "14:00:00"
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return timeRegex.test(timeString);
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

export function validateItinerarySlots( req, res, next ) {
    const { slotData, itineraryID } = req.body;
    const errors = [];

    if ( !itineraryID ) {
        errors.push('itinerary ID is required');
    } else if ( typeof itineraryID != 'string' ) {
        errors.push('itineraryID must be a string of format 00X');
    } else if (itineraryID.trim().length === 0) {
        errors.push('itineraryName cannot be empty');
    }

    if (!slotData) {
        errors.push('slot data is required to save itinerary');
    } else if (!Array.isArray(slotData)) {
        errors.push('slot data must be an array of json requests');
    } else if (slotData.length === 0) {
        errors.push('slot data cannot be empty')
    } else {
        slotData.forEach(slot => {
            const { slotDate, slotTime, locationID } = slot
            if (!slotDate) {
                errors.push('slotDate is required');
            } else if (!isValidDate(slotDate)) {
                errors.push('slotDate must be a valid date (e.g., "2026-02-06" or "February 06, 2026")');
            }
            
            if (!slotTime) {
                errors.push('slotTime is required');
            } else if (!isValidTime(slotTime)) {
                errors.push('slotTime must be a valid time (e.g., "00:00:00" or "00:00")');
            }
    
            if (!locationID) {
                errors.push('locationID is required');
            } else if (typeof locationID != 'string') {
                errors.push('locationID must be a string of format 00X');
            } else if (locationID.trim().length === 0) {
                errors.push('locationID cant be empty');
            }
        });
    }


    if (errors.length > 0) {
        return res.status(400).json({
            error: true,
            message: 'Validation Failed',
            errors: errors
        });
    }

    next();
}