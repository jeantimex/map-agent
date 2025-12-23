import * as THREE from "three";
import { createNoise3D } from "simplex-noise";

export class VoiceVisualizer {
  constructor(container) {
    this.container = container;
    this.noise3D = createNoise3D();
    this.inputAnalyser = null;
    this.outputAnalyser = null;
    this.inputDataArray = null;
    this.outputDataArray = null;
    this.animationId = null;
    this.isActive = false;

    // --- Scene Setup ---
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    // Default size
    const size = 150;
    this.renderer.setSize(size, size);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.camera.position.z = 4;

    // --- Create the Sphere ---
    this.geometry = new THREE.IcosahedronGeometry(1.5, 50);
    this.material = new THREE.PointsMaterial({
      color: 0xccf2ff,
      size: 0.01,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    this.blob = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.blob);

    this.originalPositions = this.geometry.attributes.position.array.slice();

    this.animate = this.animate.bind(this);
  }

  setAnalysers(inputAnalyser, outputAnalyser) {
    this.inputAnalyser = inputAnalyser;
    this.outputAnalyser = outputAnalyser;

    if (this.inputAnalyser) {
      this.inputDataArray = new Uint8Array(this.inputAnalyser.frequencyBinCount);
    }
    if (this.outputAnalyser) {
      this.outputDataArray = new Uint8Array(
        this.outputAnalyser.frequencyBinCount
      );
    }
  }

  setActive(active) {
    this.isActive = active;
    this.container.style.display = active ? "block" : "none";

    if (active && !this.animationId) {
      this.animationId = requestAnimationFrame(this.animate);
    } else if (!active && this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  animate(time) {
    if (!this.isActive) return;
    this.animationId = requestAnimationFrame(this.animate);

    let inputVolume = 0;
    if (this.inputAnalyser) {
      this.inputAnalyser.getByteFrequencyData(this.inputDataArray);
      let sum = 0;
      for (let i = 0; i < this.inputDataArray.length; i++)
        sum += this.inputDataArray[i];
      inputVolume = sum / this.inputDataArray.length / 255;
    }

    let outputVolume = 0;
    if (this.outputAnalyser) {
      this.outputAnalyser.getByteFrequencyData(this.outputDataArray);
      let sum = 0;
      for (let i = 0; i < this.outputDataArray.length; i++)
        sum += this.outputDataArray[i];
      outputVolume = sum / this.outputDataArray.length / 255;
    }

    const combinedVolume = Math.max(inputVolume, outputVolume);

    const positions = this.geometry.attributes.position.array;
    const t = time * 0.0004;

    for (let i = 0; i < positions.length; i += 3) {
      const x = this.originalPositions[i];
      const y = this.originalPositions[i + 1];
      const z = this.originalPositions[i + 2];

      // Noise displacement
      // Extremely subtle multipliers
      const noise =
        this.noise3D(x * 0.8 + t, y * 0.8 + t, z * 0.8 + t) *
        (0.05 + combinedVolume * 0.8);

      positions[i] = x * (1 + noise);
      positions[i + 1] = y * (1 + noise);
      positions[i + 2] = z * (1 + noise);
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.blob.rotation.y += 0.005;

    this.renderer.render(this.scene, this.camera);
  }

  resize(size) {
    this.renderer.setSize(size, size);
  }
}
