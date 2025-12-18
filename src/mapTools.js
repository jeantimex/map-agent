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
    name: "setCenter",
    description: "Immediately sets the map center to specific latitude and longitude coordinates (no animation).",
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
    name: "panToBounds",
    description: "Pans the map to contain the given bounds (south, west, north, east). Zoom is NOT changed.",
    parameters: {
      type: "OBJECT",
      properties: {
        south: { type: "NUMBER", description: "Southern latitude" },
        west: { type: "NUMBER", description: "Western longitude" },
        north: { type: "NUMBER", description: "Northern latitude" },
        east: { type: "NUMBER", description: "Eastern longitude" },
        padding: { type: "NUMBER", description: "Padding in pixels (optional, default 0)" }
      },
      required: ["south", "west", "north", "east"],
    },
  },
  {
    name: "panBy",
    description: "Pans the map by the given distance in pixels (x, y). x increases east, y increases south.",
    parameters: {
      type: "OBJECT",
      properties: {
        x: { type: "NUMBER", description: "Pixels to move in x direction (positive is east)" },
        y: { type: "NUMBER", description: "Pixels to move in y direction (positive is south)" },
      },
      required: ["x", "y"],
    },
  },
  {
    name: "setHeading",
    description: "Sets the compass heading for the map in degrees from cardinal North.",
    parameters: {
      type: "OBJECT",
      properties: {
        heading: { type: "NUMBER", description: "The heading in degrees (0-360)" },
      },
      required: ["heading"],
    },
  },
  {
    name: "setTilt",
    description: "Sets the angle of incidence of the map (tilt).",
    parameters: {
      type: "OBJECT",
      properties: {
        tilt: { type: "NUMBER", description: "The angle of tilt in degrees." },
      },
      required: ["tilt"],
    },
  },
  {
    name: "setMapTypeId",
    description: "Sets the type of map to display. Allowed values: 'roadmap', 'satellite', 'hybrid', 'terrain'.",
    parameters: {
      type: "OBJECT",
      properties: {
        mapTypeId: { 
          type: "STRING", 
          description: "The type of map. One of: 'roadmap', 'satellite', 'hybrid', 'terrain'." 
        },
      },
      required: ["mapTypeId"],
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
    if (!geocoder) return "Error: Geocoder not ready or initialized.";
    
    try {
      const { results } = await geocoder.geocode({ address: args.locationName });
      if (results && results[0]) {
        // panTo(latLng) provides smooth animation
        map.panTo(results[0].geometry.location);
        return `Successfully executed map.panTo() to move map to ${args.locationName}`;
      } else {
        return `Error: Could not find location '${args.locationName}'. Please check the spelling.`;
      }
    } catch (e) {
      console.error("Geocoding failed", e);
      return `Error: Geocoding failed for '${args.locationName}'. Reason: ${e.message}`;
    }
  } 
  
  else if (functionName === "panToCoordinates") {
    if (!map) return "Error: Map not initialized.";
    // panTo(latLng) using LatLngLiteral
    map.panTo({ lat: args.lat, lng: args.lng });
    return `Successfully executed map.panTo() to move map to coordinates: ${args.lat}, ${args.lng}`;
  }

  else if (functionName === "setCenter") {
    if (!map) return "Error: Map not initialized.";
    // setCenter(latLng) using LatLngLiteral
    map.setCenter({ lat: args.lat, lng: args.lng });
    return `Successfully executed map.setCenter() with coordinates: ${args.lat}, ${args.lng}`;
  }

  else if (functionName === "panToBounds") {
    if (!map) return "Error: Map not initialized.";
    
    const bounds = {
      south: args.south,
      west: args.west,
      north: args.north,
      east: args.east
    };
    
    const padding = args.padding || 0;
    
    // panToBounds(latLngBounds, padding)
    map.panToBounds(bounds, padding);
    return `Successfully executed map.panToBounds() with bounds: [${bounds.south}, ${bounds.west}, ${bounds.north}, ${bounds.east}] and padding: ${padding}`;
  }

  else if (functionName === "panBy") {
    if (!map) return "Error: Map not initialized.";
    // panBy(x, y)
    map.panBy(args.x, args.y);
    return `Successfully executed map.panBy(${args.x}, ${args.y})`;
  }

  else if (functionName === "setHeading") {
    if (!map) return "Error: Map not initialized.";
    // setHeading(heading)
    map.setHeading(args.heading);
    return `Successfully executed map.setHeading(${args.heading})`;
  }

  else if (functionName === "setTilt") {
    if (!map) return "Error: Map not initialized.";
    // setTilt(tilt)
    map.setTilt(args.tilt);
    return `Successfully executed map.setTilt(${args.tilt})`;
  }

  else if (functionName === "setMapTypeId") {
    if (!map) return "Error: Map not initialized.";
    // setMapTypeId(mapTypeId)
    const validTypes = ['roadmap', 'satellite', 'hybrid', 'terrain'];
    if (!validTypes.includes(args.mapTypeId)) {
        return `Error: Invalid map type '${args.mapTypeId}'. Valid types are: ${validTypes.join(', ')}.`;
    }
    map.setMapTypeId(args.mapTypeId);
    return `Successfully executed map.setMapTypeId('${args.mapTypeId}')`;
  }
  
  else if (functionName === "zoomMap") {
    if (!map) return "Error: Map not initialized.";
    map.setZoom(args.level);
    return `Successfully executed map.setZoom(${args.level})`;
  }
  
  return `Error: Unknown tool command '${functionName}'.`;
}
