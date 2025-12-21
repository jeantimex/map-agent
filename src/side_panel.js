export function createSidePanel() {
  const panel = document.createElement("div");
  panel.id = "places-panel";
  panel.innerHTML = `
    <div class="panel-header">
      <span>Places Found</span>
      <button id="toggle-panel">▼</button>
    </div>
    <div id="places-list"></div>
  `;

  // Initially hidden
  panel.style.display = "none";

  // Toggle functionality
  const toggleBtn = panel.querySelector("#toggle-panel");
  const list = panel.querySelector("#places-list");

  toggleBtn.addEventListener("click", () => {
    if (list.style.display === "none") {
      list.style.display = "flex";
      toggleBtn.textContent = "▼";
    } else {
      list.style.display = "none";
      toggleBtn.textContent = "▲";
    }
  });

  return panel;
}

export function updatePlacesPanel(places) {
  const panel = document.getElementById("places-panel");
  const list = document.getElementById("places-list");

  if (!panel || !list) return;

  if (places && places.length > 0) {
    panel.style.display = "flex";
    list.innerHTML = "";

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

      // Store place ID for potential future interactivity
      item.dataset.placeId = place.place_id;
      list.appendChild(item);
    });
  } else {
    panel.style.display = "none";
  }
}