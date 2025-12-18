import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./style.css";

// --- Configuration ---
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

setOptions({
  key: GOOGLE_MAPS_API_KEY,
  v: "quarterly",
});

// --- State ---
let map;
let geocoder;
let chatSession;

// --- Gemini Setup ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const mapTools = [
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

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  tools: [{ functionDeclarations: mapTools }],
});

// --- Map Initialization ---
async function initMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  try {
    const { Map } = await importLibrary("maps");
    const { Geocoder } = await importLibrary("geocoding");

    geocoder = new Geocoder();
    map = new Map(mapElement, {
      center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
      zoom: 12,
      renderingType: "VECTOR",
    });
    
    // Start chat session only after map is ready
    chatSession = model.startChat();
    addMessage("Hello! I'm your AI Map Agent. I can move the map and zoom for you. Try saying 'Go to Paris' or 'Zoom in'.");

  } catch (error) {
    console.error("Error loading Google Maps API:", error);
    addMessage("Error loading Maps. Please check your API key.", false);
  }
}

initMap();

// --- Map Control Logic ---
async function executeMapCommand(functionName, args) {
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

// --- Chat Interface ---
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const messagesContainer = document.getElementById("chat-messages");

function addMessage(text, isUser = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user" : "system"}`;
  messageDiv.textContent = text;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function handleSendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  addMessage(message, true);
  chatInput.value = "";
  chatInput.disabled = true; // Disable input while processing

  try {
    const result = await chatSession.sendMessage(message);
    const response = await result.response;
    
    // Handle Function Calls
    const functionCalls = response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        const toolResult = await executeMapCommand(call.name, call.args);
        
        // IMPORTANT: We must send the tool execution result back to Gemini
        // so it can generate a final natural language response.
        const resultParts = [
          {
            functionResponse: {
              name: call.name,
              response: { name: call.name, content: toolResult }
            }
          }
        ];
        
        const finalResult = await chatSession.sendMessage(resultParts);
        addMessage(finalResult.response.text());
      }
    } else {
      // Normal text response
      addMessage(response.text());
    }

  } catch (error) {
    console.error("Gemini Error:", error);
    addMessage("Sorry, I encountered an error processing your request.");
  } finally {
    chatInput.disabled = false;
    chatInput.focus();
  }
}

sendBtn.addEventListener("click", handleSendMessage);

chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleSendMessage();
  }
});
