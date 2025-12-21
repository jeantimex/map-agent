import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { createAgentControl } from "./agent_control.js";
import { addMessage } from "./chat_interface.js";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

setOptions({
  key: GOOGLE_MAPS_API_KEY,
  v: "weekly",
  libraries: ["maps", "geocoding", "streetView", "places"],
});

export async function initMapService() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return null;

  try {
    const { Map } = await importLibrary("maps");
    const { Geocoder } = await importLibrary("geocoding");
    const { StreetViewPanorama } = await importLibrary("streetView");
    await importLibrary("places");
    await importLibrary("marker");

    const sfCoords = { lat: 37.7749, lng: -122.4194 };
    const geocoder = new Geocoder();

    // Core services available after API load
    const directionsService = new google.maps.DirectionsService();
    const elevationService = new google.maps.ElevationService();

    const map = new Map(mapElement, {
      center: sfCoords,
      zoom: 12,
      renderingType: "VECTOR",
      disableDefaultUI: true,
      streetViewControl: true,
      tiltInteractionEnabled: true,
      headingInteractionEnabled: true,
      gestureHandling: "greedy",
      mapId: "DEMO_MAP_ID",
    });

    const panorama = new StreetViewPanorama(document.getElementById("pano"), {
      position: sfCoords,
      visible: false,
      pov: { heading: 0, pitch: 0 },
    });

    panorama.addListener("status_changed", () => {
      const status = panorama.getStatus();
      const panoContainer = document.getElementById("pano");
      let errorMsg = document.getElementById("pano-error");

      if (status === "ZERO_RESULTS") {
        if (!errorMsg) {
          errorMsg = document.createElement("div");
          errorMsg.id = "pano-error";
          errorMsg.innerText =
            "Streetview is not available for the current address";
          Object.assign(errorMsg.style, {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "10px 20px",
            borderRadius: "5px",
            zIndex: "10",
            pointerEvents: "none",
          });
          panoContainer.appendChild(errorMsg);
        }
        errorMsg.style.display = "block";
      } else if (status === "OK") {
        if (errorMsg) {
          errorMsg.style.display = "none";
        }
      }
    });

    // Create the custom agent control
    const agentControl = createAgentControl(map);
    map.controls[google.maps.ControlPosition.INLINE_END_BLOCK_END].push(
      agentControl
    );

    // Close chat on map click
    map.addListener("click", () => {
      document.querySelector(".chat-container").classList.remove("open");
    });

    let centerDebounceTimer;
    map.addListener("center_changed", () => {
      clearTimeout(centerDebounceTimer);
      centerDebounceTimer = setTimeout(() => {
        panorama.setPosition(map.getCenter());
        if (
          document
            .getElementById("map-container")
            .classList.contains("split-view")
        ) {
          panorama.setVisible(true);
        }
      }, 500);
    });

    return {
      map,
      geocoder,
      panorama,
      directionsService,
      elevationService,
    };
  } catch (error) {
    console.error("Error loading Google Maps API:", error);
    addMessage("Error loading Maps. Please check your API key.", false);
    return null;
  }
}
