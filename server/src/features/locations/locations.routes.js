import express from "express";
import * as locationsController from "./locations.controller.js";
import { validateLocationCreation, validateLocationUpdate } from "./locations.validation.js";

const router = express.Router();

// Basic Location CRUD APIs

// GET /api/locations/browse-locations
router.get("/browse-locations", locationsController.browseLocations);

// GET /api/locations/view-location/:id
router.get("/view-location/:id", locationsController.viewLocation);

// POST /api/locations/create-location
router.post("/create-location", validateLocationCreation, locationsController.createLocation);

// PATCH /api/locations/update-location/:id
router.patch("/update-location/:id", validateLocationUpdate, locationsController.updateLocation);

// DELETE /api/locations/delete-location/:id
router.delete("/delete-location/:id", locationsController.deleteLocation);

export default router;
