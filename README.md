# Google Maps AI Agent 🗺️ 🤖

An interactive, AI-powered map agent built with **Google Maps JavaScript API** and **Gemini 3 Flash Preview**. This application allows users to control the map using natural language commands, explore places, and visualize Street View in a modern split-screen interface.

https://github.com/user-attachments/assets/10af2250-070b-4705-a4dc-81d6c3641ece

## Features

- **🎙️ Gemini Multimodal Live**: Real-time voice conversation with the map agent. Talk naturally, and the map reacts instantly.
- **📍 Smart Place Exploration**: Search for places, see markers, and view rich place details with interactive InfoWindows.
- **🌍 Natural Language Navigation**: Ask the agent to "Go to Tokyo", "Zoom in", "Show me the Eiffel Tower", or "Pan to coordinates".
- **🤖 AI-Driven Control**: Uses the Gemini API to understand intent and execute Google Maps commands (pan, zoom, tilt, heading).
- **🚶 Street View Integration**: Simply ask to "Show Street View" to open a split-screen panorama view. Navigate by saying "walk north" or "look left".
- **🏢 3D Map Capabilities**: Supports vector maps with tilt and heading control for immersive 3D exploration.
- **✨ Interactive Agent UI**: Reactive 3D-styled agent button and real-time voice interaction toggle.
- **🗺️ Map Types**: Switch between Roadmap, Satellite, Hybrid, and Terrain views on command.

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES Modules), HTML5, CSS3
- **Build Tool**: Vite
- **AI Models**:
  - **Text Chat**: Gemini 3 Flash Preview
  - **Multimodal Live**: Gemini 2.5 Flash Native Audio Preview
- **Maps**: Google Maps JavaScript API (via `@googlemaps/js-api-loader`)
- **Real-time**: WebSockets for Gemini Live, AudioWorklet for low-latency audio processing.

## Prerequisites

You need API keys for the following Google Cloud services:

1.  **Google Maps JavaScript API** (Enable "Maps JavaScript API", "Geocoding API", "Places API", "Directions API", and "Elevation API").
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

### 🎙️ Live Mode (Voice)

Click the **Microphone** button in the bottom-right corner to start a real-time voice session. Try:

- "Hey, take me to the Eiffel Tower and zoom in a bit."
- "What's the elevation here?"
- "Find some Italian restaurants in this area."
- "Clear all markers from the map."

### 💬 Text Chat

Open the chat by clicking the **Gemini agent icon** in the bottom-right corner.

#### 🌍 Navigation & Exploration

- "Fly to Tokyo, Japan."
- "Go to coordinates 48.8566, 2.3522."
- "Show me directions from San Francisco to Los Angeles."

#### 🗺️ Map Control

- "Zoom out to world view."
- "Switch to satellite view."
- "Tilt the map 45 degrees."

#### 🚶 Street View

- "Show Street View here."
- "Walk north" or "Step southwest".
- "Hide Street View."

## Code Quality

The project includes **Prettier** for consistent code formatting. Run:

```bash
npm run format
```

## License

MIT
