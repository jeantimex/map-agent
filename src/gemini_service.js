import { GoogleGenerativeAI } from "@google/generative-ai";
import { mapNavigationTools } from "./map_navigation_tools.js";
import { placesTools } from "./places_tools.js";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let chatSession;

export function initGemini() {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    tools: [{ functionDeclarations: [...mapNavigationTools, ...placesTools] }],
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
