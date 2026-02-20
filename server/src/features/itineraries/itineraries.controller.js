import * as itinerariesService from "./itineraries.service.js";

/**
 * GET /api/itinerary/browse-itineraries
 * Returns list of all itineraries (ID and name only)
 */
export async function browseItineraries(req, res) {
  try {
    const itineraries = await itinerariesService.getAllItineraries();

    // Return only ID and name for sidebar
    const simplifiedItineraries = itineraries.map((itinerary) => ({
      itineraryID: itinerary.itineraryID,
      itineraryName: itinerary.itineraryName,
    }));

    res.status(200).json(simplifiedItineraries);
  } catch (error) {
    console.error("Error in browseItineraries:", error);
    res.status(500).json({
      error: "Failed to fetch itineraries",
      message: error.message,
    });
  }
}

/**
 * GET /api/itinerary/view-itinerary/:id
 * Returns full itinerary details by ID
 */
export async function viewItinerary(req, res) {
  try {
    const { id } = req.params;

    const itinerary = await itinerariesService.getItineraryById(id);

    if (itinerary.status === 404) {
      return res.status(404).json({
        error: "itinerary not found",
        itineraryID: id,
      });
    }

    res.status(200).json(itinerary);
  } catch (error) {
    console.error("Error occured in viewing itinerary: ", error);
    res.status(500).json({
      error: "Failed to fetch itinerary",
      message: error.message,
    });
  }
}

/**
 * POST /api/itinerary/create-itinerary
 * Creates a new itinerary with auto-increment ID
 */
export async function createItinerary(req, res) {
  try {
    const { itineraryName, startDate, endDate } = req.body;
    const newItinerary = await itinerariesService.createItinerary({
      itineraryName,
      startDate,
      endDate,
    });

    res.status(201).json({
      message: "itinerary created successfully",
      itinerary: newItinerary,
    });
  } catch (error) {
    console.error("Error created in Itinerary Creation: ", error);
    res.status(500).json({
      error: "Failed to create itinerary",
      message: error.message,
    });
  }
}

/**
 * DELETE /api/itinerary/delete-itinerary/:id
 * Deletes itinerary with a given id
 */
export async function deleteItinerary(req, res) {
  try {
    const { id } = req.params;
    const deleted = await itinerariesService.deleteItinerary(id);

    if (deleted.status === 404) {
      res.status(404).json({ error: true, message: "itinerary not found" });
    }

    if (deleted.status === 500) {
      res.status(500).json({ error: true, message: "error in deleting itinerary" });
    }

    res.status(200).json({ error: false, message: "itinerary deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: true, message: `Error in deleting itinerary: ${error}` });
  }
}

/**
 * POST /api/itinerary/save-itinerary
 * Takes in Different Slot dates and times in corresponding to a particular location card for a given itinerary.
 */
export async function saveItinerary(req, res) {
  try {
    const { slotData, itineraryID } = req.body;
    const updatedItinerary = await itinerariesService.saveItinerary({
      slotData,
      itineraryID,
    });

    if (updatedItinerary.status == 404) {
      return res.status(404).json({
        message: "itinerary not found",
        itinerary: updatedItinerary,
      });
    }

    res.status(201).json({
      message: "itinerary created successfully",
      itinerary: updatedItinerary,
    });
  } catch (error) {
    console.error("Error in saving itinerary with requested slots", error);
    res.status(500).json({
      message: `failure in saving itinerary: ${error}`,
      error: true,
    });
  }
}

/**
 * DELETE /api/itinerary/remove-item/:id
 * Allows deleting of a single slot from the itinerary.
 */

export async function deleteItem(req, res) {
  try {
    const { id } = req.params;
    const deletedItem = await itinerariesService.deleteItem(id);

    if (deletedItem.status == 404) {
      return res.status(404).json({
        error: true,
        message: "Requested Itinerary Item could not be found",
      });
    }

    if (deletedItem.status == 500) {
      return res.status(500).json({
        error: true,
        message: `Error in deleting requested item: ${deletedItem.message}`,
      });
    }

    res.status(200).json({
      error: false,
      message: "Successfully deleted requested itinerary item",
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: `Error in deleting itinerary Item: ${error}`,
    });
  }
}

/**
 * POST /api/itinerary/copy-itinerary/:id
 * Allows copying a pre-existing itinerary entirely to a new itinerary. Only allows selecting start date to the user.
 */

export async function copyItinerary(req, res) {
  try {
    const { itineraryID, itineraryName, startDate } = req.body;
    const copiedItinerary = await itinerariesService.copyItineraryToNew(
      itineraryID,
      itineraryName,
      startDate,
    );

    if (copiedItinerary.status == 404) {
      res.status(404).json({
        error: true,
        message: `Requested itinerary to copy not found`,
      });
    }

    // Validate required fields
    if (!itineraryName || !startDate) {
      return res.status(400).json({
        error: "Validation failed",
        details: ["itineraryName and startDate are required"],
      });
    }

    if (copiedItinerary.status == 500) {
      res.status(500).json({
        error: true,
        message: `Error in copying itinerary: ${copiedItinerary.message}`,
      });
    }

    res.status(201).json({
      error: false,
      message: "itinerary copied successfully",
      itinerary: copiedItinerary,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: `error in copying itinerary: ${error}`,
    });
  }
}
