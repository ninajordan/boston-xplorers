import express from "express";
import * as itineraryController from "./itineraries.controller.js";
import { validateItineraryCreation, validateItinerarySlots } from "./itineraries.validation.js";

const router = express.Router();

// Basic Itinerary CRUD Application APIs. Note that we are currently not allowing editing of itineraries once created.
// GET /api/itinerary/browse-itineraries
router.get("/browse-itineraries", itineraryController.browseItineraries);

// GET /api/itinerary/view-itinerary/:id
router.get("/view-itinerary/:id", itineraryController.viewItinerary);

// POST /api/itinerary/create-itinerary
router.post("/create-itinerary", validateItineraryCreation, itineraryController.createItinerary);

// DELETE /api/itinerary/delete-itinerary
router.delete("/delete-itinerary/:id", itineraryController.deleteItinerary);

// Itinerary Location Card Adding and Deleting APIs. This indirectly allows itinerary editing.
// POST /api/itinerary/save-itinerary
router.post("/save-itinerary", validateItinerarySlots, itineraryController.saveItinerary);

// DELETE /api/itinerary/remove-item
router.delete("/remove-item/:id", itineraryController.deleteItem);

// POST /api/itinerary/copy-itinerary/:id
router.post("/copy-itinerary", itineraryController.copyItinerary);

export default router;
