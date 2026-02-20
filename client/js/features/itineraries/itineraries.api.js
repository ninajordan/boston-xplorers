const API_BASE = 'https://boston-xplorers-production.up.railway.app/api';

/**
 * Fetch all locations with optional search query
 */
export async function fetchLocations(query = "") {
  try {
    const url = query
      ? `${API_BASE}/locations/browse-locations?query=${encodeURIComponent(query)}`
      : `${API_BASE}/locations/browse-locations`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch locations");
    return await response.json();
  } catch (error) {
    console.error("Error fetching locations:", error);
    throw error;
  }
}

/**
 * Fetch single location by ID
 */
export async function fetchLocationById(locationID) {
  try {
    const response = await fetch(`${API_BASE}/locations/view-location/${locationID}`);
    if (!response.ok) throw new Error("Location not found");
    return await response.json();
  } catch (error) {
    console.error("Error fetching location:", error);
    throw error;
  }
}

/**
 * Fetch itinerary by ID
 */
export async function fetchItinerary(itineraryID) {
  try {
    const response = await fetch(`${API_BASE}/itinerary/view-itinerary/${itineraryID}`);
    if (!response.ok) throw new Error("Itinerary not found");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching itinerary:", error);
    throw error;
  }
}

/**
 * Save itinerary slots
 */
export async function saveItinerary(itineraryID, slotData) {
  try {
    console.log(`Slot Data: ${JSON.stringify({ slotData })}`);
    const response = await fetch(`${API_BASE}/itinerary/save-itinerary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itineraryID,
        slotData,
      }),
    });

    if (!response.ok) throw new Error("Failed to save itinerary");
    return await response.json();
  } catch (error) {
    console.error("Error saving itinerary:", error);
    throw error;
  }
}

/**
 * Delete slot from itinerary
 */
export async function deleteSlot(slotID) {
  try {
    const response = await fetch(`${API_BASE}/itinerary/remove-item/${slotID}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete slot");
    return await response.json();
  } catch (error) {
    console.error("Error deleting slot:", error);
    throw error;
  }
}

/**
 * Copy an itinerary
 */
export async function copyItinerary(sourceItineraryID, itineraryName, startDate) {
  try {
    const response = await fetch(`${API_BASE}/itinerary/copy-itinerary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itineraryID: sourceItineraryID,
        itineraryName,
        startDate,
      }),
    });

    if (!response.ok) throw new Error("Failed to copy itinerary");
    return await response.json();
  } catch (error) {
    console.error("Error copying itinerary:", error);
    throw error;
  }
}
