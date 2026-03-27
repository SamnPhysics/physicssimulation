class Simulation {
  constructor() {
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
  }

  loop() {
    if (!this.running || this.paused) {
      return;
    }

    // This is where the simulation-specific logic will be called.
    // For now, it's just an empty loop.
    if(this.update) {
        this.update();
    }


    this.rafId = requestAnimationFrame(this.loop);
  }
}
