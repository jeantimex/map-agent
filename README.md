# Google Maps AI Agent

An interactive, AI-powered map application built with the Google Maps JavaScript API and Gemini models. This application allows users to control the map, explore locations, and plan trips using natural language through both text and real-time voice interfaces.

https://github.com/user-attachments/assets/10af2250-070b-4705-a4dc-81d6c3641ece

## Core Capabilities

The application is structured around several specialized tool suites that the Gemini AI uses to fulfill user requests.

### Map Navigation Tools

These tools allow for precise control over the map viewport and environment layers:

- Viewport Control: Pan to specific locations or coordinates, adjust zoom levels, and set map tilt or heading for 3D exploration.
- Street View: Enable a split-screen panorama view. Navigate through Street View nodes or rotate the camera using natural language.
- Environmental Layers: Toggle real-time traffic information and public transit network overlays.
- Map Types: Switch between roadmap, satellite, hybrid, and terrain views.

![Map Navigation](https://github.com/user-attachments/assets/3ea8fa58-54da-49d5-a93a-325debacf2c3)

### Places Exploration Tools

Integrated with the New Places API to provide rich location data:

- Text Search: Find specific landmarks, businesses, or addresses using free-form queries.
- Nearby Search: Locate specific types of places (like restaurants or ATMs) within a defined radius of the map center.
- Place Details: Retrieve comprehensive information including ratings, photos, opening hours, and contact details.
- Interactive Markers: Results are displayed as advanced markers on the map, featuring synchronized highlighting between the map and the side panel.

![Places Exploration](https://github.com/user-attachments/assets/0164fcde-82e6-4aff-8565-4c32ad489b90)

![Place Details](https://github.com/user-attachments/assets/a8bfded8-9067-4d09-961a-2e9e10bf0b97)

### Travel Planning Tools

A sophisticated system for generating and managing trip itineraries:

- Itinerary Generation: Create multi-day trip plans based on destination, duration, and personal preferences.
- Day-by-Day Exploration: Navigate through a nested UI stack to see specific activities for each day.
- Integrated Experience: Automatically centers the map on the destination and displays relevant weather information if travel dates are provided.

![Travel Itinerary](https://github.com/user-attachments/assets/1a422723-65b1-4466-b960-15273d96997e)

### Weather Information Tools

Provides localized weather data with visual representations:

- Current Conditions: Fetch real-time weather including temperature, humidity, wind speed, and UV index.
- Daily Forecast: View multi-day forecasts with high and low temperature trends.
- Data Visualization: Uses D3.js to render temperature range charts within the weather panel.

![Weather Forecast](https://github.com/user-attachments/assets/e595aeb7-d928-47ca-8ce2-a790cbe9966b)

## Technical Implementation

### AI Integration

- Text Chat: Uses Gemini 3.0 Flash for understanding intent and executing complex tool chains.
- Gemini Multimodal Live: Enables low-latency, real-time voice conversations using WebSockets and AudioWorklets.
- Function Calling: Mapping natural language to specific JavaScript functions for reliable map manipulation.

### Frontend Architecture

- Components: Vanilla JavaScript with ES Modules for high performance and zero framework overhead.
- UI Management: A custom panel system with mutual exclusivity, ensuring only one primary information panel (Places, Weather, or Travel) is active at a time.
- Build System: Powered by Vite for fast development and optimized production builds.

## Prerequisites

To run this project, you need API keys for the following services:

1. Google Maps JavaScript API (Ensure Places API (New), Geocoding, elevation, and Directions APIs are enabled).
2. Google Gemini API (Available via Google AI Studio).

## Installation

1. Clone the repository.
2. Install dependencies: `npm install`.
3. Configure environment variables in a `.env` file:
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `VITE_GEMINI_API_KEY`
4. Start the development server: `npm run dev`.
