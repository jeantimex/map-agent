import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import "./style.css";

setOptions({
  key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  v: "weekly",
});

async function initMap() {
  try {
    const { Map } = await importLibrary("maps");
    
    new Map(document.getElementById("map"), {
      center: { lat: 0, lng: 0 },
      zoom: 4,
      renderingType: "VECTOR",
    });
  } catch (error) {
    console.error("Error loading Google Maps API:", error);
  }
}

initMap();
