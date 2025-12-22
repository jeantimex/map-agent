import { GoogleGenerativeAI } from "@google/generative-ai";
import { mapNavigationTools } from "./map_navigation_tools.js";
import { placesTools } from "./places_tools.js";
import { weatherTools } from "./weather_tools.js";
import { travelTools } from "./travel_tools.js";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let chatSession;

export function initGemini() {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    tools: [
      {
        functionDeclarations: [
          ...mapNavigationTools,
          ...placesTools,
          ...weatherTools,
          ...travelTools,
        ],
      },
    ],
  });

  chatSession = model.startChat();
  return chatSession;
}

export function getChatSession() {
  if (!chatSession) {
    return initGemini();
  }
  return chatSession;
}

export async function generateTravelItinerary(
  destination,
  days,
  preferences,
  startDate
) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: { responseMimeType: "application/json" },
  });

  const dateContext = startDate ? ` starting from ${startDate}` : "";
  const prompt = `Create a ${days}-day travel itinerary for ${destination}${dateContext}. 
  Preferences: ${preferences || "General"}.
  
  Return a JSON object with this structure:
  {
    "destination": "${destination}",
    "days": ${days},
    "startDate": "${startDate || ""}",
    "preferences": "${preferences || ""}",
    "itinerary": [
      {
        "day": 1,
        "date": "YYYY-MM-DD",
        "theme": "Theme of the day",
        "summary": "Short summary",
        "places": ["Place Name 1", "Place Name 2"] 
      }
    ]
  }
  Important: The "places" array must contain exact names of real places that can be found on Google Maps. Limit to 3-5 places per day.`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
