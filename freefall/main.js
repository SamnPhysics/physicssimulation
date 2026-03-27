class FreefallSimulation extends Simulation {
    constructor() {
        super();
        this.el = (id) => document.getElementById(id);
        this.mEl = this.el('m');
        this.cdEl = this.el('cd');
        this.AEl = this.el('A');
        this.rhoEl = this.el('rho');
        this.h0El = this.el('h0');
        this.dtEl = this.el('dt');
        this.gEl = this.el('g');

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

        const maxH = Math.max(+this.h0El.value, 1);
        const frac = Math.max(0, Math.min(1, hNow / maxH));
        const y = 20 + (this.anim.height - 40) * (1 - frac);
        this.ctxA.beginPath();
        this.ctxA.arc(this.anim.width / 2, y, 12, 0, Math.PI * 2);
        this.ctxA.fillStyle = '#1976d2';
        this.ctxA.fill();
    }

    drawChart() {
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
        this.m = +this.mEl.value;
        this.Cd = +this.cdEl.value;
        this.A = +this.AEl.value;
        this.rho = +this.rhoEl.value;
        this.h = +this.h0El.value;
        this.v = 0;
        this.t = 0;
        this.dt = +this.dtEl.value;
        this.g = +this.gEl.value;
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

new FreefallSimulation();
