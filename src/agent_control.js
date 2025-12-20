import geminiIcon from "./assets/gemini_icon.svg";

/**
 * Create an agent control for:
 *   1. displaying the agent icon
 *   2. toggling the chat interface
 */
export function createAgentControl() {
  const agentControl = document.createElement("button");
  agentControl.classList.add("agent-control");
  agentControl.title = "Map Agent";

  const agentIcon = document.createElement("img");
  agentIcon.src = geminiIcon;
  agentIcon.classList.add("agent-icon");
  agentControl.appendChild(agentIcon);

  // When the agent is clicked, toggle chat
  agentControl.addEventListener("click", () => {
    const chatContainer = document.querySelector(".chat-container");
    chatContainer.classList.toggle("open");

    // Focus input if opening
    if (chatContainer.classList.contains("open")) {
      setTimeout(() => document.getElementById("chat-input").focus(), 300);
    }
  });

  return agentControl;
}
