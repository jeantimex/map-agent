import { updatePlacesPanel, showPlaceDetails } from "./side_panel.js";
import { updateWeatherPanel, updateForecastPanel } from "./weather_panel.js";
import { updateTravelPanel } from "./travel_panel.js";
import { updateDirectionsPanel } from "./directions_panel.js";
import { adaptPlaceResult } from "./places_utils.js";
import { generateTravelItinerary } from "./gemini_service.js";

/**
 * Helper to update panorama position if it's currently visible/linked.
 */
function updatePanoramaIfVisible(map, panorama) {
  if (panorama && panorama.getVisible()) {
    panorama.setPosition(map.getCenter());
  }
}

/**
 * Helper to simulate a smooth drag operation.
 */
function simulateDrag(element, startX, startY, endX, endY, duration = 500) {
  const steps = 20;
  const stepTime = duration / steps;

  // Mouse Down
  const downEvent = new MouseEvent("mousedown", {
    clientX: startX,
    clientY: startY,
    bubbles: true,
    cancelable: true,
    view: window,
  });
  element.dispatchEvent(downEvent);

  let currentStep = 0;

  const animateDrag = () => {
    currentStep++;
    const progress = currentStep / steps;
    const currentX = startX + (endX - startX) * progress;
    const currentY = startY + (endY - startY) * progress;

    // Mouse Move
    const moveEvent = new MouseEvent("mousemove", {
      clientX: currentX,
      clientY: currentY,
      bubbles: true,
      cancelable: true,
      view: window,
    });
    element.dispatchEvent(moveEvent);

    if (currentStep < steps) {
      setTimeout(animateDrag, stepTime);
    } else {
      // Mouse Up
      const upEvent = new MouseEvent("mouseup", {
        clientX: endX,
        clientY: endY,
        bubbles: true,
        cancelable: true,
        view: window,
      });
      element.dispatchEvent(upEvent);
    }
  };

  animateDrag();
}

// Global directions renderer to manage route display
let directionsRenderer = null;
// Global traffic layer
let trafficLayer = null;
// Global transit layer
let transitLayer = null;
// Global markers array to clear previous search results
let placesMarkers = [];

function clearPlacesMarkers() {
  placesMarkers.forEach((m) => m.setMap(null));
  placesMarkers = [];
  updatePlacesPanel([]);
}

function closeAllPanels() {
  const panels = [
    "places-panel",
    "weather-panel",
    "travel-panel",
    "directions-panel",
  ];
  panels.forEach((id) => {
    const panel = document.getElementById(id);
    if (panel) panel.style.display = "none";
  });
}

const markerCallbacks = {
  onMouseEnter: (placeId) => {
    const marker = placesMarkers.find(
      (m) => m.element.id === `place_marker${placeId}`
    );
    if (marker && marker.content) {
      marker.content.background = null;
      marker.content.borderColor = null;
      marker.content.glyphColor = "white";
    }
  },
  onMouseLeave: (placeId) => {
    const marker = placesMarkers.find(
      (m) => m.element.id === `place_marker${placeId}`
    );
    if (marker && marker.content) {
      marker.content.background = marker.originalColor;
      marker.content.borderColor = marker.originalColor;
      marker.content.glyphColor = null;
    }
  },
};

function createAndAddMarker(place, map, markerCallbacks) {
  if (!place.geometry || !place.geometry.location) return null;

  const pin = new google.maps.marker.PinElement({
    background: place.icon_background_color || null,
    borderColor: place.icon_background_color || null,
    glyphSrc: place.icon_mask_base_uri
      ? new URL(String(place.icon_mask_base_uri))
      : undefined,
  });

  const marker = new google.maps.marker.AdvancedMarkerElement({
    map: map,
    position: place.geometry.location,
    title: place.name,
    gmpClickable: true,
  });

  marker.element.id = `place_marker${place.place_id}`;
  marker.originalColor = place.icon_background_color;
  marker.append(pin);

  marker.addEventListener("gmp-click", () => {
    if (map && place.geometry && place.geometry.location) {
      const currentBounds = map.getBounds();
      const currentZoom = map.getZoom();
      const isInBounds =
        currentBounds && currentBounds.contains(place.geometry.location);

      if (!(isInBounds && currentZoom >= 18)) {
        map.setCenter(place.geometry.location);
        map.setZoom(18);
        map.setTilt(45);
      }
    }
    showPlaceDetails(place, map);
  });

  marker.element.addEventListener("mouseenter", () => {
    markerCallbacks.onMouseEnter(place.place_id);
  });

  marker.element.addEventListener("mouseleave", () => {
    markerCallbacks.onMouseLeave(place.place_id);
  });

  placesMarkers.push(marker);
  return marker;
}

