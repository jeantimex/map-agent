export const mapTools = [
  {
    name: "panToLocation",
    description: "Moves the map center to a specific city or place.",
    parameters: {
      type: "OBJECT",
      properties: {
        locationName: { type: "STRING", description: "The name of the city or place" },
      },
      required: ["locationName"],
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
        map.panTo(results[0].geometry.location);
        return `Moved map to ${args.locationName}`;
      } else {
        return `Could not find location: ${args.locationName}`;
      }
    } catch (e) {
      console.error("Geocoding failed", e);
      return "Error finding location.";
    }
  } 
  
  else if (functionName === "zoomMap") {
    if (!map) return "Map not ready.";
    map.setZoom(args.level);
    return `Zoomed map to level ${args.level}`;
  }
  
  return "Unknown tool command.";
}