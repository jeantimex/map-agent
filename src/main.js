import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { mapTools, executeMapCommand } from "./mapTools.js";
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

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  tools: [{ functionDeclarations: mapTools }],
});

import geminiIcon from './Google-gemini-icon.svg';

/**
 * Create an agent control for:
 *   1. displaying the heading and tilting of the map in realtime
 *   2. resetting the heading and tilting of the map on click
 */
function createAgentControl(map) {
  const agentControl = document.createElement('button');
  agentControl.classList.add('agent-control');
  agentControl.title = "Reset Heading & Tilt";

  const agentIcon = document.createElement('img');
  agentIcon.src = geminiIcon;
  agentIcon.classList.add('agent-icon');
  agentControl.appendChild(agentIcon);

  // When the agent is clicked, toggle chat and reset map's heading and tilt
  agentControl.addEventListener('click', () => {
    const chatContainer = document.querySelector('.chat-container');
    chatContainer.classList.toggle('open');
    
    // Focus input if opening
    if (chatContainer.classList.contains('open')) {
      setTimeout(() => document.getElementById('chat-input').focus(), 300);
    }
  });

  return agentControl;
}

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

    // Create the custom agent control
    const agentControl = createAgentControl(map);
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(agentControl);

    // Close chat on map click
    map.addListener('click', () => {
      document.querySelector('.chat-container').classList.remove('open');
    });
    
    // Close chat on button click
    document.getElementById('close-chat').addEventListener('click', () => {
      document.querySelector('.chat-container').classList.remove('open');
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

// --- Chat Interface ---
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const messagesContainer = document.getElementById("chat-messages");

function addMessage(text, isUser = false) {
  if (!text || !text.trim()) return; // Don't add empty messages
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
        // executeMapCommand now imported from mapTools.js
        const toolResult = await executeMapCommand(call.name, call.args, map, geocoder);
        
        // IMPORTANT: We must send the tool execution result back to Gemini
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