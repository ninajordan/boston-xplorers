import { getDatabase } from "../../db/db.js";

async function getNextLocationId() {
  const db = getDatabase();

  const lastItinerary = await db
    .collection("locations")
    .find({})
    .sort({ locationID: -1 })
    .limit(1)
    .toArray();
  if (lastItinerary.length === 0) {
    return "001"; // Create first itinerary if no itineraries exist
  }

  const lastIdNumber = parseInt(lastItinerary[0].locationID, 10);
  const incrementedId = lastIdNumber + 1;

  return incrementedId.toString().padStart(3, "0");
}

function parseSort(sort, order) {
  const dir = order === "asc" ? 1 : -1;

  // sorting filters allowed
  const allowed = {
    rating: "starRating",
    name: "locationName",
    category: "category",
    neighborhood: "neighborhood",
  };

  const sortField = allowed[sort] || "starRating";
  return { [sortField]: dir };
}

function buildFilter({ category, neighborhood, query }) {
  const filter = {};

  if (category) filter.category = category;
  if (neighborhood) filter.neighborhood = neighborhood;

  //case insensitve sereaching for name and description
  if (query && query.trim().length > 0) {
    const q = query.trim();
    filter.$or = [
      { locationName: { $regex: q, $options: "i" } },
      { locationDescription: { $regex: q, $options: "i" } },
    ];
  }

  return filter;
}

/**
 * GET browse with filter/sort/pagination
 * Used by: GET /api/locations/browse-locations?category=&neighborhood=&query=&sort=&order=&page=&limit=
 */
export async function browseLocations({
  category,
  neighborhood,
  query,
  sort = "rating",
  order = "desc",
  page = 1,
  limit = 20,
} = {}) {
  const db = getDatabase();

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 20;

  const filter = buildFilter({ category, neighborhood, query });
  const sortObj = parseSort(sort, order);
  const skip = (safePage - 1) * safeLimit;

  const projection = {
    _id: 0, // will need mongo maybe? hide if not
    locationID: 1,
    locationName: 1,
    category: 1,
    starRating: 1,
    address: 1,
    locationImage: 1,
    timeToComplete: 1,
    // needed not sure may remove?
    neighborhood: 1,
  };
  const locations = await db
    .collection("locations")
    .find(filter, { projection })
    .sort(sortObj)
    .skip(skip)
    .limit(safeLimit)
    .toArray();

  // const total = await db.collection("locations").countDocuments(filter);
  // return { status: 200, page: safePage, limit: safeLimit, total, locations };

  return locations;
}

/**
 * GET all locations for homepage
 */
export async function getAllLocations() {
  const db = getDatabase();
  return await db.collection("locations").find({}).toArray();
}

/**
 * GET one location by locationID
 * Used by: GET /api/locations/view-location/:id
 */
export async function getLocationById(id) {
  const db = getDatabase();

  //location id strings ex 100
  const location = await db.collection("locations").findOne({ locationID: id });

  if (!location) {
    return { status: 404, message: "location not found" };
  }

  return location;
}

/**
 * CREATE new location
 * Used by: POST /api/locations/create-location
 *
 */
export async function createLocation(locationData) {
  try {
    const db = getDatabase();
    const locationID = await getNextLocationId();

    locationData.locationID = locationID;
    const category = locationData.category;

    const catInDB = await db.collection("categories").findOne({ categoryName: category });
    const categoryID = catInDB.categoryID;
    locationData.category = categoryID;

    locationData.starRating = 0;
    locationData.numRaters = 0;

    await db.collection("locations").insertOne(locationData);
    return locationData;
  } catch (error) {
    console.log(`Error creating location: ${error}`);
    return { status: 500, message: `Error creating location: ${error}` };
  }
}

/**
 * UPDATE a location by locationID
 * Used by: PATCH /api/locations/update-location/:id
 */
export async function updateLocation(id, updateData) {
  try {
    const db = getDatabase();

    const result = await db
      .collection("locations")
      .updateOne({ locationID: id }, { $set: updateData });

    if (result.matchedCount === 0) {
      return { status: 404, message: "location not found" };
    }

    // Return updated document
    const updated = await db.collection("locations").findOne({ locationID: id });
    return updated;
  } catch (error) {
    console.log(`Error in updating location: ${error}`);
    return { status: 500, message: `Error updating location: ${error}` };
  }
}

/**
 * DELETE a location by locationID
 * Used by: DELETE /api/locations/delete-location/:id
 */
export async function deleteLocation(id) {
  try {
    const db = getDatabase();

    const locSlots = await db.collection("itinerarySlots").find({ cardID: id }).toArray();

    if (locSlots.length > 0) {
      return { status: 409, message: "location cant be deleted. Used in itineraries" };
    }

    const result = await db.collection("locations").deleteOne({ locationID: id });

    if (result.deletedCount === 0) {
      return { status: 404, message: "location not found" };
    }

    return { status: 200, message: "successfully deleted location" };
  } catch (error) {
    console.log(`Error in deleting location: ${error}`);
    return { status: 500, message: `Error deleting location: ${error}` };
  }
}
