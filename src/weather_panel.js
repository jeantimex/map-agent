import * as d3 from "d3";

export function createWeatherPanel() {
  const panel = document.createElement("div");
  panel.id = "weather-panel";
  panel.style.display = "none";
  panel.innerHTML = `
    <div class="panel-header">
      <span id="weather-panel-title">Weather</span>
      <button id="close-weather-panel" style="background:none; border:none; cursor:pointer; font-size:18px; display:flex; align-items:center; padding:0;">
        <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
      </button>
    </div>
    <div id="weather-content"></div>
    <div id="weather-chart" style="padding: 10px;"></div>
  `;

  panel.querySelector("#close-weather-panel").addEventListener("click", () => {
    panel.style.display = "none";
  });

  return panel;
}

export function updateWeatherPanel(data) {
  const panel = document.getElementById("weather-panel");
  if (!panel) return;

  panel.style.display = "flex";
  const content = document.getElementById("weather-content");
  const chartContainer = document.getElementById("weather-chart");
  const title = document.getElementById("weather-panel-title");

  // Clear previous
  content.innerHTML = "";
  chartContainer.innerHTML = "";

  if (!data) return;

  // Helper to format values
  const temp = data.temperature.degrees;
  const condition = data.weatherCondition.description.text;
  // iconBaseUri doesn't always include extension, sometimes needs size
  // Example: https://maps.gstatic.com/weather/v1/sunny
  // Usually appending .png or using as is if it's svg?
  // Let's assume we can append .png if needed, or check if it renders.
  // Actually, Google Weather icons often need size params or are just base paths.
  // Let's try appending ".png".
  const icon = data.weatherCondition.iconBaseUri + ".png"; 

  // Basic Info
  content.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px;">
      <div>
        <h2 style="margin: 0; font-size: 42px; font-weight: 300;">${temp}°</h2>
        <p style="margin: 5px 0 0; font-size: 16px; color: var(--text-secondary);">${condition}</p>
        <p style="margin: 0; font-size: 12px; color: var(--text-secondary);">Feels like ${data.feelsLikeTemperature.degrees}°</p>
      </div>
      <img src="${icon}" alt="${condition}" style="width: 80px; height: 80px;" onerror="this.style.display='none'">
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 0 15px 15px; font-size: 13px; color: var(--text-secondary);">
      <div style="display: flex; flex-direction: column;">
        <span style="font-weight: 500; color: var(--text-primary);">Humidity</span>
        <span>${data.relativeHumidity}%</span>
      </div>
      <div style="display: flex; flex-direction: column;">
        <span style="font-weight: 500; color: var(--text-primary);">Wind</span>
        <span>${data.wind.speed.value} ${data.wind.speed.unit === "KILOMETERS_PER_HOUR" ? "km/h" : data.wind.speed.unit}</span>
      </div>
      <div style="display: flex; flex-direction: column;">
        <span style="font-weight: 500; color: var(--text-primary);">UV Index</span>
        <span>${data.uvIndex}</span>
      </div>
      <div style="display: flex; flex-direction: column;">
        <span style="font-weight: 500; color: var(--text-primary);">Visibility</span>
        <span>${data.visibility.distance} km</span>
      </div>
    </div>
  `;

  // D3 Chart for Temperature Range (Min/Max vs Current)
  if (data.currentConditionsHistory) {
      const min = data.currentConditionsHistory.minTemperature.degrees;
      const max = data.currentConditionsHistory.maxTemperature.degrees;
      
      const width = 320; // Approx panel width
      const height = 60;
      const margin = { left: 20, right: 20, top: 20, bottom: 20 };
      
      const svg = d3.select(chartContainer)
        .append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`);

      // Scale
      // Ensure the domain covers min, max, and current with some padding
      const minVal = Math.min(min, temp);
      const maxVal = Math.max(max, temp);
      const padding = (maxVal - minVal) * 0.1 || 2; // Avoid 0 range

      const x = d3.scaleLinear()
        .domain([minVal - padding, maxVal + padding])
        .range([margin.left, width - margin.right]);

      // Draw background track
      svg.append("line")
         .attr("x1", x(min))
         .attr("x2", x(max))
         .attr("y1", height / 2)
         .attr("y2", height / 2)
         .attr("stroke", "#e0e0e0")
         .attr("stroke-width", 6)
         .attr("stroke-linecap", "round");

      // Draw colored range (Min to Max)
      // Gradient? Or just solid.
      svg.append("line")
         .attr("x1", x(min))
         .attr("x2", x(max))
         .attr("y1", height / 2)
         .attr("y2", height / 2)
         .attr("stroke", "url(#temp-gradient)")
         .attr("stroke-width", 6)
         .attr("stroke-linecap", "round");
      
      // Gradient definition
      const defs = svg.append("defs");
      const gradient = defs.append("linearGradient")
        .attr("id", "temp-gradient");
      
      gradient.append("stop").attr("offset", "0%").attr("stop-color", "#4285F4"); // Blue
      gradient.append("stop").attr("offset", "100%").attr("stop-color", "#EA4335"); // Red

      // Draw current temp dot
      svg.append("circle")
         .attr("cx", x(temp))
         .attr("cy", height / 2)
         .attr("r", 8)
         .attr("fill", "#fff")
         .attr("stroke", "#333")
         .attr("stroke-width", 2);

      // Labels
      // Min
      svg.append("text")
         .attr("x", x(min))
         .attr("y", height / 2 + 20)
         .attr("text-anchor", "middle")
         .text(`L:${min}°`)
         .style("font-size", "11px")
         .style("fill", "#666");

      // Max
      svg.append("text")
         .attr("x", x(max))
         .attr("y", height / 2 + 20)
         .attr("text-anchor", "middle")
         .text(`H:${max}°`)
         .style("font-size", "11px")
         .style("fill", "#666");
  }
}

