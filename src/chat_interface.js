export function initChatInterface(onSendMessage) {
  const chatInput = document.getElementById("chat-input");
  const actionBtn = document.getElementById("action-btn");
  const actionIcon = actionBtn.querySelector("span");

  let recognition;
  let isListening = false;

  // Auto-resize logic
  const adjustHeight = () => {
    chatInput.style.height = "auto"; // Reset height
    chatInput.style.height = chatInput.scrollHeight + "px"; // Set to scroll height
  };

  // Initialize Speech Recognition
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening until stopped
    recognition.interimResults = true; // Show live results
    recognition.lang = "en-US";

    recognition.onstart = () => {
      isListening = true;
      actionBtn.classList.add("listening");
      actionIcon.textContent = "stop";
      chatInput.placeholder = "Listening...";
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      chatInput.value = transcript;
      adjustHeight(); // Resize on voice input
      updateButtonState();
    };

    recognition.onend = () => {
      isListening = false;
      actionBtn.classList.remove("listening");
      chatInput.placeholder = "Type a message...";
      updateButtonState();
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      isListening = false;
      actionBtn.classList.remove("listening");
      updateButtonState();
    };
  } else {
    console.warn("Web Speech API not supported.");
    actionIcon.textContent = "send";
  }

  function updateButtonState() {
    if (isListening) return;

    if (chatInput.value.trim().length > 0) {
      actionBtn.classList.add("send");
      actionIcon.textContent = "send";
    } else {
      actionBtn.classList.remove("send");
      actionIcon.textContent = "mic";
    }
  }

  function handleAction() {
    if (isListening) {
      recognition.stop();
      return;
    }

    if (chatInput.value.trim().length > 0) {
      triggerSend();
      return;
    }

    if (recognition) {
      recognition.start();
    }
  }

  function triggerSend() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    chatInput.value = "";
    chatInput.style.height = "auto"; // Reset height after sending
    chatInput.disabled = true;
    updateButtonState();

    // Call the provided callback logic
    onSendMessage(message).finally(() => {
      chatInput.disabled = false;
      chatInput.focus();
      updateButtonState();
    });
  }

  // Event Listeners
  actionBtn.addEventListener("click", handleAction);

  chatInput.addEventListener("input", () => {
    adjustHeight();
    updateButtonState();
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      triggerSend();
    }
  });

  // Close chat listeners
  document.getElementById("close-chat").addEventListener("click", () => {
    document.querySelector(".chat-container").classList.remove("open");
  });
}

export function addMessage(text, isUser = false) {
  if (!text || !text.trim()) return;
  const messagesContainer = document.getElementById("chat-messages");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user" : "system"}`;
  messageDiv.textContent = text;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
