import { initMapService } from "./map_service.js";
import { initGemini, getChatSession } from "./gemini_service.js";
import {
  initChatInterface,
  addMessage,
  addLoadingMessage,
  removeLoadingMessage,
} from "./chat_interface.js";
import { executeMapCommand } from "./tool_executor.js";
import { createLiveControl } from "./live_control.js";
import { GeminiLiveClient } from "./gemini_live_client.js";
import { createSidePanel } from "./side_panel.js";
import { createWeatherPanel } from "./weather_panel.js";
import { createTravelPanel } from "./travel_panel.js";
import { createDirectionsPanel } from "./directions_panel.js";
import { VoiceVisualizer } from "./voice_visualizer.js";
import "./style.css";

// Global state
let mapState = {
  map: null,
  geocoder: null,
  panorama: null,
  directionsService: null,
  elevationService: null,
};

// --- Live Client ---
let liveClient = null;
let liveControl = null;
let voiceVisualizer = null;

// --- Core Logic ---
async function handleSendMessage(message) {
  const chatSession = getChatSession();
  addLoadingMessage();

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
        removeLoadingMessage();
        addMessage(finalResult.response.text(), false);
      }
    } else {
      removeLoadingMessage();
      addMessage(response.text(), false);
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    removeLoadingMessage();
    addMessage("Sorry, I encountered an error processing your request.", false);
  }
}

// --- Initialization ---
async function initializeApp() {
  console.log("Environment check:", {
    hasMapsKey: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    hasGeminiKey: !!import.meta.env.VITE_GEMINI_API_KEY,
  });

  // Initialize Map
  const services = await initMapService();
  if (services) {
    mapState = services;

    // Initialize Chat Interface
    initChatInterface(handleSendMessage);

    // Initialize Gemini

    initGemini();

    // Create Visualizer container
    const vizContainer = document.createElement("div");
    vizContainer.id = "voice-viz-container";
    document.querySelector(".app-container").appendChild(vizContainer);
    voiceVisualizer = new VoiceVisualizer(vizContainer);

    // Initialize Live Client

    liveClient = new GeminiLiveClient({
      mapState: mapState,

      onActiveChange: (isActive) => {
        if (liveControl) {
          liveControl.setLiveState(isActive);
        }

        if (voiceVisualizer) {
          voiceVisualizer.setActive(isActive);
          if (isActive) {
            voiceVisualizer.setAnalysers(
              liveClient.analyser,
              liveClient.outputAnalyser
            );
          }
        }

        if (isActive) {
          addMessage("Started Live Session 🎙️", false);
        } else {
          addMessage("Ended Live Session", false);
        }
      },
    });

    // Create Live Control

    liveControl = createLiveControl(mapState.map, (shouldConnect) => {
      if (shouldConnect) {
        liveClient.connect();
      } else {
        liveClient.disconnect();
      }
    });

    // Add to map (above the agent control)

    mapState.map.controls[
      google.maps.ControlPosition.INLINE_END_BLOCK_END
    ].push(liveControl);

    // Create Side Panel
    const sidePanel = createSidePanel();
    document.querySelector(".app-container").appendChild(sidePanel);

    // Create Weather Panel
    const weatherPanel = createWeatherPanel();
    document.querySelector(".app-container").appendChild(weatherPanel);

    // Create Travel Panel
    const travelPanel = createTravelPanel();
    document.querySelector(".app-container").appendChild(travelPanel);

    // Create Directions Panel
    const directionsPanel = createDirectionsPanel();
    document.querySelector(".app-container").appendChild(directionsPanel);

    addMessage(
      "Hello! I'm your AI Map Agent. I can move the map, zoom, search for places, and give directions. Try saying 'Go to Paris' or 'Find pizza nearby'.",
      false
    );
  }
}

initializeApp();
