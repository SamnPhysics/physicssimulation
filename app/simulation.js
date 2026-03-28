import Engine from './phylets/engine.js';
import Renderer from './phylets/renderer.js';

class Simulation {
  constructor(initialState, engine, renderer) {
    // Deep copy initialState to prevent mutation from affecting the reset state.
    this.initialState = JSON.parse(JSON.stringify(initialState));
    this.state = initialState;
    this.engine = engine;
    this.renderer = renderer;

    this.running = false;
    this.paused = false;
    this.rafId = null;

    this.loop = this.loop.bind(this);
  }

  start() {
    if (!this.running) {
      this.running = true;
      this.paused = false;
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  pause() {
    if (this.running) {
      this.paused = !this.paused;
      if (!this.paused) {
        this.rafId = requestAnimationFrame(this.loop);
      }
    }
  }

  reset() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.running = false;
    this.paused = false;
    // Use a deep copy for the reset state to ensure future states are clean.
    this.state = JSON.parse(JSON.stringify(this.initialState));
    this.renderer.render(this.state);
  }

  loop() {
    if (!this.running || this.paused) {
      return;
    }

    this.state = this.engine.update(this.state);
    this.renderer.render(this.state);

    this.rafId = requestAnimationFrame(this.loop);
  }
}

export default Simulation;
