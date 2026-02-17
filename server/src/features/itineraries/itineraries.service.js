import { getDatabase } from "../../db/db.js";

async function getNextItineraryId() {
    const db = getDatabase();

    const lastItinerary = await db.collection('itineraries').find({}).sort({ itineraryID: -1 }).limit(1).toArray();
    if (lastItinerary.length === 0) {
        return '001' // Create first itinerary if no itineraries exist
    }

    const lastIdNumber = parseInt(lastItinerary[0].itineraryID, 10);
    const incrementedId = lastIdNumber + 1;

    return incrementedId.toString().padStart(3, '0');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}


function normalizeTime(timeString) {
    return timeString.substring(0, 5); // "14:00:00" -> "14:00"
}

function isDateInRange(date, startDate, endDate) {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    return checkDate >= start && checkDate <= end;
}


function getDaysDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function getDateOffset(oldDate, oldStartDate, newStartDate) {
    const oldStart = new Date(oldStartDate);
    oldStart.setHours(0, 0, 0, 0);
    
    const old = new Date(oldDate);
    old.setHours(0, 0, 0, 0);
    
    const newStart = new Date(newStartDate);
    newStart.setHours(0, 0, 0, 0);
    
    // Days from old start to old date
    const daysFromStart = getDaysDifference(oldStart, old);
    
    // Add same number of days to new start
    return addDays(newStart, daysFromStart);
}

export async function getAllItineraries() {
    const db = getDatabase();
    const itineraries = await db.collection('itineraries').find({}).sort({ itineraryID: 1 }).toArray();
    return itineraries;
}

function formatDateYMD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function generateDateRange(startDate, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    while (start <= end) {
        dates.push(new Date(start));
        start.setDate(start.getDate() + 1);
    }

    return dates;
}

function generateHourSlots() {
    const slots = []
    for (let hour = 0; hour < 24; hour++) {
        let hourString = String(hour);
        if (hourString.length < 2) {
            hourString = `0${hourString}`;
        }
        const timeString = `${hourString}:00`;
        slots.push(timeString);
    }
    return slots;
}

export async function getItineraryById(itineraryId) {
    const db = getDatabase();
    const itinerary = await db.collection('itineraries').findOne({ itineraryID: itineraryId });
    if (!itinerary) {
        return {
            status: 404,
            message: 'itinerary not found'
        };
    }

    const slotData = [];
    const startDate = itinerary.startDate;
    const endDate = itinerary.endDate;

    const dateRange = generateDateRange(startDate, endDate);
    const hourlySlots = generateHourSlots();

    const allItinerarySlots = await db.collection('itinerarySlots').find({itineraryID: itineraryId}).toArray();
    const locationIDs = allItinerarySlots.map(slot => slot.cardID);
    const uniqueLocationIDs = [... new Set(locationIDs)]

    const locations = await db.collection('locations').find({ locationID: {$in: uniqueLocationIDs }}).toArray();

    const slotMap = new Map();
    allItinerarySlots.forEach( slot => {
        const dateString = formatDateYMD(slot.slotDate);
        const dateTimeKey = `${dateString}-${slot.slotTime}`;
        slotMap.set(dateTimeKey, slot);
    });

    const locationMap = new Map();
    locations.forEach( loc => {
        locationMap.set(loc.locationID, loc);
    });

    dateRange.forEach(date => {
        hourlySlots.forEach(slot => {

            const slotKey = `${formatDateYMD(date)}-${slot}`;
            const itinerarySlot = slotMap.get(slotKey);
            if (itinerarySlot) {
                const locID = itinerarySlot.cardID;
                const loc = locationMap.get(locID);

                const formattedSlot = {
                    slotID: itinerarySlot.slotID,
                    itineraryID: itinerary.itineraryID,
                    location: {
                        locationName: loc.locationName,
                        locationDesc: loc.locationDescription,
                        locationImage: loc.locationImage,
                        timeToComplete: loc.timeToComplete,
                        distToPT: loc.distanceToPublicTransport,
                        category: loc.category,
                        rating: loc.starRating,
                        address: loc.address
                    },
                    slotDate: date,
                    slotTime: slot
                }
                slotData.push(formattedSlot);
            } else {
                const formattedSlot = {
                    slotID: null,
                    itineraryID: itinerary.itineraryID,
                    location: null,
                    slotDate: date,
                    slotTime: slot
                }
                slotData.push(formattedSlot);
            }
        });
    });
    return {
        status: 200,
        itineraryID: itinerary.itineraryID,
        itineraryName: itinerary.itineraryName,
        startDate: formatDate(itinerary.startDate),
        endDate: formatDate(itinerary.endDate),
        slotData: slotData,
    };
}

export async function createItinerary({ itineraryName, startDate, endDate }) {
    const db = getDatabase();
    const nextId = await getNextItineraryId();

    const newItinerary = {
        status: 201,
        itineraryID: nextId,
        itineraryName: itineraryName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
    };

    await db.collection('itineraries').insertOne(newItinerary);
    return newItinerary;
}