export function updateForecastPanel(data) {
  const panel = document.getElementById("weather-panel");
  if (!panel) return;

  panel.style.display = "flex";
  const content = document.getElementById("weather-content");
  const chartContainer = document.getElementById("weather-chart");
  const title = document.getElementById("weather-panel-title");

  title.textContent = "Daily Forecast";
  content.innerHTML = "";
  chartContainer.innerHTML = "";

  if (!data || !data.forecastDays) return;

  const list = document.createElement("div");
  list.style.padding = "0 15px";

  data.forecastDays.forEach((day) => {
    const date = new Date(
      day.displayDate.year,
      day.displayDate.month - 1,
      day.displayDate.day
    );
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const dateStr = date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
    });
    const min = Math.round(day.minTemperature.degrees);
    const max = Math.round(day.maxTemperature.degrees);

    // Use daytimeForecast for the general summary
    const cond = day.daytimeForecast?.weatherCondition?.description?.text || "";
    const icon = day.daytimeForecast?.weatherCondition?.iconBaseUri
      ? day.daytimeForecast.weatherCondition.iconBaseUri + ".png"
      : "";
    const rain = day.daytimeForecast?.precipitation?.probability?.percent || 0;
    const humidity = day.daytimeForecast?.relativeHumidity || 0;

    const item = document.createElement("div");
    item.style.cssText =
      "display: grid; grid-template-columns: 50px 1fr 80px 60px; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f3f4; font-size: 13px;";
    item.innerHTML = `
        <div style="display:flex; flex-direction:column; line-height:1.2;">
            <span style="font-weight: 500;">${dayName}</span>
            <span style="color: var(--text-secondary); font-size: 11px;">${dateStr}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
           <img src="${icon}" style="width: 28px; height: 28px;" onerror="this.style.display='none'">
           <div style="display:flex; flex-direction:column; line-height:1.2;">
               <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px;">${cond}</span>
           </div>
        </div>
        <div style="display:flex; flex-direction:column; color: var(--text-secondary); font-size: 11px; line-height:1.3;">
            <span>💧 ${rain}%</span>
            <span>HUM: ${humidity}%</span>
        </div>
        <div style="text-align: right;">
           <span style="color: var(--text-secondary); margin-right: 4px;">${min}°</span>
           <span style="font-weight: 500;">${max}°</span>
        </div>
      `;
    list.appendChild(item);
  });

  content.appendChild(list);
}
