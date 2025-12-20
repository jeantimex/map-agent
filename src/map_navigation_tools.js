export const mapNavigationTools = [
  {
    name: "panToLocation",
    description:
      "Moves the map view to a specific address, city, landmark, or location name. Use this for navigation commands like 'Go to X', 'Fly to Y', 'Show me Z'. This tool does NOT create markers or pins, it only changes the view.",
    parameters: {
      type: "OBJECT",
      properties: {
        locationName: {
          type: "STRING",
          description: "The name of the city, address, or landmark.",
        },
      },
      required: ["locationName"],
    },
  },
  {
    name: "panToCoordinates",
    description:
      "Moves the map center to specific latitude and longitude coordinates using smooth animation.",
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
    description:
      "Immediately sets the map center to specific latitude and longitude coordinates (no animation).",
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
    description:
      "Pans the map to contain the given bounds (south, west, north, east). Zoom is NOT changed.",
    parameters: {
      type: "OBJECT",
      properties: {
        south: { type: "NUMBER", description: "Southern latitude" },
        west: { type: "NUMBER", description: "Western longitude" },
        north: { type: "NUMBER", description: "Northern latitude" },
        east: { type: "NUMBER", description: "Eastern longitude" },
        padding: {
          type: "NUMBER",
          description: "Padding in pixels (optional, default 0)",
        },
      },
      required: ["south", "west", "north", "east"],
    },
  },
  {
    name: "panBy",
    description:
      "Pans the map by the given distance in pixels (x, y). x increases east, y increases south.",
    parameters: {
      type: "OBJECT",
      properties: {
        x: {
          type: "NUMBER",
          description: "Pixels to move in x direction (positive is east)",
        },
        y: {
          type: "NUMBER",
          description: "Pixels to move in y direction (positive is south)",
        },
      },
      required: ["x", "y"],
    },
  },
  {
    name: "setHeading",
    description:
      "Sets the compass heading for the map in degrees from cardinal North.",
    parameters: {
      type: "OBJECT",
      properties: {
        heading: {
          type: "NUMBER",
          description: "The heading in degrees (0-360)",
        },
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
    description:
      "Sets the type of map to display. Allowed values: 'roadmap', 'satellite', 'hybrid', 'terrain'.",
    parameters: {
      type: "OBJECT",
      properties: {
        mapTypeId: {
          type: "STRING",
          description:
            "The type of map. One of: 'roadmap', 'satellite', 'hybrid', 'terrain'.",
        },
      },
      required: ["mapTypeId"],
    },
  },
  {
    name: "showStreetView",
    description: "Shows the Street View panorama for the current map location.",
    parameters: {
      type: "OBJECT",
      properties: {}, // No params needed, uses map center
    },
  },
  {
    name: "hideStreetView",
    description: "Hides the Street View panorama and returns to the map view.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "setStreetViewPov",
    description:
      "Rotates the camera to look in a specific direction or angle WITHOUT moving position. Use this for 'look up', 'turn right', 'look north'.",
    parameters: {
      type: "OBJECT",
      properties: {
        heading: {
          type: "NUMBER",
          description:
            "The camera heading in degrees relative to true north (0-360).",
        },
        pitch: {
          type: "NUMBER",
          description:
            "The camera pitch in degrees (-90 to 90). 0 is level, 90 is straight up, -90 is straight down.",
        },
      },
    },
  },
  {
    name: "navigateStreetView",
    description:
      "Moves the position of the Street View camera to the next panorama node in the specified direction. Use this for 'walk north', 'go forward', 'move northeast', 'step south'.",
    parameters: {
      type: "OBJECT",
      properties: {
        direction: {
          type: "STRING",
          description:
            "The direction to move/walk: north, northeast, east, southeast, south, southwest, west, northwest.",
        },
      },
      required: ["direction"],
    },
  },
  {
    name: "lookAroundStreetView",
    description:
      "Simulates a mouse drag to pan/look around in Street View smoothly. Use this for 'pan left', 'look around to the right', 'drag view up'.",
    parameters: {
      type: "OBJECT",
      properties: {
        direction: {
          type: "STRING",
          description: "The direction to look: left, right, up, down.",
        },
      },
      required: ["direction"],
    },
  },
  {
    name: "zoomInMap",
    description: "Zooms the map in (increases detail). Use this for 'Zoom in', 'Closer', 'Show me more detail'.",
    parameters: {
      type: "OBJECT",
      properties: {
        level: {
          type: "NUMBER",
          description:
            "Optional specific zoom level (1-20). If omitted, zooms in by one step.",
        },
      },
      required: [], // Optional
    },
  },
  {
    name: "zoomOutMap",
    description: "Zooms the map out (decreases detail/wider view). Use this for 'Zoom out', 'Further away', 'Show world view'.",
    parameters: {
      type: "OBJECT",
      properties: {
        level: {
          type: "NUMBER",
          description:
            "Optional specific zoom level (1-20). If omitted, zooms out by one step.",
        },
      },
      required: [], // Optional
    },
  },
];
