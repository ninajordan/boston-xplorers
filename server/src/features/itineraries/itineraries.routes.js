import express from 'express' 
import * as itineraryController from './itineraries.controller.js'
import {validateItineraryCreation} from './itineraries.validation.js'

const router = express.Router()

// GET /api/itinerary/browse-itineraries
router.get('/browse-itineraries', itineraryController.browseItineraries);

// GET /api/itinerary/view-itinerary/:id
router.get('/view-itinerary/:id', itineraryController.viewItinerary);

// POST /api/itinerary/create-itinerary
router.post('/create-itinerary', validateItineraryCreation, itineraryController.createItinerary);

export default router;