export async function executeMapCommand(
  functionName,
  args,
  map,
  geocoder,
  panorama,
  directionsService,
  elevationService
) {
  console.log(`Executing tool: ${functionName}`, args);

  if (functionName === "panToLocation") {
    if (!geocoder) return "Error: Geocoder not ready or initialized.";

    try {
      const { results } = await geocoder.geocode({
        address: args.locationName,
      });
      if (results && results[0]) {
        const location = results[0].geometry.location;
        map.panTo(location);
        updatePanoramaIfVisible(map, panorama);
        return `Successfully executed map.panTo() to move map to ${args.locationName}`;
      } else {
        return `Error: Could not find location '${args.locationName}'. Please check the spelling.`;
      }
    } catch (e) {
      console.error("Geocoding failed", e);
      return `Error: Geocoding failed for '${args.locationName}'. Reason: ${e.message}`;
    }
  } else if (functionName === "panToCoordinates") {
    if (!map) return "Error: Map not initialized.";
    const latLng = { lat: args.lat, lng: args.lng };
    map.panTo(latLng);
    updatePanoramaIfVisible(map, panorama);
    return `Successfully executed map.panTo() to move map to coordinates: ${args.lat}, ${args.lng}`;
  } else if (functionName === "setCenter") {
    if (!map) return "Error: Map not initialized.";
    const latLng = { lat: args.lat, lng: args.lng };
    map.setCenter(latLng);
    updatePanoramaIfVisible(map, panorama);
    return `Successfully executed map.setCenter() with coordinates: ${args.lat}, ${args.lng}`;
  } else if (functionName === "panToBounds") {
    if (!map) return "Error: Map not initialized.";

    const bounds = {
      south: args.south,
      west: args.west,
      north: args.north,
      east: args.east,
    };

    const padding = args.padding || 0;

    map.panToBounds(bounds, padding);
    // Note: panToBounds updates center asynchronously/internally,
    // we call updatePanoramaIfVisible after the call.
    updatePanoramaIfVisible(map, panorama);
    return `Successfully executed map.panToBounds() with bounds: [${bounds.south}, ${bounds.west}, ${bounds.north}, ${bounds.east}] and padding: ${padding}`;
  } else if (functionName === "panBy") {
    if (!map) return "Error: Map not initialized.";
    map.panBy(args.x, args.y);
    updatePanoramaIfVisible(map, panorama);
    return `Successfully executed map.panBy(${args.x}, ${args.y})`;
  } else if (functionName === "setHeading") {
    if (!map) return "Error: Map not initialized.";
    map.setHeading(args.heading);
    return `Successfully executed map.setHeading(${args.heading})`;
  } else if (functionName === "setTilt") {
    if (!map) return "Error: Map not initialized.";
    map.setTilt(args.tilt);
    return `Successfully executed map.setTilt(${args.tilt})`;
  } else if (functionName === "setMapTypeId") {
    if (!map) return "Error: Map not initialized.";
    const validTypes = ["roadmap", "satellite", "hybrid", "terrain"];
    if (!validTypes.includes(args.mapTypeId)) {
      return `Error: Invalid map type '${args.mapTypeId}'. Valid types are: ${validTypes.join(", ")}.`;
    }
    map.setMapTypeId(args.mapTypeId);
    return `Successfully executed map.setMapTypeId('${args.mapTypeId}')`;
  } else if (functionName === "zoomInMap") {
    if (!map) return "Error: Map not initialized.";
    const safeArgs = args || {};
    const currentZoom = map.getZoom();
    const newZoom =
      safeArgs.level !== undefined ? safeArgs.level : currentZoom + 1;
    map.setZoom(newZoom);
    return `Successfully executed zoomInMap. New zoom level: ${newZoom}`;
  } else if (functionName === "zoomOutMap") {
    if (!map) return "Error: Map not initialized.";
    const safeArgs = args || {};
    const currentZoom = map.getZoom();
    const newZoom =
      safeArgs.level !== undefined ? safeArgs.level : currentZoom - 1;
    map.setZoom(newZoom);
    return `Successfully executed zoomOutMap. New zoom level: ${newZoom}`;
  } else if (functionName === "getMapZoom") {
    if (!map) return "Error: Map not initialized.";
    const zoom = map.getZoom();
    return `Current map zoom level is ${zoom}.`;
  } else if (functionName === "showTraffic") {
    if (!map) return "Error: Map not initialized.";
    if (!trafficLayer) {
      trafficLayer = new google.maps.TrafficLayer();
    }
    trafficLayer.setMap(map);
    return "Traffic layer displayed.";
  } else if (functionName === "hideTraffic") {
    if (!map) return "Error: Map not initialized.";
    if (trafficLayer) {
      trafficLayer.setMap(null);
    }
    return "Traffic layer hidden.";
  } else if (functionName === "showTransit") {
    if (!map) return "Error: Map not initialized.";
    if (!transitLayer) {
      transitLayer = new google.maps.TransitLayer();
    }
    transitLayer.setMap(map);
    return "Transit layer displayed.";
  } else if (functionName === "hideTransit") {
    if (!map) return "Error: Map not initialized.";
    if (transitLayer) {
      transitLayer.setMap(null);
    }
    return "Transit layer hidden.";
  } else if (functionName === "showStreetView") {
    if (!panorama) return "Error: Street View not initialized.";

    document.getElementById("map-container").classList.add("split-view");

    // Collapse all panels when entering Street View
    const panels = ["places-panel", "weather-panel", "travel-panel"];
    panels.forEach((id) => {
      const panel = document.getElementById(id);
      if (panel && panel.collapse) {
        panel.collapse();
      }
    });

    panorama.setPosition(map.getCenter());
    panorama.setPov({
      heading: map.getHeading() || 0,
      pitch: 0,
    });
    panorama.setVisible(true);
    map.setStreetView(panorama);

    setTimeout(() => {
      google.maps.event.trigger(map, "resize");
    }, 550);

    return "Successfully showed Street View in split mode.";
  } else if (functionName === "hideStreetView") {
    if (!panorama) return "Error: Street View not initialized.";

    document.getElementById("map-container").classList.remove("split-view");
    panorama.setVisible(false);

    setTimeout(() => {
      google.maps.event.trigger(map, "resize");
    }, 550);

    return "Successfully hidden Street View.";
  } else if (functionName === "setStreetViewPov") {
    if (!panorama || !panorama.getVisible()) {
      return "Error: Street View is not currently visible. Show it first.";
    }

    const currentPov = panorama.getPov();
    const newPov = {
      heading: args.heading !== undefined ? args.heading : currentPov.heading,
      pitch: args.pitch !== undefined ? args.pitch : currentPov.pitch,
    };

    panorama.setPov(newPov);
    return `Successfully executed panorama.setPov() with heading: ${newPov.heading}, pitch: ${newPov.pitch}`;
  } else if (functionName === "navigateStreetView") {
    if (!panorama || !panorama.getVisible()) {
      return "Error: Street View is not currently visible. Show it first.";
    }

    const direction = args.direction.toLowerCase();
    const panoDiv = document.getElementById("pano");

    // Find the container for link arrows
    // Look for divs ending with 'sv-links-control'
    const linkControls = Array.from(panoDiv.querySelectorAll("div")).filter(
      (el) => el.className.includes("sv-links-control")
    );

    if (linkControls.length === 0) {
      return "Error: Could not find Street View navigation controls (sv-links-control).";
    }

    // Usually the last one found is the active overlay
    const container = linkControls[linkControls.length - 1];

    // Find all paths
    const paths = Array.from(container.querySelectorAll("path"));

    const targetPath = paths.find((path) => {
      const label = path.getAttribute("aria-label");
      return label && label.toLowerCase().includes(direction);
    });

    if (targetPath) {
      // Dispatch click to simulate navigation
      const event = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      targetPath.dispatchEvent(event);
      return `Successfully simulated click to move ${direction}.`;
    } else {
      return `Error: Unable to move ${direction}. The navigation arrow for '${direction}' was not found in the current view. Please inform the user that they cannot move in that direction here.`;
    }
  } else if (functionName === "lookAroundStreetView") {
    if (!panorama || !panorama.getVisible()) {
      return "Error: Street View is not currently visible. Show it first.";
    }

    const panoDiv = document.getElementById("pano");

    const rect = panoDiv.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    let endX = startX;
    let endY = startY;
    const delta = 200; // Pixels to drag

    const direction = args.direction.toLowerCase();

    if (direction === "left") endX += delta;
    else if (direction === "right") endX -= delta;
    else if (direction === "up") endY += delta;
    else if (direction === "down") endY -= delta;
    else return "Error: Invalid direction. Use left, right, up, or down.";

    const targetElement = panoDiv.querySelector("canvas") || panoDiv;
    simulateDrag(targetElement, startX, startY, endX, endY);

    return `Successfully simulated mouse drag to look ${direction}.`;
  }

  // --- Places Tools ---
  else if (functionName === "searchPlaces") {
    if (!google.maps.places) return "Error: Places library not loaded.";

    try {
      const request = {
        textQuery: args.query,
        fields: [
          "id",
          "displayName",
          "formattedAddress",
          "location",
          "rating",
          "photos",
          "svgIconMaskURI",
          "iconBackgroundColor",
        ],
      };

      if (args.biasTowardsMapCenter && map) {
        request.locationBias = map.getCenter();
      }

      const { places } = await google.maps.places.Place.searchByText(request);

      if (places && places.length > 0) {
        // Filter results based on maxResults and minResults
        let filteredResults = places;
        if (args.maxResults !== undefined) {
          filteredResults = filteredResults.slice(0, args.maxResults);
        }

        if (
          args.minResults !== undefined &&
          filteredResults.length < args.minResults
        ) {
          console.warn(
            `Only found ${filteredResults.length} results, which is less than the requested minimum of ${args.minResults}.`
          );
        }

        // Adapt new Place objects to the structure expected by downstream code
        const adaptedResults = filteredResults.map(adaptPlaceResult);

        // Clear old markers
        clearPlacesMarkers();

        // Update Side Panel
        closeAllPanels();
        updatePlacesPanel(adaptedResults, map, markerCallbacks);

        // Add new markers
        const bounds = new google.maps.LatLngBounds();
        adaptedResults.forEach((place) => {
          if (place.geometry && place.geometry.location) {
            createAndAddMarker(place, map, markerCallbacks);
            bounds.extend(place.geometry.location);
          }
        });

        if (map && !args.biasTowardsMapCenter) {
          // Only adjust bounds if we didn't strictly bias to current view
          map.fitBounds(bounds, /* padding= */ 100);
        }

        const summary = adaptedResults
          .map((p) => `${p.name} (${p.rating}★) - ${p.formatted_address}`)
          .join("\n");
        return `Found ${adaptedResults.length} places. Results:\n${summary}`;
      } else {
        return "No places found.";
      }
    } catch (error) {
      return `Error searching for places: ${error.message}`;
    }
  } else if (functionName === "searchNearby") {
    if (!google.maps.places) return "Error: Places library not loaded.";

    try {
      const request = {
        fields: [
          "id",
          "displayName",
          "formattedAddress",
          "location",
          "rating",
          "photos",
          "svgIconMaskURI",
          "iconBackgroundColor",
        ],
        locationRestriction: {
          center: map.getCenter(),
          radius: args.radius,
        },
      };

      if (args.includedTypes) request.includedTypes = args.includedTypes;
      if (args.excludedTypes) request.excludedTypes = args.excludedTypes;
      if (args.maxResultCount) request.maxResultCount = args.maxResultCount;
      if (args.rankPreference) {
        request.rankPreference =
          google.maps.places.SearchNearbyRankPreference[args.rankPreference];
      }

      const { places } = await google.maps.places.Place.searchNearby(request);

      if (places && places.length > 0) {
        const adaptedResults = places.map(adaptPlaceResult);

        clearPlacesMarkers();
        closeAllPanels();
        updatePlacesPanel(adaptedResults, map, markerCallbacks);

        const bounds = new google.maps.LatLngBounds();
        adaptedResults.forEach((place) => {
          if (place.geometry && place.geometry.location) {
            createAndAddMarker(place, map, markerCallbacks);
            bounds.extend(place.geometry.location);
          }
        });

        if (map) {
          map.fitBounds(bounds, 100);
        }

        const summary = adaptedResults
          .map((p) => `${p.name} (${p.rating}★) - ${p.formatted_address}`)
          .join("\n");
        return `Found ${adaptedResults.length} places nearby. Results:\n${summary}`;
      } else {
        return "No places found nearby.";
      }
    } catch (error) {
      return `Error searching nearby: ${error.message}`;
    }
  } else if (functionName === "getPlaceDetailsByLocation") {
    if (!google.maps.places) return "Error: Places library not loaded.";

    try {
      const request = {
        textQuery: args.location,
        fields: [
          "id",
          "displayName",
          "formattedAddress",
          "location",
          "rating",
          "photos",
          "svgIconMaskURI",
          "iconBackgroundColor",
        ],
      };

      if (args.biasTowardsMapCenter && map) {
        request.locationBias = map.getCenter();
      }

      const { places } = await google.maps.places.Place.searchByText(request);

      if (places && places.length > 0) {
        const p = places[0];
        const place = adaptPlaceResult(p);

        // Smart check for travel panel
        const travelPanel = document.getElementById("travel-panel");
        if (
          travelPanel &&
          travelPanel.style.display !== "none" &&
          travelPanel.showPlaceDetailsById
        ) {
          const foundInTravel = travelPanel.showPlaceDetailsById(
            place.place_id
          );
          if (foundInTravel) {
            if (map && place.geometry && place.geometry.location) {
              map.setCenter(place.geometry.location);
              map.setZoom(15);
            }
            return JSON.stringify(place, null, 2);
          }
        }

        const existingMarker = placesMarkers.find(
          (m) => m.element.id === `place_marker${place.place_id}`
        );

        if (existingMarker) {
          if (map && place.geometry && place.geometry.location) {
            map.setCenter(place.geometry.location);
            map.setZoom(18);
            map.setTilt(45);
          }
          closeAllPanels();
          showPlaceDetails(place, map);
          return JSON.stringify(place, null, 2);
        }

        // Update Side Panel with this single result (so back button works)
        closeAllPanels();
        updatePlacesPanel([place], map, markerCallbacks);

        // Show details immediately
        showPlaceDetails(place, map);

        // Add marker
        if (place.geometry && place.geometry.location) {
          createAndAddMarker(place, map, markerCallbacks);

          // Center map
          map.setCenter(place.geometry.location);
          map.setZoom(18);
          map.setTilt(45);
        }

        return JSON.stringify(place, null, 2);
      } else {
        return `Error finding place details for '${args.location}': No results found.`;
      }
    } catch (error) {
      return `Error finding place details for '${args.location}': ${error.message}`;
    }
  } else if (functionName === "getPlaceDetailsByPlaceId") {
    if (!google.maps.places) return "Error: Places library not loaded.";

    try {
      const place = new google.maps.places.Place({
        id: args.placeId,
      });

      const fields = [
        "displayName",
        "formattedAddress",
        "location",
        "rating",
        "nationalPhoneNumber",
      ];

      await place.fetchFields({ fields });

      const result = {
        displayName: place.displayName,
        formattedAddress: place.formattedAddress,
        location: place.location,
        rating: place.rating,
        nationalPhoneNumber: place.nationalPhoneNumber,
      };

      if (result.location && map) {
        map.panTo(result.location);
      }

      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error getting place details: ${error.message}`;
    }
  } else if (functionName === "getDirections") {
    if (!directionsService) return "Error: DirectionsService not initialized.";

    // Initialize Renderer if needed (lazy init)
    if (!directionsRenderer && map) {
      // We need to access google namespace which is global
      directionsRenderer = new google.maps.DirectionsRenderer({ map: map });
    }

    return new Promise((resolve) => {
      directionsService.route(
        {
          origin: args.origin,
          destination: args.destination,
          travelMode: google.maps.TravelMode[args.travelMode || "DRIVING"],
        },
        (response, status) => {
          if (status === "OK") {
            if (directionsRenderer) {
              directionsRenderer.setDirections(response);
            }
            closeAllPanels();
            updateDirectionsPanel(response);
            const route = response.routes[0];
            const leg = route.legs[0];
            resolve(
              `Directions found: ${leg.distance.text} (${leg.duration.text}). Start at ${leg.start_address}, go to ${leg.end_address}.`
            );
          } else {
            resolve(`Directions request failed due to ${status}`);
          }
        }
      );
    });
  } else if (functionName === "getElevation") {
    if (!elevationService) return "Error: ElevationService not initialized.";

    return new Promise((resolve) => {
      const locations = [{ lat: args.lat, lng: args.lng }];
      elevationService.getElevationForLocations(
        { locations },
        (results, status) => {
          if (status === "OK" && results[0]) {
            resolve(
              `Elevation at ${args.lat}, ${args.lng} is ${results[0].elevation.toFixed(2)} meters.`
            );
          } else {
            resolve(`Elevation request failed: ${status}`);
          }
        }
      );
    });
  } else if (functionName === "getCurrentConditions") {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    let lat = args.lat;
    let lng = args.lng;

    if (args.location && (lat === undefined || lng === undefined)) {
      if (!geocoder) return "Error: Geocoder not initialized.";
      try {
        const { results } = await geocoder.geocode({ address: args.location });
        if (results && results[0]) {
          const loc = results[0].geometry.location;
          lat = loc.lat();
          lng = loc.lng();
        } else {
          return `Error: Could not find location '${args.location}'.`;
        }
      } catch (e) {
        return `Error geocoding location '${args.location}': ${e.message}`;
      }
    }

    if (lat === undefined || lng === undefined) {
      return "Error: Please provide a location name or coordinates.";
    }

    if (map) {
      map.panTo({ lat, lng });
    }

    const url = `/weather-api/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}`;

    console.log("Fetching weather from:", url);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        let errorMessage = `Error fetching weather: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch (e) {
          // If not JSON, use default error message
        }
        console.error("Weather API Error:", response.status, errorMessage);
        return errorMessage;
      }
      const data = await response.json();
      closeAllPanels();
      updateWeatherPanel(data);
      return `Current weather displayed: ${data.temperature.degrees} ${data.temperature.unit}, ${data.weatherCondition.description.text}.`;
    } catch (e) {
      console.error("Weather Fetch Exception:", e);
      return `Error fetching weather: ${e.message}`;
    }
  } else if (functionName === "getDailyForecast") {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    let lat = args.lat;
    let lng = args.lng;

    if (args.location && (lat === undefined || lng === undefined)) {
      if (!geocoder) return "Error: Geocoder not initialized.";
      try {
        const { results } = await geocoder.geocode({ address: args.location });
        if (results && results[0]) {
          const loc = results[0].geometry.location;
          lat = loc.lat();
          lng = loc.lng();
        } else {
          return `Error: Could not find location '${args.location}'.`;
        }
      } catch (e) {
        return `Error geocoding location '${args.location}': ${e.message}`;
      }
    }

    if (lat === undefined || lng === undefined) {
      return "Error: Please provide a location name or coordinates.";
    }

    if (map) {
      map.panTo({ lat, lng });
    }

    const url = `/weather-api/v1/forecast/days:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}`;

    console.log("Fetching forecast from:", url);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        let errorMessage = `Error fetching forecast: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch (e) {}
        console.error("Weather API Error:", response.status, errorMessage);
        return errorMessage;
      }
      const data = await response.json();
      closeAllPanels();
      updateForecastPanel(data);
      return `7-day forecast displayed for ${args.location || lat + "," + lng}.`;
    } catch (e) {
      console.error("Weather Fetch Exception:", e);
      return `Error fetching forecast: ${e.message}`;
    }
  } else if (functionName === "getTravelPlan") {
    try {
      const plan = await generateTravelItinerary(
        args.destination,
        args.days,
        args.preferences,
        args.startDate
      );

      // Center map on destination and fetch weather if applicable
      let weatherData = null;
      try {
        const { results } = await geocoder.geocode({
          address: plan.destination,
        });
        if (results && results[0]) {
          const loc = results[0].geometry.location;
          if (map) {
            map.panTo(loc);
            map.setZoom(12);
          }

          if (args.startDate) {
            const lat = loc.lat();
            const lng = loc.lng();
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            const url = `/weather-api/v1/forecast/days:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}`;
            const res = await fetch(url);
            if (res.ok) {
              weatherData = await res.json();
            }
          }
        }
      } catch (e) {
        console.warn("Failed to geocode destination", e);
      }

      // Enrich plan with real place data
      for (const day of plan.itinerary) {
        const enrichedPlaces = [];
        for (const placeName of day.places) {
          const request = {
            textQuery: `${placeName} in ${plan.destination}`,
            fields: [
              "id",
              "displayName",
              "formattedAddress",
              "location",
              "rating",
              "photos",
              "svgIconMaskURI",
              "iconBackgroundColor",
            ],
          };
          try {
            const { places } =
              await google.maps.places.Place.searchByText(request);
            if (places && places.length > 0) {
              enrichedPlaces.push(adaptPlaceResult(places[0]));
            }
          } catch (e) {
            console.warn(`Could not find place: ${placeName}`, e);
          }
        }
        day.places = enrichedPlaces;
      }

      closeAllPanels();
      updateTravelPanel(
        plan,
        (selectedDay) => {
          clearPlacesMarkers();
          const bounds = new google.maps.LatLngBounds();
          selectedDay.places.forEach((place) => {
            createAndAddMarker(place, map, markerCallbacks);
            if (place.geometry && place.geometry.location) {
              bounds.extend(place.geometry.location);
            }
          });
          if (map && selectedDay.places.length > 0) {
            map.fitBounds(bounds, 100);
          }
        },
        weatherData,
        map,
        markerCallbacks
      );

      return `Travel plan for ${args.days} days in ${args.destination} has been generated and displayed in the travel panel.`;
    } catch (error) {
      console.error("Travel Plan Error:", error);
      return `Error generating travel plan: ${error.message}`;
    }
  } else if (functionName === "showTravelDay") {
    const travelPanel = document.getElementById("travel-panel");
    if (
      travelPanel &&
      travelPanel.style.display !== "none" &&
      travelPanel.showDay
    ) {
      const success = travelPanel.showDay(args.dayNumber);
      if (success) {
        return `Now showing Day ${args.dayNumber} of your travel plan.`;
      } else {
        return `Error: Day ${args.dayNumber} not found in the current travel plan.`;
      }
    }
    return "Error: Travel plan is not currently open. Please generate a plan first.";
  } else if (functionName === "closeWeatherInfo") {
    const panel = document.getElementById("weather-panel");
    if (panel) {
      panel.style.display = "none";
      return "Weather panel closed.";
    }
    return "Weather panel is not open.";
  } else if (functionName === "clearMarkers") {
    clearPlacesMarkers();
    if (directionsRenderer) {
      directionsRenderer.setMap(null);
      directionsRenderer = null;
    }
    if (trafficLayer) {
      trafficLayer.setMap(null);
    }
    if (transitLayer) {
      transitLayer.setMap(null);
    }

    // Close all panels
    const panels = ["places-panel", "weather-panel", "travel-panel"];
    panels.forEach((id) => {
      const panel = document.getElementById(id);
      if (panel) panel.style.display = "none";
    });

    return "Successfully cleared all markers, directions, traffic, transit layers, and closed all information panels.";
  }

  return `Error: Unknown tool command '${functionName}'.`;
}
