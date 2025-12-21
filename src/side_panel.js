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
    toggleBtn.textContent = "▼";
    
    // Update state
    activeView = list;
  });
  
  // ... (inside updatePlacesPanel) ...
  // ensure we capture the state change when switching to details
  // We need to expose a way to update `activeView` or handle it inside.
  // Since `updatePlacesPanel` is outside, we can attach the logic to the element or move `activeView` scope.
  // Ideally, `createSidePanel` should handle the view switching logic internally or expose methods.
  
  // Let's attach the state to the panel element for simplicity in this refactor
  panel.setActiveView = (viewName) => {
      if (viewName === 'details') {
          activeView = details;
      } else {
          activeView = list;
      }
  };

  return panel;
}

export function updatePlacesPanel(places) {
  const panel = document.getElementById("places-panel");
  const list = document.getElementById("places-list");
  const details = document.getElementById("place-details");
  const backBtn = document.getElementById("back-to-list");
  const title = document.getElementById("panel-title");
  const toggleBtn = document.getElementById("toggle-panel");

  if (!panel || !list) return;

  // Reset view to list
  details.style.display = "none";
  backBtn.style.display = "none";
  title.textContent = "Places Found";
  if (panel.setActiveView) panel.setActiveView('list');

  if (places && places.length > 0) {
    panel.style.display = "flex";
    list.style.display = "flex";
    toggleBtn.textContent = "▼";
    list.innerHTML = "";

    places.forEach((place) => {
      // ... (create item) ...
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
        showPlaceDetails(place);
      });

      list.appendChild(item);
    });
  } else {
    panel.style.display = "none";
  }

  function showPlaceDetails(place) {
    list.style.display = "none";
    details.style.display = "block";
    backBtn.style.display = "flex";
    title.textContent = place.name;
    
    // Update active view state
    if (panel.setActiveView) panel.setActiveView('details');

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
