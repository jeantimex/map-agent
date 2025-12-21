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
// Global markers array to clear previous search results
let placesMarkers = [];
// Global info window for places
let placesInfoWindow = null;

function clearPlacesMarkers() {
  placesMarkers.forEach((m) => m.setMap(null));
  placesMarkers = [];
  if (placesInfoWindow) {
    placesInfoWindow.close();
  }
}

export async function executeMapCommand(
  functionName,
  args,
  map,
  geocoder,
  panorama,
  placesService,
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
  } else if (functionName === "showStreetView") {
    if (!panorama) return "Error: Street View not initialized.";

    document.getElementById("map-container").classList.add("split-view");

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
    if (!placesService) return "Error: PlacesService not initialized.";

    // Initialize InfoWindow if needed
    if (!placesInfoWindow) {
      placesInfoWindow = new google.maps.InfoWindow();
    }

    return new Promise((resolve) => {
      const request = {
        query: args.query,
        fields: [
          "name",
          "display_name",
          "geometry",
          "formatted_address",
          "place_id",
          "rating",
          "photos",
          "icon_mask_base_uri",
          "icon_background_color",
        ],
      };

      if (args.biasTowardsMapCenter && map) {
        request.location = map.getCenter();
        if (args.radius) request.radius = args.radius;
      }

      placesService.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // Filter results based on maxResults and minResults
          let filteredResults = results;
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

          // Clear old markers
          clearPlacesMarkers();

          // Add new markers
          const bounds = new google.maps.LatLngBounds();
          filteredResults.forEach((place) => {
            if (place.geometry && place.geometry.location) {
              const pin = new google.maps.marker.PinElement({
                background: place.icon_background_color,
                glyphSrc: place.icon_mask_base_uri
                  ? new URL(String(place.icon_mask_base_uri) + ".png")
                  : undefined,
              });
              const marker = new google.maps.marker.AdvancedMarkerElement({
                map: map,
                position: place.geometry.location,
                title: place.name,
                gmpClickable: true,
              });
              marker.append(pin);

              // Add click listener for InfoWindow
              marker.addEventListener("gmp-click", () => {
                const content = `
                                <gmp-place-details-compact orientation="horizontal" truncation-preferred slot="control-block-start-inline-center">
                                  <gmp-place-details-place-request place="${place.place_id}"></gmp-place-details-place-request>
                                  <gmp-place-content-config>
                                      <gmp-place-media lightbox-preferred></gmp-place-media>
                                      <gmp-place-rating></gmp-place-rating>
                                      <gmp-place-type></gmp-place-type>
                                      <gmp-place-price></gmp-place-price>
                                      <gmp-place-accessible-entrance-icon></gmp-place-accessible-entrance-icon>
                                      <gmp-place-open-now-status></gmp-place-open-now-status>
                                      <gmp-place-attribution light-scheme-color="gray" dark-scheme-color="white"></gmp-place-attribution>
                                  </gmp-place-content-config>
                                </gmp-place-details-compact>
                            `;
                placesInfoWindow.setContent(content);
                placesInfoWindow.open(map, marker);
              });

              placesMarkers.push(marker);
              bounds.extend(place.geometry.location);
            }
          });

          if (map && !args.biasTowardsMapCenter) {
            // Only adjust bounds if we didn't strictly bias to current view
            map.fitBounds(bounds);
          }

          const summary = filteredResults
            .map((p) => `${p.name} (${p.rating}★) - ${p.formatted_address}`)
            .join("\n");
          resolve(
            `Found ${filteredResults.length} places. Results:\n${summary}`
          );
        } else {
          resolve(`No places found or error: ${status}`);
        }
      });
    });
  } else if (functionName === "getPlaceDetails") {
    if (!placesService) return "Error: PlacesService not initialized.";

    return new Promise((resolve) => {
      const request = {
        placeId: args.placeId,
        fields: args.fields || [
          "name",
          "formatted_address",
          "geometry",
          "rating",
          "formatted_phone_number",
        ],
      };

      placesService.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          if (place.geometry && place.geometry.location && map) {
            map.panTo(place.geometry.location);
            // Marker creation removed to avoid forced pinning.
            // Use searchPlaces if you want markers.
          }
          resolve(JSON.stringify(place, null, 2));
        } else {
          resolve(`Error getting place details: ${status}`);
        }
      });
    });
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
  } else if (functionName === "clearMarkers") {
    clearPlacesMarkers();
    if (directionsRenderer) {
      directionsRenderer.setMap(null);
      directionsRenderer = null;
    }
    return "Successfully cleared all markers and directions from the map.";
  }

  return `Error: Unknown tool command '${functionName}'.`;
}
