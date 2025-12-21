export const placesTools = [
  {
    name: "searchPlaces",
    description:
      "Search for places to display on the map with markers. Use this when the user explicitly asks to 'Find', 'Search', 'Locate', or 'Show markers' for specific types of places (e.g., 'gas stations', 'restaurants') or specific POIs to see their location pinned.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: {
          type: "STRING",
          description: "The text query for the search.",
        },
        radius: {
          type: "NUMBER",
          description: "Search radius in meters (optional).",
        },
        biasTowardsMapCenter: {
          type: "BOOLEAN",
          description:
            "Whether to bias the search results towards the current map center (default: true).",
        },
        maxResults: {
          type: "NUMBER",
          description: "The maximum number of results to display.",
        },
        minResults: {
          type: "NUMBER",
          description: "The minimum number of results to display.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "getPlaceDetailsByPlaceId",
    description:
      "Get detailed information about a specific place using its Place ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        placeId: {
          type: "STRING",
          description: "The Place ID of the location.",
        },
        fields: {
          type: "ARRAY",
          items: { type: "STRING" },
          description:
            "List of fields to retrieve (e.g., 'name', 'formatted_address', 'rating', 'opening_hours').",
        },
      },
      required: ["placeId"],
    },
  },
  {
    name: "getPlaceDetailsByLocation",
    description: "Get detailed information about a specific place by its name or address (e.g., 'White House', 'Eiffel Tower'). This tool will find the place, add a marker, and show its details in the side panel.",
    parameters: {
      type: "OBJECT",
      properties: {
        location: {
          type: "STRING",
          description: "The name or address of the place to find.",
        },
      },
      required: ["location"],
    },
  },
  {
    name: "getDirections",
    description: "Get directions between two locations.",
    parameters: {
      type: "OBJECT",
      properties: {
        origin: {
          type: "STRING",
          description: "Starting point (address, place name, or coordinates).",
        },
        destination: {
          type: "STRING",
          description: "Ending point (address, place name, or coordinates).",
        },
        travelMode: {
          type: "STRING",
          description:
            "Travel mode: 'DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'. Default is 'DRIVING'.",
        },
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
        lng: { type: "NUMBER", description: "Longitude of the location." },
      },
      required: ["lat", "lng"],
    },
  },
  {
    name: "clearMarkers",
    description:
      "Removes all search markers, pins, and info windows from the map. Use this when the user says 'clear the map', 'remove markers', 'hide pins', or 'start over'.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
];
