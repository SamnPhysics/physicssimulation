const params = [
    { id: 'm', label: '質量 m (kg)', type: 'number', step: 0.1, value: 1.0 },
    { id: 'cd', label: '空氣阻力係數 C_D', type: 'number', step: 0.01, value: 0.47 },
    { id: 'A', label: '截面積 A (m²)', type: 'number', step: 0.001, value: 0.01 },
    { id: 'rho', label: '空氣密度 ρ (kg/m³)', type: 'number', step: 0.001, value: 1.225 },
    { id: 'h0', label: '起始高度 h₀ (m)', type: 'number', step: 1, value: 100 },
    { id: 'dt', label: '時間步長 Δt (s)', type: 'number', step: 0.001, value: 0.01 },
    { id: 'g', label: '重力加速度 g (m/s²)', type: 'number', step: 0.01, value: 9.81 },
];

function createParamControls() {
    const container = document.getElementById('params-container');
    params.forEach(p => {
        const row = document.createElement('div');
        row.classList.add('row');
        row.innerHTML = `
            <label for="${p.id}">${p.label}</label>
            <input id="${p.id}" type="${p.type}" step="${p.step}" value="${p.value}">
        `;
        container.appendChild(row);
    });
}

function createEquations() {
    const container = document.getElementById('equations-container');
    container.innerHTML = `
        當物體僅受重力與二次方阻力作用（向下為正），運動方程為：
        <img src="https://latex.codecogs.com/svg.latex?m%5Cfrac%7Bdv%7D%7Bdt%7D%20%3D%20mg%20-%20%5Cfrac%7B1%7D%7B2%7D%5Crho%20C_D%20A%5C,%20v%5C,|v|%2C%20%5Cqquad%20%5Cfrac%7Bdh%7D%7Bdt%7D%20%3D%20-v." title="m\frac{dv}{dt} = mg - \frac{1}{2}\rho C_D A\, v\,|v|, \qquad \frac{dh}{dt} = -v." />
        <br>
        其中空氣阻力大小遵循
        <img src="https://latex.codecogs.com/svg.latex?F_D%20%3D%20%5Cfrac%7B1%7D%7B2%7D%5Crho%20C_D%20A%20v%5E2." title="F_D = \frac{1}{2}\rho C_D A v^2." />
        <br>
        當加速度趨近於零（力平衡）時的終端速度：
        <img src="https://latex.codecogs.com/svg.latex?v_T%20%3D%20%5Csqrt%7B%5Cfrac%7B2%20m%20g%7D%7B%5Crho%20C_D%20A%7D%7D." title="v_T = \sqrt{\frac{2 m g}{\rho C_D A}}." />
    `;
}

class FreefallSimulation extends Simulation {
    constructor() {
        super();
        this.el = (id) => document.getElementById(id);
        
        this.paramElements = {};
        params.forEach(p => {
            this.paramElements[p.id] = this.el(p.id);
        });

        this.anim = this.el('anim');
        this.ctxA = this.anim.getContext('2d');
        this.chart = this.el('chart');
        this.ctxC = this.chart.getContext('2d');

        this.btnRun = this.el('run');
        this.btnPause = this.el('pause');
        this.btnReset = this.el('reset');

        this.series = [];

        this.init();
        this.bindEvents();
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

    drawAnim(hNow) {
        this.ctxA.clearRect(0, 0, this.anim.width, this.anim.height);
        this.ctxA.fillStyle = '#aaa';
        this.ctxA.fillRect(0, this.anim.height - 20, this.anim.width, 20);

        this.ctxA.fillStyle = '#333';
        this.ctxA.fillText(`高度 h: ${Math.max(0, hNow).toFixed(2)} m`, 12, 20);
        this.ctxA.fillText(`速度 v: ${this.v.toFixed(2)} m/s`, 12, 40);
        this.ctxA.fillText(`終端速度 v_T: ${this.vT.toFixed(2)} m/s`, 12, 60);

        const maxH = Math.max(+this.paramElements.h0.value, 1);
        const frac = Math.max(0, Math.min(1, hNow / maxH));
        const y = 20 + (this.anim.height - 40) * (1 - frac);
        this.ctxA.beginPath();
        this.ctxA.arc(this.anim.width / 2, y, 12, 0, Math.PI * 2);
        this.ctxA.fillStyle = '#1976d2';
        this.ctxA.fill();
    }

    drawChart() {
        const legend = this.el('chart-legend');
        legend.innerHTML = '藍色：數值解 v(t)（RK4）；灰虛線：終端速度 v_T';
        this.ctxC.clearRect(0, 0, this.chart.width, this.chart.height);

        const padding = 40;
        const w = this.chart.width - padding * 2;
        const hgt = this.chart.height - padding * 2;
        this.ctxC.strokeStyle = '#ccc';
        this.ctxC.strokeRect(padding, padding, w, hgt);

        this.ctxC.fillStyle = '#333';
        this.ctxC.fillText('時間 t (s)', this.chart.width / 2 - 20, this.chart.height - 10);
        this.ctxC.save();
        this.ctxC.translate(12, this.chart.height / 2 + 40);
        this.ctxC.rotate(-Math.PI / 2);
        this.ctxC.fillText('速度 v (m/s)', 0, 0);
        this.ctxC.restore();

        const vmax = Math.max(this.vT * 1.2, ...this.series.map(s => s.v).concat([1]));
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
        const yT = padding + (1 - (this.vT / vmax)) * hgt;
        this.ctxC.beginPath();
        this.ctxC.moveTo(padding, yT);
        this.ctxC.lineTo(padding + w, yT);
        this.ctxC.stroke();
        this.ctxC.setLineDash([]);
        this.ctxC.fillStyle = '#555';
        this.ctxC.fillText(`v_T = ${this.vT.toFixed(2)} m/s`, padding + w - 110, yT - 6);
    }

    init() {
        this.m = +this.paramElements.m.value;
        this.Cd = +this.paramElements.cd.value;
        this.A = +this.paramElements.A.value;
        this.rho = +this.paramElements.rho.value;
        this.h = +this.paramElements.h0.value;
        this.v = 0;
        this.t = 0;
        this.dt = +this.paramElements.dt.value;
        this.g = +this.paramElements.g.value;
        this.vT = Math.sqrt((2 * this.m * this.g) / (this.rho * this.Cd * this.A));
        this.series.length = 0;
        this.series.push({ t: this.t, v: this.v });
        this.drawAnim(this.h);
        this.drawChart();
    }

    update() {
        if (this.h <= 0 && this.v >= 0) {
            this.running = false;
            return;
        }
        const next = this.rk4_step(this.h, this.v, this.dt, { m: this.m, g: this.g, rho: this.rho, Cd: this.Cd, A: this.A });
        this.h = next.h;
        this.v = next.v;
        this.t += this.dt;

        this.series.push({ t: this.t, v: this.v });
        if (this.series.length > 2000) this.series.shift();

        this.drawAnim(this.h);
        this.drawChart();
    }

    bindEvents() {
        this.btnRun.addEventListener('click', () => {
            if (!this.running) {
                this.init();
                this.start();
            }
        });
        this.btnPause.addEventListener('click', () => {
            this.pause();
        });
        this.btnReset.addEventListener('click', () => {
            this.reset();
            this.init();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('h1').textContent = '自由落體模擬（空氣阻力 + RK4）';
    document.title = '自由落體模擬（空氣阻力 + RK4）';
    createParamControls();
    createEquations();
    new FreefallSimulation();
});
