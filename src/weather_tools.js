export const weatherTools = [
  {
    name: "getCurrentConditions",
    description:
      "Get the current weather conditions for a specific location. You can provide a city name/address (e.g., 'Paris', 'Tokyo') OR latitude/longitude coordinates.",
    parameters: {
      type: "OBJECT",
      properties: {
        location: {
          type: "STRING",
          description:
            "City name, address, or landmark (e.g., 'Paris, France').",
        },
        lat: {
          type: "NUMBER",
          description:
            "Latitude of the location (optional if location name is provided).",
        },
        lng: {
          type: "NUMBER",
          description:
            "Longitude of the location (optional if location name is provided).",
        },
      },
    },
  },
  {
    name: "getDailyForecast",
    description:
      "Get the daily weather forecast (e.g. 10 days) for a specific location. You can provide a city name/address OR latitude/longitude coordinates.",
    parameters: {
      type: "OBJECT",
      properties: {
        location: {
          type: "STRING",
          description:
            "City name, address, or landmark (e.g., 'Paris, France').",
        },
        lat: {
          type: "NUMBER",
          description:
            "Latitude of the location (optional if location name is provided).",
        },
        lng: {
          type: "NUMBER",
          description:
            "Longitude of the location (optional if location name is provided).",
        },
      },
    },
  },
  {
    name: "closeWeatherInfo",
    description: "Closes the weather information panel.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
];
