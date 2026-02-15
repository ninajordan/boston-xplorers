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
        return null;
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
            return {found: false, deleted: false}
        }

        const slotDeletion = await db.collection('itinerarySlots').deleteMany({ itineraryID: itineraryID });
        const itineraryDeletion = await db.collection('itinerary').deleteOne({ itineraryID: itineraryID });
        return {
            found: true,
            deleted: true,
        }
    } catch(error) {
        console.log(`Error in deleting itinerary: ${error}`);
        return {found: true, deleted: false};
    }

}