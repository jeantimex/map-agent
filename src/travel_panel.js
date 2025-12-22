export function createTravelPanel() {
  const panel = document.createElement("div");
  panel.id = "travel-panel";
  panel.style.display = "none";
  panel.innerHTML = `
    <div class="panel-header">
      <div style="display:flex; align-items:center;">
        <button id="travel-back-btn" style="display:none; background:none; border:none; cursor:pointer; margin-right:8px; font-size:18px;">←</button>
        <span id="travel-panel-title">Trip Plan</span>
      </div>
      <button id="close-travel-panel" style="background:none; border:none; cursor:pointer; font-size:18px;">×</button>
    </div>
    <div id="travel-content" style="flex:1; overflow-y:auto;"></div>
  `;

  panel.querySelector("#close-travel-panel").addEventListener("click", () => {
    panel.style.display = "none";
  });

  return panel;
}

export function updateTravelPanel(plan, onDaySelect) {
  const panel = document.getElementById("travel-panel");
  if (!panel) return;
  panel.style.display = "flex";

  const content = document.getElementById("travel-content");
  const backBtn = document.getElementById("travel-back-btn");
  const title = document.getElementById("travel-panel-title");

  const stack = [];

  function pushView(renderFn) {
    stack.push(renderFn);
    updateBackButton();
  }

  function popView() {
    if (stack.length > 0) {
      const renderFn = stack.pop();
      renderFn();
    }
    updateBackButton();
  }

  function updateBackButton() {
    if (stack.length > 0) {
      backBtn.style.display = "block";
      backBtn.onclick = popView;
    } else {
      backBtn.style.display = "none";
    }
  }

  function renderDaysList() {
    content.innerHTML = "";
    title.textContent = `Trip to ${plan.destination}`;

    const summary = document.createElement("div");
    summary.style.padding = "15px";
    summary.innerHTML = `<p style="margin:0; font-size:14px; color:#555;">${plan.days} Days • ${plan.preferences || "No preferences"}</p>`;
    content.appendChild(summary);

    plan.itinerary.forEach((day, index) => {
      const card = document.createElement("div");
      card.className = "travel-day-card";
      card.style.cssText =
        "padding: 15px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s;";
      card.innerHTML = `
        <h3 style="margin: 0 0 5px; font-size: 16px;">Day ${day.day}: ${day.theme || "Explore"}</h3>
        <p style="margin: 0; color: #666; font-size: 13px;">${day.places.length} places</p>
        <p style="margin: 5px 0 0; font-size: 12px; color: #888;">${day.summary || ""}</p>
      `;

      card.onmouseover = () => (card.style.backgroundColor = "#f9f9f9");
      card.onmouseout = () => (card.style.backgroundColor = "transparent");

      card.addEventListener("click", () => {
        pushView(renderDaysList);
        renderDayDetails(day);
      });
      content.appendChild(card);
    });
  }

  function renderDayDetails(day) {
    content.innerHTML = "";
    title.textContent = `Day ${day.day}`;

    if (onDaySelect) {
      onDaySelect(day);
    }

    const list = document.createElement("div");
    day.places.forEach((place) => {
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
        pushView(() => renderDayDetails(day));
        renderPlaceDetails(place);
      });
      list.appendChild(item);
    });
    content.appendChild(list);
  }

  function renderPlaceDetails(place) {
    content.innerHTML = "";
    title.textContent = place.name;

    content.innerHTML = `
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

  stack.length = 0;
  updateBackButton();
  renderDaysList();
}
