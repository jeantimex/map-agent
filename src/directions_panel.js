export function createDirectionsPanel() {
  const panel = document.createElement("div");
  panel.id = "directions-panel";
  panel.style.display = "none";
  panel.innerHTML = `
    <div class="panel-header">
      <div style="display:flex; align-items:center;">
        <span id="directions-panel-title">Directions</span>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <button id="toggle-directions-panel" style="background:none; border:none; cursor:pointer; padding:0; display:flex; align-items:center;">
          <span class="material-symbols-outlined" style="font-size: 20px;">expand_less</span>
        </button>
        <button id="close-directions-panel" style="background:none; border:none; cursor:pointer; font-size:18px; display:flex; align-items:center; padding:0;">
          <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
        </button>
      </div>
    </div>
    <div id="directions-content" style="flex:1; overflow-y:auto;"></div>
  `;

  const content = panel.querySelector("#directions-content");
  const toggleBtn = panel.querySelector("#toggle-directions-panel");

  toggleBtn.addEventListener("click", () => {
    if (content.style.display === "none") {
      content.style.display = "block";
      toggleBtn.innerHTML =
        '<span class="material-symbols-outlined" style="font-size: 20px;">expand_less</span>';
    } else {
      content.style.display = "none";
      toggleBtn.innerHTML =
        '<span class="material-symbols-outlined" style="font-size: 20px;">expand_more</span>';
    }
  });

  panel
    .querySelector("#close-directions-panel")
    .addEventListener("click", () => {
      panel.style.display = "none";
    });

  panel.collapse = () => {
    if (content.style.display !== "none") {
      content.style.display = "none";
      toggleBtn.innerHTML =
        '<span class="material-symbols-outlined" style="font-size: 20px;">expand_more</span>';
    }
  };

  panel.expand = () => {
    content.style.display = "block";
    toggleBtn.innerHTML =
      '<span class="material-symbols-outlined" style="font-size: 20px;">expand_less</span>';
  };

  return panel;
}

export function updateDirectionsPanel(response) {
  const panel = document.getElementById("directions-panel");
  if (!panel) return;

  panel.style.display = "flex";
  if (panel.expand) panel.expand();

  const content = document.getElementById("directions-content");
  const title = document.getElementById("directions-panel-title");

  content.innerHTML = "";

  if (!response || !response.routes || response.routes.length === 0) {
    content.innerHTML =
      '<div style="padding: 15px;">No directions found.</div>';
    return;
  }

  const route = response.routes[0];
  const leg = route.legs[0];

  title.textContent = `${leg.distance.text} • ${leg.duration.text}`;

  const summary = document.createElement("div");
  summary.style.padding = "15px";
  summary.style.borderBottom = "1px solid #eee";
  summary.innerHTML = `
    <div style="font-weight: 500; font-size: 14px;">From: ${leg.start_address}</div>
    <div style="font-weight: 500; font-size: 14px;">To: ${leg.end_address}</div>
  `;
  content.appendChild(summary);

  const maneuverIcons = {
    "turn-slight-left": "turn_slight_left",
    "turn-sharp-left": "turn_left",
    "turn-left": "turn_left",
    "turn-slight-right": "turn_slight_right",
    "turn-right": "turn_right",
    "turn-sharp-right": "turn_right",
    "uturn-left": "u_turn_left",
    "uturn-right": "u_turn_right",
    straight: "straight",
    "ramp-left": "ramp_left",
    "ramp-right": "ramp_right",
    merge: "merge",
    "fork-left": "fork_left",
    "fork-right": "fork_right",
    ferry: "directions_ferry",
    "roundabout-left": "roundabout_left",
    "roundabout-right": "roundabout_right",
  };

  const stepsList = document.createElement("div");
  leg.steps.forEach((step, index) => {
    const item = document.createElement("div");
    item.style.padding = "12px 15px";
    item.style.borderBottom = "1px solid #f1f3f4";
    item.style.fontSize = "13px";
    item.style.display = "flex";
    item.style.gap = "12px";
    item.style.alignItems = "flex-start";

    const iconName = maneuverIcons[step.maneuver] || "navigation";

    item.innerHTML = `
      <div style="color: var(--text-secondary); min-width: 24px; display: flex; flex-direction: column; align-items: center; gap: 4px; padding-top: 2px;">
        <span class="material-symbols-outlined" style="font-size: 20px;">${iconName}</span>
        <div style="font-size: 10px; opacity: 0.7;">${index + 1}</div>
      </div>
      <div style="flex: 1;">
        <div style="line-height: 1.4;">${step.instructions}</div>
        <div style="color: var(--text-secondary); font-size: 11px; margin-top: 4px;">${step.distance.text}</div>
      </div>
    `;
    stepsList.appendChild(item);
  });
  content.appendChild(stepsList);
}
