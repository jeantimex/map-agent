import { executeMapCommand } from "./tool_executor.js";
import { mapNavigationTools } from "./map_navigation_tools.js";
import { placesTools } from "./places_tools.js";

export class GeminiLiveClient {
  constructor({ mapState, onActiveChange }) {
    this.mapState = mapState;
    this.onActiveChange = onActiveChange;
    this.ws = null;
    this.audioContext = null;
    this.mediaStream = null;
    this.workletNode = null;
    this.isPlaying = false;
    this.audioQueue = [];
    this.nextPlayTime = 0;
    this.isActive = false;
  }

  async connect() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const host = "generativelanguage.googleapis.com";
    const url = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("Gemini Live WebSocket connected");
      this.isActive = true;
      this.onActiveChange(true);
      this.sendInitialSetup();
      setTimeout(() => this.sendWelcomePrompt(), 100);
    };

    this.ws.onmessage = async (event) => {
      await this.handleMessage(event.data);
    };

    this.ws.onclose = (event) => {
      console.log(
        "Gemini Live WebSocket disconnected",
        event.code,
        event.reason
      );
      this.isActive = false;
      this.onActiveChange(false);
      this.stopAudio();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    await this.startAudioInput();
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopAudio();
  }

  sendInitialSetup() {
    const setupMessage = {
      setup: {
        model: "models/gemini-2.5-flash-native-audio-preview-12-2025",
        tools: [
          {
            functionDeclarations: [...mapNavigationTools, ...placesTools],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
        },
      },
    };
    this.send(setupMessage);
  }

  sendWelcomePrompt() {
    const msg = {
      clientContent: {
        turns: [
          {
            role: "user",
            parts: [
              {
                text: "Please say hello and tell me you can move the map, zoom, search for places and give directions.",
              },
            ],
          },
        ],
        turnComplete: true,
      },
    };
    this.send(msg);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  async handleMessage(data) {
    let response;
    try {
      if (data instanceof Blob) {
        response = JSON.parse(await data.text());
      } else {
        response = JSON.parse(data);
      }
    } catch (e) {
      console.error("Error parsing message:", e);
      return;
    }

    // Handle Audio Output
    if (response.serverContent?.modelTurn?.parts) {
      for (const part of response.serverContent.modelTurn.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith("audio/")) {
          // Decode Base64 audio and play
          const audioData = this.base64ToArrayBuffer(part.inlineData.data);
          this.playAudioChunk(audioData);
        }
      }
    }

    // Handle Tool Calls
    if (response.toolCall) {
      await this.handleToolCall(response.toolCall);
    }
  }

  async handleToolCall(toolCall) {
    const functionCalls = toolCall.functionCalls;
    const functionResponses = [];

    for (const call of functionCalls) {
      console.log("Live Tool Call:", call.name, call.args);
      const result = await executeMapCommand(
        call.name,
        call.args,
        this.mapState.map,
        this.mapState.geocoder,
        this.mapState.panorama,
        this.mapState.placesService,
        this.mapState.directionsService,
        this.mapState.elevationService
      );

      functionResponses.push({
        id: call.id,
        name: call.name,
        response: {
          result: typeof result === "object" ? JSON.stringify(result) : result,
        },
      });
    }

    // Send tool response back
    const toolResponseMessage = {
      toolResponse: {
        functionResponses: functionResponses,
      },
    };
    this.send(toolResponseMessage);
  }

  // --- Audio Input (Microphone) ---

  async startAudioInput() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 16000, // Desired sample rate for Gemini
    });

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
      },
    });

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Use AudioWorkletNode
    console.log("Loading AudioWorklet module...");
    try {
        await this.audioContext.audioWorklet.addModule("pcm-processor.js");
        console.log("AudioWorklet module loaded.");
    } catch (e) {
        console.error("Failed to load AudioWorklet module:", e);
        throw e;
    }
    
    const workletNode = new AudioWorkletNode(this.audioContext, "pcm-processor");

    workletNode.port.onmessage = (event) => {
      if (!this.isActive) return;

      const inputData = event.data; // Float32Array from processor

      // Downsample/Convert to PCM 16-bit
      const pcmData = this.floatTo16BitPCM(inputData);

      // Convert to Base64
      const base64Audio = this.arrayBufferToBase64(pcmData);

      // Stream to Gemini
      this.send({
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: "audio/pcm;rate=16000",
              data: base64Audio,
            },
          ],
        },
      });
    };

    source.connect(workletNode);
    workletNode.connect(this.audioContext.destination);
    this.workletNode = workletNode;
  }

  stopAudio() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  // --- Audio Output (Speaker) ---

  async playAudioChunk(audioData) {
    if (!this.audioContext) return;

    // Convert PCM 16-bit to AudioBuffer
    // Assuming 24kHz output from Gemini Live (common default)
    // We need to verify the sample rate or decode it.
    // Usually raw PCM comes at 24000Hz from Gemini Live unless specified.

    const float32Data = this.pcm16ToFloat32(audioData);
    const audioBuffer = this.audioContext.createBuffer(
      1,
      float32Data.length,
      24000
    );
    audioBuffer.getChannelData(0).set(float32Data);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    const currentTime = this.audioContext.currentTime;
    const startTime = Math.max(currentTime, this.nextPlayTime);
    source.start(startTime);
    this.nextPlayTime = startTime + audioBuffer.duration;
  }

  // --- Helpers ---

  floatTo16BitPCM(float32Array) {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(i * 2, s, true); // Little endian
    }
    return buffer;
  }

  pcm16ToFloat32(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const float32 = new Float32Array(arrayBuffer.byteLength / 2);
    for (let i = 0; i < float32.length; i++) {
      const int16 = view.getInt16(i * 2, true);
      float32[i] = int16 / 32768.0;
    }
    return float32;
  }

  arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
