import geminiIcon from "./assets/gemini_icon.svg";

/**
 * Create an agent control for:
 *   1. displaying the heading and tilting of the map in realtime
 *   2. resetting the heading and tilting of the map on click
 */
export function createAgentControl(map) {
  const agentControl = document.createElement("button");
  agentControl.classList.add("agent-control");
  agentControl.title = "Map Agent";

  const agentIcon = document.createElement("img");
  agentIcon.src = geminiIcon;
  agentIcon.classList.add("agent-icon");
  agentControl.appendChild(agentIcon);

  let lastHeading = map.getHeading() || 0;
  let cumulativeRotation = lastHeading;
  let currentTilt = map.getTilt() || 0;

  const updateIconTransform = () => {
    // Combine rotation (Z-axis) and tilt (X-axis)
    agentIcon.style.transform = `rotateZ(${cumulativeRotation}deg) rotateX(${currentTilt}deg)`;
  };

  map.addListener("heading_changed", () => {
    const newHeading = map.getHeading() || 0;

    // Avoid rotation jump.
    let diff = newHeading - lastHeading;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;

    cumulativeRotation -= diff;
    lastHeading = newHeading;

    updateIconTransform();
  });

  // Listen for tilt changes
  map.addListener("tilt_changed", () => {
    currentTilt = map.getTilt() || 0;
    updateIconTransform();
  });

  // When the agent is clicked, toggle chat and reset map's heading and tilt
  agentControl.addEventListener("click", () => {
    const chatContainer = document.querySelector(".chat-container");
    chatContainer.classList.toggle("open");

    // Focus input if opening
    if (chatContainer.classList.contains("open")) {
      setTimeout(() => document.getElementById("chat-input").focus(), 300);
    }

    map.setHeading(0);
    map.setTilt(0);

    // 1. Calculate the nearest "North" (a multiple of 360)
    const targetRotation = Math.round(cumulativeRotation / 360) * 360;
    // 2. Animate to that target.
    agentIcon.style.transform = `rotate(${targetRotation}deg)`;
    // 3. Update the internal state
    cumulativeRotation = targetRotation;
    lastHeading = 0;
  });

  return agentControl;
}
