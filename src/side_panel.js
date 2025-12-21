export function createSidePanel() {
  const panel = document.createElement("div");
  panel.id = "places-panel";
  panel.innerHTML = `
    <div class="panel-header">
      <span>Places Found</span>
      <button id="toggle-panel">▼</button>
    </div>
    <ul id="places-list"></ul>
  `;

  // Initially hidden
  panel.style.display = "none";

  // Toggle functionality
  const toggleBtn = panel.querySelector("#toggle-panel");
  const list = panel.querySelector("#places-list");

  toggleBtn.addEventListener("click", () => {
    if (list.style.display === "none") {
      list.style.display = "block";
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
    panel.style.display = "block";
    list.innerHTML = "";

    places.forEach((place) => {
      const li = document.createElement("li");
      li.textContent = place.name;
      // Store place ID for potential future interactivity
      li.dataset.placeId = place.place_id;
      list.appendChild(li);
    });
  } else {
    panel.style.display = "none";
  }
}