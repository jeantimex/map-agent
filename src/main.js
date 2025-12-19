import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { mapTools, executeMapCommand } from "./mapTools.js";
import "./style.css";
import geminiIcon from './Google-gemini-icon.svg';

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
let panorama;
let chatSession;

// --- Gemini Setup ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  tools: [{ functionDeclarations: mapTools }],
});


/**
 * Create an agent control for:
 *   1. displaying the heading and tilting of the map in realtime
 *   2. resetting the heading and tilting of the map on click
 */
function createAgentControl(map) {
  const agentControl = document.createElement('button');
  agentControl.classList.add('agent-control');
  agentControl.title = "Map Agent";

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
    const { StreetViewPanorama } = await importLibrary("streetView");

    geocoder = new Geocoder();
    const sfCoords = { lat: 37.7749, lng: -122.4194 };
    
    map = new Map(mapElement, {
      center: sfCoords, // Default to San Francisco
      zoom: 12,
      renderingType: "VECTOR",
      disableDefaultUI: true,
      streetViewControl: true,
      tiltInteractionEnabled: true,
      headingInteractionEnabled: true,
    });

    // Initialize Street View Panorama
    panorama = new StreetViewPanorama(document.getElementById("pano"), {
        position: sfCoords,
        visible: false, // Start hidden
        pov: { heading: 0, pitch: 0 }
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
const actionBtn = document.getElementById("action-btn"); // Renamed from sendBtn
const actionIcon = actionBtn.querySelector("span");
const messagesContainer = document.getElementById("chat-messages");

let recognition;
let isListening = false;

// Initialize Speech Recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true; // Keep listening until stopped
  recognition.interimResults = true; // Show live results
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isListening = true;
    actionBtn.classList.add("listening");
    actionIcon.textContent = "stop"; // Change to stop icon
    chatInput.placeholder = "Listening...";
  };

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    chatInput.value = transcript;
    updateButtonState(); // Switch to send button if text exists
  };

  recognition.onend = () => {
    isListening = false;
    actionBtn.classList.remove("listening");
    chatInput.placeholder = "Type a message...";
    updateButtonState(); // Reset icon based on content
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error", event.error);
    isListening = false;
    actionBtn.classList.remove("listening");
    updateButtonState();
  };
} else {
  console.warn("Web Speech API not supported in this browser.");
  // Fallback: Always show send button or hide mic
  actionIcon.textContent = "send";
}

function updateButtonState() {
  if (isListening) return; // Don't change if listening

  if (chatInput.value.trim().length > 0) {
    // Show Send button
    actionBtn.classList.add("send");
    actionIcon.textContent = "send";
  } else {
    // Show Mic button
    actionBtn.classList.remove("send");
    actionIcon.textContent = "mic";
  }
}

function handleAction() {
  // 1. If listening, stop listening
  if (isListening) {
    recognition.stop();
    return;
  }

  // 2. If text exists, send message
  if (chatInput.value.trim().length > 0) {
    handleSendMessage();
    return;
  }

  // 3. If empty and mic supported, start listening
  if (recognition) {
    recognition.start();
  }
}

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
  updateButtonState(); // Reset to mic

  try {
    const result = await chatSession.sendMessage(message);
    const response = await result.response;
    
    // Handle Function Calls
    const functionCalls = response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        // executeMapCommand now imported from mapTools.js
        const toolResult = await executeMapCommand(call.name, call.args, map, geocoder, panorama);
        
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
    updateButtonState();
  }
}

// Event Listeners
actionBtn.addEventListener("click", handleAction);
chatInput.addEventListener("input", updateButtonState);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleSendMessage();
  }
});
