import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { createAgentControl } from "./agent_control.js";
import { addMessage } from "./chat_interface.js";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

setOptions({
  key: GOOGLE_MAPS_API_KEY,
  v: "quarterly",
});

export async function initMapService() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return null;

  try {
    const { Map } = await importLibrary("maps");
    const { Geocoder } = await importLibrary("geocoding");
    const { StreetViewPanorama } = await importLibrary("streetView");

    const sfCoords = { lat: 37.7749, lng: -122.4194 };
    const geocoder = new Geocoder();
    
    const map = new Map(mapElement, {
      center: sfCoords,
      zoom: 12,
      renderingType: "VECTOR",
      disableDefaultUI: true,
      streetViewControl: true,
      tiltInteractionEnabled: true,
      headingInteractionEnabled: true,
    });

    const panorama = new StreetViewPanorama(document.getElementById("pano"), {
        position: sfCoords,
        visible: false,
        pov: { heading: 0, pitch: 0 }
    });

    // Create the custom agent control
    const agentControl = createAgentControl(map);
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(agentControl);

    // Close chat on map click
    map.addListener('click', () => {
      document.querySelector('.chat-container').classList.remove('open');
    });

    return { map, geocoder, panorama };

  } catch (error) {
    console.error("Error loading Google Maps API:", error);
    addMessage("Error loading Maps. Please check your API key.", false);
    return null;
  }
}