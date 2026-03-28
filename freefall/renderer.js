// freefall/renderer.js
import Renderer from '../app/phylets/renderer.js';

class FreefallRenderer extends Renderer {
  constructor(animCanvas, chartCanvas, legendElement, params) {
    super(animCanvas);
    this.chartCanvas = chartCanvas;
    this.ctxC = this.chartCanvas.getContext('2d');
    this.legendElement = legendElement;
    this.params = params;
    this.series = [];
  }

  drawAnim(state) {
    const { h, v, vT } = state;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#aaa';
    this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 20);

    this.ctx.fillStyle = '#333';
    this.ctx.fillText(`高度 h: ${Math.max(0, h).toFixed(2)} m`, 12, 20);
    this.ctx.fillText(`速度 v: ${v.toFixed(2)} m/s`, 12, 40);
    this.ctx.fillText(`終端速度 v_T: ${vT.toFixed(2)} m/s`, 12, 60);

    const maxH = Math.max(this.params.h0, 1);
    const frac = Math.max(0, Math.min(1, h / maxH));
    const y = 20 + (this.canvas.height - 40) * (1 - frac);
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, y, 12, 0, Math.PI * 2);
    this.ctx.fillStyle = '#1976d2';
    this.ctx.fill();
  }

  drawChart(state) {
    const { vT } = state;
    this.legendElement.innerHTML = '藍色：數值解 v(t)（RK4）；灰虛線：終端速度 v_T';
    this.ctxC.clearRect(0, 0, this.chartCanvas.width, this.chartCanvas.height);

    const padding = 40;
    const w = this.chartCanvas.width - padding * 2;
    const hgt = this.chartCanvas.height - padding * 2;
    this.ctxC.strokeStyle = '#ccc';
    this.ctxC.strokeRect(padding, padding, w, hgt);

    this.ctxC.fillStyle = '#333';
    this.ctxC.fillText('時間 t (s)', this.chartCanvas.width / 2 - 20, this.chartCanvas.height - 10);
    this.ctxC.save();
    this.ctxC.translate(12, this.chartCanvas.height / 2 + 40);
    this.ctxC.rotate(-Math.PI / 2);
    this.ctxC.fillText('速度 v (m/s)', 0, 0);
    this.ctxC.restore();

    const vmax = Math.max(vT * 1.2, ...this.series.map(s => s.v).concat([1]));
    const tmax = Math.max(5, ...this.series.map(s => s.t).concat([1]));

    this.ctxC.strokeStyle = '#1976d2';
    this.ctxC.lineWidth = 2;
    this.ctxC.beginPath();
    this.series.forEach((pt, i) => {
        const x = padding + (pt.t / tmax) * w;
        const y = padding + (1 - (pt.v / vmax)) * hgt;
        if (i === 0) this.ctxC.moveTo(x, y); else this.ctxC.lineTo(x, y);
    });
    this.ctxC.stroke();

    this.ctxC.strokeStyle = '#888';
    this.ctxC.setLineDash([6, 6]);
    const yT = padding + (1 - (vT / vmax)) * hgt;
    this.ctxC.beginPath();
    this.ctxC.moveTo(padding, yT);
    this.ctxC.lineTo(padding + w, yT);
    this.ctxC.stroke();
    this.ctxC.setLineDash([]);
    this.ctxC.fillStyle = '#555';
    this.ctxC.fillText(`v_T = ${vT.toFixed(2)} m/s`, padding + w - 110, yT - 6);
  }

  render(state) {
    this.series.push({ t: state.t, v: state.v });
    if (this.series.length > 2000) {
      this.series.shift();
    }
    this.drawAnim(state);
    this.drawChart(state);
  }
}

export default FreefallRenderer;
