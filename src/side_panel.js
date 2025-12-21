export function createSidePanel() {
  const panel = document.createElement("div");
  panel.id = "places-panel";
  panel.innerHTML = `
    <div class="panel-header">
      <div style="display: flex; align-items: center;">
        <button id="back-to-list" style="display: none; margin-right: 8px; background: none; border: none; cursor: pointer; font-size: 18px; padding: 0;">
          <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
        </button>
        <span id="panel-title">Places Found</span>
        <span id="places-count" style="margin-left: 8px; background-color: var(--primary-color); color: white; border-radius: 12px; padding: 2px 8px; font-size: 12px; font-weight: bold; display: none;"></span>
      </div>
      <button id="toggle-panel">▼</button>
    </div>
    <div id="places-list"></div>
    <div id="place-details" style="display: none;"></div>
  `;

  // Initially hidden
  panel.style.display = "none";

  // Toggle functionality
  const toggleBtn = panel.querySelector("#toggle-panel");
  const list = panel.querySelector("#places-list");
  const details = panel.querySelector("#place-details");
  const backBtn = panel.querySelector("#back-to-list");
  const title = panel.querySelector("#panel-title");
  const count = panel.querySelector("#places-count");

  // Track the currently active view (list or details)
  let activeView = list;

  toggleBtn.addEventListener("click", () => {
    // If the active view is currently hidden, show it (Expand)
    if (activeView.style.display === "none") {
      activeView.style.display = activeView === list ? "flex" : "block";
      toggleBtn.textContent = "▼";
    } else {
      // Otherwise, hide it (Collapse)
      activeView.style.display = "none";
      toggleBtn.textContent = "▲";
    }
  });

  // Back button functionality
  backBtn.addEventListener("click", () => {
    details.style.display = "none";
    list.style.display = "flex";
    backBtn.style.display = "none";
    title.textContent = "Places Found";
    count.style.display = "inline-block";
    toggleBtn.textContent = "▼";

    // Update state
    activeView = list;

    // Fit bounds to show all places again, but only if they are not already visible
    if (panel.placesData && panel.placesData.length > 0 && panel.mapInstance) {
      const bounds = new google.maps.LatLngBounds();
      const currentBounds = panel.mapInstance.getBounds();
      let allInBounds = true;

      panel.placesData.forEach((p) => {
        if (p.geometry && p.geometry.location) {
          bounds.extend(p.geometry.location);
          if (currentBounds && !currentBounds.contains(p.geometry.location)) {
            allInBounds = false;
          }
        }
      });

      // Only fit bounds if at least one place is outside or we don't have current bounds
      if (!allInBounds || !currentBounds) {
        panel.mapInstance.fitBounds(bounds, 100);
      }
    }
  });

  // ... (inside updatePlacesPanel) ...

  // Let's attach the state to the panel element for simplicity in this refactor
  panel.setActiveView = (viewName) => {
    if (viewName === "details") {
      activeView = details;
    } else {
      activeView = list;
    }
  };

  return panel;
}

export function showPlaceDetails(place) {
  const panel = document.getElementById("places-panel");
  const list = document.getElementById("places-list");
  const details = document.getElementById("place-details");
  const backBtn = document.getElementById("back-to-list");
  const title = document.getElementById("panel-title");
  const countBadge = document.getElementById("places-count");

  // Ensure panel is visible
  if (panel) panel.style.display = "flex";

  if (list) list.style.display = "none";
  if (details) details.style.display = "block";
  if (backBtn) backBtn.style.display = "flex";
  if (title) title.textContent = place.name;
  if (countBadge) countBadge.style.display = "none";

  // Update active view state (hacky access to panel property we set in createSidePanel)
  if (panel && panel.setActiveView) panel.setActiveView("details");

  if (details) {
    details.innerHTML = `
      <gmp-place-details>
        <gmp-place-details-place-request place="${place.place_id}"></gmp-place-details-place-request>
        <gmp-place-content-config>
          <gmp-place-address></gmp-place-address>
          <gmp-place-rating></gmp-place-rating>
          <gmp-place-type></gmp-place-type>
          <gmp-place-price></gmp-place-price>
          <gmp-place-accessible-entrance-icon></gmp-place-accessible-entrance-icon>
          <gmp-place-opening-hours></gmp-place-opening-hours>
          <gmp-place-website></gmp-place-website>
          <gmp-place-phone-number></gmp-place-phone-number>
          <gmp-place-summary></gmp-place-summary>
          <gmp-place-type-specific-highlights></gmp-place-type-specific-highlights>
          <gmp-place-reviews></gmp-place-reviews>
          <gmp-place-feature-list></gmp-place-feature-list>
          <gmp-place-media lightbox-preferred></gmp-place-media>
          <gmp-place-attribution light-scheme-color="gray" dark-scheme-color="white"></gmp-place-attribution>
        </gmp-place-content-config>
      </gmp-place-details>
    `;
  }
}

export function updatePlacesPanel(places, map) {
  const panel = document.getElementById("places-panel");

  // Store data for back button functionality
  if (panel) {
    panel.placesData = places;
    panel.mapInstance = map;
  }

  const list = document.getElementById("places-list");
  const details = document.getElementById("place-details");
  const backBtn = document.getElementById("back-to-list");
  const title = document.getElementById("panel-title");
  const countBadge = document.getElementById("places-count");
  const toggleBtn = document.getElementById("toggle-panel");

  if (!panel || !list) return;

  // Reset view to list
  details.style.display = "none";
  backBtn.style.display = "none";
  title.textContent = "Places Found";
  if (panel.setActiveView) panel.setActiveView("list");

  if (places && places.length > 0) {
    panel.style.display = "flex";
    list.style.display = "flex";
    toggleBtn.textContent = "▼";
    list.innerHTML = "";

    // Update count
    if (countBadge) {
      countBadge.textContent = places.length;
      countBadge.style.display = "inline-block";
    }

    places.forEach((place) => {
      const item = document.createElement("div");
      item.className = "place-item";
      item.innerHTML = `
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

      item.addEventListener("click", () => {
        // Center and zoom map on click, but only if not already visible at sufficient zoom
        if (map && place.geometry && place.geometry.location) {
          const currentBounds = map.getBounds();
          const currentZoom = map.getZoom();
          const isInBounds =
            currentBounds && currentBounds.contains(place.geometry.location);

          if (!(isInBounds && currentZoom >= 15)) {
            map.setCenter(place.geometry.location);
            map.setZoom(15);
          }
        }
        showPlaceDetails(place);
      });

      list.appendChild(item);
    });
  } else {
    panel.style.display = "none";
    if (countBadge) countBadge.style.display = "none";
  }
}
