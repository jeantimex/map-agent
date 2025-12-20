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
  const downEvent = new MouseEvent('mousedown', {
    clientX: startX,
    clientY: startY,
    bubbles: true,
    cancelable: true,
    view: window
  });
  element.dispatchEvent(downEvent);

  let currentStep = 0;

  const animateDrag = () => {
    currentStep++;
    const progress = currentStep / steps;
    const currentX = startX + (endX - startX) * progress;
    const currentY = startY + (endY - startY) * progress;

    // Mouse Move
    const moveEvent = new MouseEvent('mousemove', {
      clientX: currentX,
      clientY: currentY,
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(moveEvent);

    if (currentStep < steps) {
      setTimeout(animateDrag, stepTime);
    } else {
      // Mouse Up
      const upEvent = new MouseEvent('mouseup', {
        clientX: endX,
        clientY: endY,
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(upEvent);
    }
  };

  animateDrag();
}

export async function executeMapCommand(functionName, args, map, geocoder, panorama) {
  console.log(`Executing tool: ${functionName}`, args);

  if (functionName === "panToLocation") {
    if (!geocoder) return "Error: Geocoder not ready or initialized.";
    
    try {
      const { results } = await geocoder.geocode({ address: args.locationName });
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
  } 
  
  else if (functionName === "panToCoordinates") {
    if (!map) return "Error: Map not initialized.";
    const latLng = { lat: args.lat, lng: args.lng };
    map.panTo(latLng);
    updatePanoramaIfVisible(map, panorama);
    return `Successfully executed map.panTo() to move map to coordinates: ${args.lat}, ${args.lng}`;
  }

  else if (functionName === "setCenter") {
    if (!map) return "Error: Map not initialized.";
    const latLng = { lat: args.lat, lng: args.lng };
    map.setCenter(latLng);
    updatePanoramaIfVisible(map, panorama);
    return `Successfully executed map.setCenter() with coordinates: ${args.lat}, ${args.lng}`;
  }

  else if (functionName === "panToBounds") {
    if (!map) return "Error: Map not initialized.";
    
    const bounds = {
      south: args.south,
      west: args.west,
      north: args.north,
      east: args.east
    };
    
    const padding = args.padding || 0;
    
    map.panToBounds(bounds, padding);
    // Note: panToBounds updates center asynchronously/internally, 
    // we call updatePanoramaIfVisible after the call.
    updatePanoramaIfVisible(map, panorama);
    return `Successfully executed map.panToBounds() with bounds: [${bounds.south}, ${bounds.west}, ${bounds.north}, ${bounds.east}] and padding: ${padding}`;
  }

  else if (functionName === "panBy") {
    if (!map) return "Error: Map not initialized.";
    map.panBy(args.x, args.y);
    updatePanoramaIfVisible(map, panorama);
    return `Successfully executed map.panBy(${args.x}, ${args.y})`;
  }

  else if (functionName === "setHeading") {
    if (!map) return "Error: Map not initialized.";
    map.setHeading(args.heading);
    return `Successfully executed map.setHeading(${args.heading})`;
  }

  else if (functionName === "setTilt") {
    if (!map) return "Error: Map not initialized.";
    map.setTilt(args.tilt);
    return `Successfully executed map.setTilt(${args.tilt})`;
  }

  else if (functionName === "setMapTypeId") {
    if (!map) return "Error: Map not initialized.";
    const validTypes = ['roadmap', 'satellite', 'hybrid', 'terrain'];
    if (!validTypes.includes(args.mapTypeId)) {
        return `Error: Invalid map type '${args.mapTypeId}'. Valid types are: ${validTypes.join(', ')}.`;
    }
    map.setMapTypeId(args.mapTypeId);
    return `Successfully executed map.setMapTypeId('${args.mapTypeId}')`;
  }
  
  else if (functionName === "zoomMap") {
    if (!map) return "Error: Map not initialized.";
    map.setZoom(args.level);
    return `Successfully executed map.setZoom(${args.level})`;
  }

  else if (functionName === "showStreetView") {
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
  }

  else if (functionName === "hideStreetView") {
    if (!panorama) return "Error: Street View not initialized.";
    
    document.getElementById("map-container").classList.remove("split-view");
    panorama.setVisible(false);
    
    setTimeout(() => {
        google.maps.event.trigger(map, "resize");
    }, 550);

    return "Successfully hidden Street View.";
  }

  else if (functionName === "setStreetViewPov") {
    if (!panorama || !panorama.getVisible()) {
        return "Error: Street View is not currently visible. Show it first.";
    }
    
    const currentPov = panorama.getPov();
    const newPov = {
      heading: (args.heading !== undefined) ? args.heading : currentPov.heading,
      pitch: (args.pitch !== undefined) ? args.pitch : currentPov.pitch,
    };
    
    panorama.setPov(newPov);
    return `Successfully executed panorama.setPov() with heading: ${newPov.heading}, pitch: ${newPov.pitch}`;
  }

  else if (functionName === "navigateStreetView") {
    if (!panorama || !panorama.getVisible()) {
        return "Error: Street View is not currently visible. Show it first.";
    }

    const direction = args.direction.toLowerCase();
    const panoDiv = document.getElementById("pano");
    
    // Find the container for link arrows
    // Look for divs ending with 'sv-links-control'
    const linkControls = Array.from(panoDiv.querySelectorAll('div')).filter(el => 
        el.className.includes('sv-links-control')
    );
    
    if (linkControls.length === 0) {
        return "Error: Could not find Street View navigation controls (sv-links-control).";
    }

    // Usually the last one found is the active overlay
    const container = linkControls[linkControls.length - 1];
    
    // Find all paths
    const paths = Array.from(container.querySelectorAll('path'));
    
    const targetPath = paths.find(path => {
        const label = path.getAttribute('aria-label');
        return label && label.toLowerCase().includes(direction);
    });

    if (targetPath) {
        // Dispatch click to simulate navigation
        const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        targetPath.dispatchEvent(event);
        return `Successfully simulated click to move ${direction}.`;
    } else {
        return `Error: Unable to move ${direction}. The navigation arrow for '${direction}' was not found in the current view. Please inform the user that they cannot move in that direction here.`;
    }
  }

  else if (functionName === "lookAroundStreetView") {
    if (!panorama || !panorama.getVisible()) {
        return "Error: Street View is not currently visible. Show it first.";
    }

    const panoDiv = document.getElementById("pano");
    // We need a specific element to dispatch events to. The canvas usually captures them.
    // However, dispatching to the container usually bubbles down or is captured if we are lucky,
    // but Google Maps events often listen on the widget container.
    // Let's try finding the widget canvas or the container itself.
    // A safe bet is the 'widget-scene-canvas' or just the #pano div if it captures bubbles.
    // Let's inspect: usually there is a canvas inside.
    
    const rect = panoDiv.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    
    let endX = startX;
    let endY = startY;
    const delta = 200; // Pixels to drag

    // To look LEFT, we drag the scene RIGHT (positive X)
    // To look RIGHT, we drag the scene LEFT (negative X)
    // To look UP, we drag the scene DOWN (positive Y)
    // To look DOWN, we drag the scene UP (negative Y)
    
    const direction = args.direction.toLowerCase();
    
    if (direction === "left") endX += delta;
    else if (direction === "right") endX -= delta;
    else if (direction === "up") endY += delta;
    else if (direction === "down") endY -= delta;
    else return "Error: Invalid direction. Use left, right, up, or down.";

    // Target the canvas if possible, otherwise the div
    const targetElement = panoDiv.querySelector('canvas') || panoDiv;

    simulateDrag(targetElement, startX, startY, endX, endY);
    
    return `Successfully simulated mouse drag to look ${direction}.`;
  }
  
  return `Error: Unknown tool command '${functionName}'.`;
}
