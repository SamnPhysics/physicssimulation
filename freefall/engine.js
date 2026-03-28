// freefall/engine.js
import Engine from '../app/phylets/engine.js';

class FreefallEngine extends Engine {
  constructor(params) {
    super();
    this.params = params;
  }

  drag(v, rho, Cd, A) {
    return 0.5 * rho * Cd * A * v * Math.abs(v);
  }

  dvdt(v, m, g, rho, Cd, A) {
    const Fd = this.drag(v, rho, Cd, A);
    return (m * g - Fd) / m;
  }

  dhdt(v) {
    return -v;
  }

  rk4_step(h, v, dt, params) {
    const { m, g, rho, Cd, A } = params;
    const k1v = this.dvdt(v, m, g, rho, Cd, A);
    const k1h = this.dhdt(v);

    const v2 = v + 0.5 * dt * k1v;
    const k2v = this.dvdt(v2, m, g, rho, Cd, A);
    const k2h = this.dhdt(v + 0.5 * dt * k1v);

    const v3 = v + 0.5 * dt * k2v;
    const k3v = this.dvdt(v3, m, g, rho, Cd, A);
    const k3h = this.dhdt(v + 0.5 * dt * k2v);

    const v4 = v + dt * k3v;
    const k4v = this.dvdt(v4, m, g, rho, Cd, A);
    const k4h = this.dhdt(v + dt * k3v);

    const v_next = v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    const h_next = h + (dt / 6) * (k1h + 2 * k2h + 2 * k3h + k4h);
    return { h: h_next, v: v_next };
  }

  update(state) {
    const { h, v, t, dt } = state;
    const { m, g, rho, Cd, A } = this.params;
    if (h <= 0 && v >= 0) {
      return state;
    }
    const next = this.rk4_step(h, v, dt, { m, g, rho, Cd, A });
    const newH = next.h;
    const newV = next.v;
    const newT = t + dt;
    return { ...state, h: newH, v: newV, t: newT };
  }
}

export default FreefallEngine;
