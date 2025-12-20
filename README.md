# Google Maps AI Agent 🗺️ 🤖

An interactive, AI-powered map agent built with **Google Maps JavaScript API** and **Gemini 3 Flash Preview**. This application allows users to control the map using natural language commands, explore places, and visualize Street View in a modern split-screen interface.

https://github.com/user-attachments/assets/643182ca-0db7-4723-bf15-b5d49049cacf

## Features

- **Natural Language Navigation**: Ask the agent to "Go to Tokyo", "Zoom in", "Show me the Eiffel Tower", or "Pan to coordinates".
- **AI-Driven Control**: Uses the Gemini API to understand intent and execute Google Maps commands (pan, zoom, tilt, heading).
- **Street View Integration**: Simply ask to "Show Street View" to open a split-screen panorama view alongside the map.
- **Interactive Street View**: Navigate within Street View naturally by asking to "walk north", "look left", or "turn around".
- **3D Map Capabilities**: Supports vector maps with tilt and heading control for immersive 3D exploration.
- **Interactive Agent UI**: A floating agent button with a 3D-styled icon that reacts to map orientation (heading/tilt) and toggles the chat interface.
- **Map Types**: Switch between Roadmap, Satellite, Hybrid, and Terrain views on command.

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES Modules), HTML5, CSS3
- **Build Tool**: Vite
- **AI Model**: Google Gemini 2.0 Flash (via `@google/generative-ai`)
- **Maps**: Google Maps JavaScript API (via `@googlemaps/js-api-loader`)

## Prerequisites

You need API keys for the following Google Cloud services:

1.  **Google Maps JavaScript API** (Enable "Maps JavaScript API", "Geocoding API", and "Places API").
2.  **Google Gemini API** (Get an API key from [Google AI Studio](https://aistudio.google.com/)).

## Setup & Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/your-username/map-agent.git
    cd map-agent
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory:

    ```env
    VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
    VITE_GEMINI_API_KEY=your_gemini_api_key_here
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open your browser to the URL shown (usually `http://localhost:5173`).

## Usage Examples

Open the chat by clicking the Gemini agent icon in the bottom-right corner. Try these commands:

### 🌍 Navigation & Exploration

- "Take me to the Golden Gate Bridge."
- "Fly to Tokyo, Japan."
- "Show me Central Park in New York."
- "Go to coordinates 48.8566, 2.3522."

### 🗺️ Map Control

- "Zoom in closer."
- "Zoom out to world view."
- "Pan slightly to the right."
- "Switch to satellite view."
- "Show me the terrain map."

### 🏢 3D & Perspective

- "Tilt the map 45 degrees."
- "Rotate the map 90 degrees."
- "Show me a 3D view of the city."

### 🚶 Street View & Panoramas

- **Activation**: "Show Street View here." (Opens split-screen mode)
- **Look Around**: "Look to the left", "Look up at the sky", "Pan right".
- **Movement**: "Walk north", "Go forward", "Step southwest".
- **Deactivation**: "Hide Street View", "Go back to the map".

## License

MIT
