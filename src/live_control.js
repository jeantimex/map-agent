/**
 * Create a control for the Live interaction (Microphone)
 */
export function createLiveControl(map, onToggle) {
    const controlButton = document.createElement("button");
    controlButton.classList.add("agent-control"); // Reuse same style
    controlButton.title = "Start Live Chat";
    controlButton.style.marginBottom = "60px"; // Spacing from the main agent button
    
    // Inner icon container
    const iconSpan = document.createElement("span");
    iconSpan.classList.add("material-symbols-outlined");
    iconSpan.style.fontSize = "24px";
    iconSpan.style.color = "#5f6368";
    iconSpan.textContent = "mic"; // Default state
    
    controlButton.appendChild(iconSpan);
  
    let isLive = false;
  
    controlButton.addEventListener("click", () => {
      isLive = !isLive;
      onToggle(isLive);
      updateState(isLive);
    });
  
    function updateState(active) {
       if (active) {
           iconSpan.textContent = "graphic_eq"; // Active wave icon
           iconSpan.style.color = "#ea4335"; // Red color
           iconSpan.style.animation = "pulse 1.5s infinite"; // Add pulse animation
       } else {
           iconSpan.textContent = "mic";
           iconSpan.style.color = "#5f6368";
           iconSpan.style.animation = "none";
       }
    }
  
    // Allow external state updates (e.g. if connection fails)
    controlButton.setLiveState = (active) => {
        isLive = active;
        updateState(active);
    };
  
    return controlButton;
  }
