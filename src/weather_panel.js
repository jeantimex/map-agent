import * as d3 from "d3";

export function createWeatherPanel() {
  const panel = document.createElement("div");
  panel.id = "weather-panel";
  panel.style.display = "none";
  panel.innerHTML = `
    <div class="panel-header">
      <span id="weather-panel-title">Weather</span>
      <button id="close-weather-panel" style="background:none; border:none; cursor:pointer; font-size:18px;">×</button>
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