export async function deleteItinerary({ itineraryID }) {
    try{
        const db = getDatabase();
        const itinerary = await db.collection('itineraries').find({ itineraryID: itineraryID});

        if (!itinerary) {
            return {
                status: 404,
                message: 'itinerary not found'
            };
        }

        const slotDeletion = await db.collection('itinerarySlots').deleteMany({ itineraryID: itineraryID });
        const itineraryDeletion = await db.collection('itinerary').deleteOne({ itineraryID: itineraryID });
        return {
            status: 200,
            message: 'successfully deleted itinerary'
        }
    } catch(error) {
        console.log(`Error in deleting itinerary: ${error}`);
        return {
            status: 500,
            message: `Error occured in deleting itinerary: ${error}`
        }
    }

}

export async function saveItinerary({ slotData, itineraryID }) {
    try {
        const db = getDatabase();
        const itinerary = await db.collection('itineraries').findOne({ itineraryID: itineraryID });

        if ( !itinerary ) {
            return {
                status: 404,
                message: 'Itinerary Not found'
            };
        }

        let slotID = null;
        const finalSlot = await db.collection('itinerarySlots').find({}).sort({ slotID: -1}).limit(1).toArray();
        if (finalSlot.length === 0) {
            slotID = 0;
        } else {
            slotID = parseInt(finalSlot[0].slotID, 10);
        }
        const slotsToAdd = [];
        const errors = []
        slotData.forEach(slot => {
            slotID += 1;
            const formattedID = slotID.toString().padStart(3, '0');
            if (isDateInRange(slot.slotDate, itinerary.startDate, itinerary.endDate)) {
                const formattedSlot = {
                    slotID: formattedID,
                    itineraryID: itineraryID,
                    slotDate: new Date(slot.slotDate),
                    slotTime: slot.slotTime,
                    cardID: slot.cardID
                }
                slotsToAdd.push(formattedSlot);
            } else {
                errors.push({ error: true, message: `error in saving itinerary slot: ${slot.locationID}`});
                slotID -= 1;
            }
        });

        const saveError = await db.collection('itinerarySlots').insertMany(slotsToAdd);
        const errorOccurred = errors.length > 0;
        const error = saveError && errorOccurred;
        return {
            status: 201,
            message: 'Successfully added slots and saved itinerary',
            slotData: slotsToAdd,
            slotsFailed: errors,
            error: error
        };
    } catch (error) {
        console.log(`Error in Saving Slots: ${error}`);
        return {
            status: 500,
            message: `error in saving slots: ${error}`
        };
    }
}

export async function deleteItem({ id }) {
    try {
        const db = getDatabase();
        const slot = await db.collection('itinerarySlots').findOne({ slotID: id });

        if (!slot) {
            return {
                status: 404,
                message: "Requested itinerary item not found"
            }
        }

        const slotDeletion = await db.collection('itinerarySlots').deleteOne({ slotID: id });
        return {
            status: 200,
            message: "Deleted Successfully"
        };
    } catch (error) {
        console.log(`Error occured in deleting itinerary item: ${error}`);
        return {
            status: 500,
            message: `Error occured in deleting itinerary item: ${error}`
        };
    }
}

export async function copyItineraryToNew({ itineraryID, itineraryName, startDate }) {
    try {
        const db = getDatabase();
        const sourceItinerary = await db.collection('itineraries').findOne({ itineraryID: itineraryID })

        if (!sourceItinerary) {
            return {
                status: 404,
                message: 'itinerary not found'
            };
        }

         // Validate start date
         if (!isValidDate(startDate)) {
            return {
                status: 400,
                message: 'Invalid start date format'
            };
        }

        // Calculate trip duration in days
        const tripDuration = getDaysDifference(
            sourceItinerary.startDate, 
            sourceItinerary.endDate
        );

        // Calculate new end date
        const newStartDate = new Date(startDate);
        const newEndDate = addDays(newStartDate, tripDuration);

        const tgtItineraryID = await getNextItineraryId();

        let itinerarySlots = await db.collection('itinerarySlots').find({ itineraryID: itineraryID}).toArray();

        const itinerary = {
            itineraryID: tgtItineraryID,
            itineraryName: itineraryName,
            startDate: newStartDate,
            endDate: newEndDate
        };

        let slotID = null;
        const finalSlot = await db.collection('itinerarySlots').find({}).sort({ slotID: -1}).limit(1).toArray();
        if (finalSlot.length === 0) {
            slotID = 0;
        } else {
            slotID = parseInt(finalSlot[0].slotID, 10);
        }
        
        const newSlots = []
        itinerarySlots.forEach( slot => {
            slotID += 1;
            const formattedID = slotID.toString().padStart(3, '0');
            const newSlotDate =  getDateOffset(
                slot.slotDate,
                sourceItinerary.startDate,
                newStartDate
            );

            const updatedSlot = {
                slotID: formattedID,
                slotDate: newSlotDate,
                slotTime: slot.slotTime,
                cardID: slot.cardID,
            };
            newSlots.push(updatedSlot);

        })
        const inserted = await db.collection('itineraries').insertOne(itinerary);
        const slotsInserted = await db.collection('itinerarySlots').insertMany(newSlots);
        
        return {
            status: 201,
            message: 'itinerary copied successfully',
            itineraryID: tgtItineraryID
        };
    } catch (error) {
        return {
            status: 500,
            message: `Error in Copying: ${error}`
        }
    }
}