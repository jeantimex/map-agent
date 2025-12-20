export const placesTools = [
  {
    name: "searchPlaces",
    description: "Search for places using Google Places text search (e.g., 'restaurants nearby', 'museums in Paris').",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "The text query for the search." },
        radius: { type: "NUMBER", description: "Search radius in meters (optional)." },
        biasTowardsMapCenter: { type: "BOOLEAN", description: "Whether to bias the search results towards the current map center (default: true)." }
      },
      required: ["query"],
    },
  },
  {
    name: "getPlaceDetails",
    description: "Get detailed information about a specific place using its Place ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        placeId: { type: "STRING", description: "The Place ID of the location." },
        fields: { 
          type: "ARRAY", 
          items: { type: "STRING" }, 
          description: "List of fields to retrieve (e.g., 'name', 'formatted_address', 'rating', 'opening_hours')." 
        }
      },
      required: ["placeId"],
    },
  },
  {
    name: "getDirections",
    description: "Get directions between two locations.",
    parameters: {
      type: "OBJECT",
      properties: {
        origin: { type: "STRING", description: "Starting point (address, place name, or coordinates)." },
        destination: { type: "STRING", description: "Ending point (address, place name, or coordinates)." },
        travelMode: { 
          type: "STRING", 
          description: "Travel mode: 'DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'. Default is 'DRIVING'." 
        }
      },
      required: ["origin", "destination"],
    },
  },
  {
    name: "getElevation",
    description: "Get elevation data for a specific location.",
    parameters: {
      type: "OBJECT",
      properties: {
        lat: { type: "NUMBER", description: "Latitude of the location." },
        lng: { type: "NUMBER", description: "Longitude of the location." }
      },
      required: ["lat", "lng"],
    },
  }
];
