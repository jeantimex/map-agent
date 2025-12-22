export const travelTools = [
  {
    name: "getTravelPlan",
    description:
      "Generates a multi-day travel itinerary for a destination. It finds specific places for each day and displays them on the map and in a travel panel.",
    parameters: {
      type: "OBJECT",
      properties: {
        destination: {
          type: "STRING",
          description: "The city or cities to visit (e.g., 'Paris' or 'Tokyo').",
        },
        days: {
          type: "NUMBER",
          description: "The total number of days for the trip.",
        },
        startDate: {
          type: "STRING",
          description:
            "Optional start date of the trip (e.g., '2025-02-20'). If provided, weather information will be displayed.",
        },
        preferences: {
          type: "STRING",
          description:
            "Optional travel preferences (e.g., 'art and history', 'foodie', 'relaxed pace').",
        },
      },
      required: ["destination", "days"],
    },
  },
];
