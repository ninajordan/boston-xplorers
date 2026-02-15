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

export async function getItineraryById(itineraryId) {
    const db = getDatabase();
    const itinerary = await db.collection('itineraries').findOne({ itineraryID: itineraryId });
    if (!itinerary) {
        return null;
    }

    return {
        itineraryID: itinerary.itineraryID,
        itineraryName: itinerary.itineraryName,
        startDate: formatDate(itinerary.startDate),
        endDate: formatDate(itinerary.endDate),
        slotData: [],
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