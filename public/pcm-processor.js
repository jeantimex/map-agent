class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Buffer size of 2048 frames (approx 128ms at 16kHz) is a good balance
    this.bufferSize = 2048;
    this.buffer = new Float32Array(this.bufferSize);
    this.index = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      for (let i = 0; i < channelData.length; i++) {
        this.buffer[this.index++] = channelData[i];
        if (this.index >= this.bufferSize) {
          // Send the filled buffer to the main thread
          this.port.postMessage(this.buffer);
          this.index = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
