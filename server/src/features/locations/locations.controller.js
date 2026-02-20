import * as locationsService from "./locations.service.js";

/**
 * GET /api/locations/browse-locations
 * Returns list of all locations
 */
export async function browseLocations(req, res) {
  try {
    const {
      query,
      category,
      neighborhood,
      sort = "rating",
      order = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const results = await locationsService.browseLocations({
      query,
      category,
      neighborhood,
      sort,
      order,
      page: Number(page),
      limit: Number(limit),
    });

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error in browseLocations:", error);
    return res.status(500).json({
      error: "Failed to fetch locations",
      message: error.message,
    });
  }
}

/**
 * GET /api/locations/view-location/:id
 * Returns full location details by ID
 */
export async function viewLocation(req, res) {
  try {
    const { id } = req.params;

    const location = await locationsService.getLocationById(id);

    if (location?.status === 404) {
      return res.status(404).json({
        error: "error location not found",
        locationID: id,
      });
    }

    res.status(200).json(location);
  } catch (error) {
    console.error("Error occured viewing location: ", error);
    res.status(500).json({
      error: "Failed to get location",
      message: error.message,
    });
  }
}

/**
 * POST /api/locations/create-location
 * Creates a new location
 */
export async function createLocation(req, res) {
  try {
    const created = await locationsService.createLocation(req.body);

    if (created?.status === 500) {
      return res.status(500).json({
        error: true,
        message: created.message,
      });
    }

    return res.status(201).json({
      message: "location created successfully",
      location: created,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
}

/**
 * PATCH /api/locations/update-location/:id
 * Updates an existing location by ID
 */
export async function updateLocation(req, res) {
  try {
    const { id } = req.params;

    const updated = await locationsService.updateLocation(id, req.body);

    if (updated?.status === 404) {
      return res.status(404).json({
        error: true,
        message: "location not found",
        locationID: id,
      });
    }

    if (updated?.status === 500) {
      return res.status(500).json({
        error: true,
        message: updated.message || "error updating location",
      });
    }

    res.status(200).json({
      error: false,
      message: "location updated successfully",
      location: updated,
    });
  } catch (error) {
    console.error("Error updating location: ", error);
    res.status(500).json({
      error: true,
      message: `Error updating location: ${error.message}`,
    });
  }
}

/**
 * DELETE /api/locations/delete-location/:id
 * Deletes location with a given id
 */
export async function deleteLocation(req, res) {
  try {
    const { id } = req.params;
    const deleted = await locationsService.deleteLocation(id);

    if (deleted?.status === 404) {
      return res.status(404).json({ error: true, message: "location not found" });
    }

    if (deleted?.status === 500) {
      return res.status(500).json({ error: true, message: "error deleting location" });
    }

    res.status(200).json({ error: false, message: "location deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: true, message: `Error deleting location: ${error}` });
  }
}
