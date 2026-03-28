// twostar/engine.js
import Engine from '../app/phylets/engine.js';

class TwostarEngine extends Engine {
  constructor(starA, starB, totalSeparation) {
    super();
    this.starA = starA;
    this.starB = starB;
    this.totalSeparation = totalSeparation;
  }

  calculateOverlapArea(r1, r2, d) {
    if (d >= r1 + r2) return 0;
    if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;
    const r1Sq = r1 ** 2, r2Sq = r2 ** 2;
    const angle1 = 2 * Math.acos((r1Sq + d ** 2 - r2Sq) / (2 * r1 * d));
    const angle2 = 2 * Math.acos((r2Sq + d ** 2 - r1Sq) / (2 * r2 * d));
    return 0.5 * (r2Sq * (angle2 - Math.sin(angle2)) + r1Sq * (angle1 - Math.sin(angle1)));
  }

  update(state) {
    const { systemAngle, speedMultiplier } = state;
    const newSystemAngle = systemAngle + 0.015 * speedMultiplier;

    const xB_3d = this.starB.distFromCenter * Math.cos(newSystemAngle);
    const zB_3d = this.starB.distFromCenter * Math.sin(newSystemAngle);

    const xA_3d = this.starA.distFromCenter * Math.cos(newSystemAngle + Math.PI);
    const zA_3d = this.starA.distFromCenter * Math.sin(newSystemAngle + Math.PI);

    const projectedDist = Math.abs(xB_3d - xA_3d);
    let blockedFlux = 0;
    let statusText = "";
    let statusColor = "";

    if (projectedDist < (this.starA.radius + this.starB.radius)) {
      const overlap = this.calculateOverlapArea(this.starA.radius, this.starB.radius, projectedDist);

      if (zB_3d < zA_3d) {
        blockedFlux = overlap * this.starA.brightness;
        statusText = "主極小 (Primary Eclipse)
橘星(前/暗) 遮 藍星(後/亮)";
        statusColor = "text-red-400";
      } else {
        blockedFlux = overlap * this.starB.brightness;
        statusText = "次極小 (Secondary Eclipse)
藍星(前/亮) 遮 橘星(後/暗)";
        statusColor = "text-yellow-300";
      }
    }

    const maxFlux = (Math.PI * this.starA.radius ** 2 * this.starA.brightness) + (Math.PI * this.starB.radius ** 2 * this.starB.brightness);
    const currentFlux = (maxFlux - blockedFlux) / maxFlux;

    const vFactor = Math.cos(newSystemAngle);
    const vb = vFactor * 1.0;
    const va = -vFactor * (this.starB.mass / this.starA.mass);

    return {
      ...state,
      systemAngle: newSystemAngle,
      xA_3d,
      zA_3d,
      xB_3d,
      zB_3d,
      currentFlux,
      va,
      vb,
      statusText,
      statusColor,
    };
  }
}

export default TwostarEngine;
