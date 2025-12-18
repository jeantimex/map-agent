export const mapTools = [
  {
    name: "panToLocation",
    description: "Moves the map center to a specific city or place by name using smooth animation.",
    parameters: {
      type: "OBJECT",
      properties: {
        locationName: { type: "STRING", description: "The name of the city or place" },
      },
      required: ["locationName"],
    },
  },
  {
    name: "panToCoordinates",
    description: "Moves the map center to specific latitude and longitude coordinates using smooth animation.",
    parameters: {
      type: "OBJECT",
      properties: {
        lat: { type: "NUMBER", description: "The latitude" },
        lng: { type: "NUMBER", description: "The longitude" },
      },
      required: ["lat", "lng"],
    },
  },
  {
    name: "zoomMap",
    description: "Zooms the map in or out.",
    parameters: {
      type: "OBJECT",
      properties: {
        level: { type: "NUMBER", description: "Zoom level (1-20). 1 is world view, 20 is building view." },
      },
      required: ["level"],
    },
  },
];

export async function executeMapCommand(functionName, args, map, geocoder) {
  console.log(`Executing tool: ${functionName}`, args);

  if (functionName === "panToLocation") {
    if (!geocoder) return "Geocoder not ready.";
    
    try {
      const { results } = await geocoder.geocode({ address: args.locationName });
      if (results && results[0]) {
        // panTo(latLng) provides smooth animation
        map.panTo(results[0].geometry.location);
        return `Successfully executed map.panTo() to move map to ${args.locationName}`;
      } else {
        return `Could not find location: ${args.locationName}`;
      }
    } catch (e) {
      console.error("Geocoding failed", e);
      return "Error finding location.";
    }
  } 
  
  else if (functionName === "panToCoordinates") {
    if (!map) return "Map not ready.";
    // panTo(latLng) using LatLngLiteral
    map.panTo({ lat: args.lat, lng: args.lng });
    return `Successfully executed map.panTo() to move map to coordinates: ${args.lat}, ${args.lng}`;
  }
  
  else if (functionName === "zoomMap") {
    if (!map) return "Map not ready.";
    map.setZoom(args.level);
    return `Successfully executed map.setZoom(${args.level})`;
  }
  
  return "Unknown tool command.";
}
