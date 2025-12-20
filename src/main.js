import { initMapService } from "./map_service.js";
import { initGemini, getChatSession } from "./gemini_service.js";
import { initChatInterface, addMessage } from "./chat_interface.js";
import { executeMapCommand } from "./tool_executor.js";
import "./style.css";

// Global state
let mapState = {
  map: null,
  geocoder: null,
  panorama: null,
  placesService: null,
  directionsService: null,
  elevationService: null,
};

// --- Core Logic ---
async function handleSendMessage(message) {
  const chatSession = getChatSession();

  try {
    const result = await chatSession.sendMessage(message);
    const response = await result.response;

    // Handle Function Calls
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        const toolResult = await executeMapCommand(
          call.name,
          call.args,
          mapState.map,
          mapState.geocoder,
          mapState.panorama,
          mapState.placesService,
          mapState.directionsService,
          mapState.elevationService
        );

        const resultParts = [
          {
            functionResponse: {
              name: call.name,
              response: { name: call.name, content: toolResult },
            },
          },
        ];

        const finalResult = await chatSession.sendMessage(resultParts);
        addMessage(finalResult.response.text());
      }
    } else {
      addMessage(response.text());
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    addMessage("Sorry, I encountered an error processing your request.");
  }
}

// --- Initialization ---
async function initializeApp() {
  // Initialize Map
  const services = await initMapService();
  if (services) {
    mapState = services;

    // Initialize Chat Interface
    initChatInterface(handleSendMessage);

    // Initialize Gemini
    initGemini();

    addMessage(
      "Hello! I'm your AI Map Agent. I can move the map, zoom, search for places, and give directions. Try saying 'Go to Paris' or 'Find pizza nearby'."
    );
  }
}

initializeApp();
