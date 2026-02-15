
import * as itinerariesService from './itineraries.service.js'

/**
 * GET /api/itinerary/browse-itineraries
 * Returns list of all itineraries (ID and name only)
 */
export async function browseItineraries(req, res) {
    try {
      const itineraries = await itinerariesService.getAllItineraries();
      
      // Return only ID and name for sidebar
      const simplifiedItineraries = itineraries.map(itinerary => ({
        itineraryID: itinerary.itineraryID,
        itineraryName: itinerary.itineraryName
      }));
      
      res.status(200).json(simplifiedItineraries);
    } catch (error) {
      console.error('Error in browseItineraries:', error);
      res.status(500).json({ 
        error: 'Failed to fetch itineraries',
        message: error.message 
      });
    }
  }

/**
 * GET /api/itinerary/view-itinerary/:id
 * Returns full itinerary details by ID
 */
export async function viewItinerary(req, res) {
    try {
        const {id} = req.params;

        const itinerary = await itinerariesService.getItineraryById(id);

        if (!itinerary) {
            return res.status(404).json({
                error: 'itinerary not found',
                itineraryID: id
            });
        }

        res.status(200).json(itinerary)
    } catch (error) {
        console.error("Error occured in viewing itinerary: ", error);
        res.status(500).json({ 
            error: 'Failed to fetch itinerary',
            message: error.message 
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
            endDate
        });

        res.status(201).json({
            message: 'itinerary created successfully',
            itinerary: newItinerary
        });
    } catch (error) {
        console.error('Error created in Itinerary Creation: ', error);
        res.status(500).json({
            error: 'Failed to create itinerary',
            message: error.message
        })
    }
}