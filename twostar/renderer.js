// twostar/renderer.js
import Renderer from '../app/phylets/renderer.js';

class TwostarRenderer extends Renderer {
  constructor(orbitCanvas, lightCurveCanvas, spectrumCanvas, eclipseLabel, orbitStatus, starA, starB) {
    super(orbitCanvas);
    this.lcCanvas = lightCurveCanvas;
    this.spCanvas = spectrumCanvas;
    this.lcCtx = this.lcCanvas.getContext('2d');
    this.spCtx = this.spCanvas.getContext('2d');
    this.eclipseLabel = eclipseLabel;
    this.orbitStatus = orbitStatus;
    this.starA = starA;
    this.starB = starB;

    this.fluxHistory = [];
    this.velAHistory = [];
    this.velBHistory = [];
    this.maxHistory = 600;
  }

  drawOrbit(state) {
    const { xA_3d, zA_3d, xB_3d, zB_3d } = state;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const visualTilt = 0.3;
    const xB_screen = cx + xB_3d * 2;
    const yB_screen = cy - zB_3d * 2 * visualTilt;
    const xA_screen = cx + xA_3d * 2;
    const yA_screen = cy - zA_3d * 2 * visualTilt;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';

    [this.starA.distFromCenter, this.starB.distFromCenter].forEach(r => {
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy, r * 2, r * 2 * 0.3, 0, 0, Math.PI * 2);
      this.ctx.stroke();
    });

    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(cx - 2, cy - 2, 4, 4);

    const stars = [
      { x: xA_screen, y: yA_screen, z: zA_3d, r: this.starA.radius, c: this.starA.color },
      { x: xB_screen, y: yB_screen, z: zB_3d, r: this.starB.radius, c: this.starB.color }
    ].sort((a, b) => b.z - a.z);

    stars.forEach(s => {
      this.ctx.beginPath();
      const scale = 1 + (s.z * -0.002);
      this.ctx.arc(s.x, s.y, s.r * scale, 0, Math.PI * 2);
      this.ctx.fillStyle = s.c;
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = s.c;
      this.ctx.fill();
    });
  }

  drawLightCurve(state) {
    const { currentFlux, lcScale } = state;
    this.fluxHistory.push(currentFlux);
    if (this.fluxHistory.length > this.maxHistory) {
      this.fluxHistory.shift();
    }

    const w = this.lcCanvas.width;
    const h = this.lcCanvas.height;
    this.lcCtx.clearRect(0, 0, w, h);

    const baselineY = h * 0.25;

    this.lcCtx.strokeStyle = '#334155';
    this.lcCtx.setLineDash([4, 4]);
    this.lcCtx.beginPath();
    this.lcCtx.moveTo(0, baselineY);
    this.lcCtx.lineTo(w, baselineY);
    this.lcCtx.stroke();
    this.lcCtx.setLineDash([]);
    this.lcCtx.fillStyle = '#94a3b8';
    this.lcCtx.font = '24px monospace';
    this.lcCtx.fillText('1.0', 10, baselineY - 10);

    if (this.fluxHistory.length < 1) return;

    this.lcCtx.beginPath();
    this.lcCtx.lineWidth = 4;
    this.lcCtx.strokeStyle = '#facc15';

    const yMap = (val) => baselineY + (1 - val) * (h * 1.5 * lcScale);

    for (let i = 0; i < this.fluxHistory.length; i++) {
      let x = (i / this.maxHistory) * w;
      const y = yMap(this.fluxHistory[i]);
      if (i === 0) this.lcCtx.moveTo(x, y);
      else this.lcCtx.lineTo(x, y);
    }
    this.lcCtx.stroke();

    const curX = (this.fluxHistory.length - 1) / this.maxHistory * w;
    const curY = yMap(this.fluxHistory[this.fluxHistory.length - 1]);

    this.lcCtx.beginPath();
    this.lcCtx.moveTo(curX, 0);
    this.lcCtx.lineTo(curX, h);
    this.lcCtx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    this.lcCtx.lineWidth = 1;
    this.lcCtx.stroke();

    this.lcCtx.fillStyle = '#fff';
    this.lcCtx.beginPath();
    this.lcCtx.arc(curX, curY, 6, 0, Math.PI * 2);
    this.lcCtx.fill();
  }

  drawSpectrum(state) {
    const { va, vb, spScale } = state;
    this.velAHistory.push(va);
    this.velBHistory.push(vb);
    if (this.velAHistory.length > this.maxHistory) {
      this.velAHistory.shift();
      this.velBHistory.shift();
    }

    const w = this.spCanvas.width;
    const h = this.spCanvas.height;
    this.spCtx.clearRect(0, 0, w, h);

    const cy = h / 2;
    this.spCtx.strokeStyle = '#334155';
    this.spCtx.setLineDash([4, 4]);
    this.spCtx.beginPath();
    this.spCtx.moveTo(0, cy);
    this.spCtx.lineTo(w, cy);
    this.spCtx.stroke();
    this.spCtx.setLineDash([]);
    this.spCtx.fillStyle = '#94a3b8';
    this.spCtx.fillText('λ₀ (靜止)', 10, cy - 8);

    if (this.velAHistory.length < 1) return;

    const drawLine = (data, color) => {
      this.spCtx.beginPath();
      this.spCtx.lineWidth = 3;
      this.spCtx.strokeStyle = color;
      const scaleY = h * 0.35 * spScale;
      for (let i = 0; i < data.length; i++) {
        const x = (i / this.maxHistory) * w;
        const y = cy - (data[i] * scaleY);
        if (i === 0) this.spCtx.moveTo(x, y);
        else this.spCtx.lineTo(x, y);
      }
      this.spCtx.stroke();

      const curX = (data.length - 1) / this.maxHistory * w;
      const curY = cy - (data[data.length - 1] * scaleY);
      this.spCtx.fillStyle = color;
      this.spCtx.beginPath();
      this.spCtx.arc(curX, curY, 5, 0, Math.PI * 2);
      this.spCtx.fill();
    };

    drawLine(this.velAHistory, '#60a5fa');
    drawLine(this.velBHistory, '#f97316');

    const curX = (this.velAHistory.length - 1) / this.maxHistory * w;
    this.spCtx.beginPath();
    this.spCtx.moveTo(curX, 0);
    this.spCtx.lineTo(curX, h);
    this.spCtx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    this.spCtx.lineWidth = 1;
    this.spCtx.stroke();
  }
  
  updateEclipseLabel(state) {
    const { statusText, statusColor } = state;
    if (statusText) {
        this.eclipseLabel.classList.remove('hidden');
        this.eclipseLabel.querySelector('span').innerText = statusText;
        this.eclipseLabel.querySelector('span').className = `text-lg font-bold drop-shadow-md px-3 py-1 rounded bg-black/60 border border-white/20 whitespace-pre-line text-center ${statusColor}`;
        this.orbitStatus.classList.remove('hidden');
        this.orbitStatus.innerText = statusText.replace('
', ' - ');
    } else {
        this.eclipseLabel.classList.add('hidden');
        this.orbitStatus.classList.add('hidden');
    }
  }

  render(state) {
    this.drawOrbit(state);
    this.drawLightCurve(state);
    this.drawSpectrum(state);
    this.updateEclipseLabel(state);
  }
}

export default TwostarRenderer;
