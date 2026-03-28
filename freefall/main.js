// freefall/main.js
import Simulation from '../app/simulation.js';
import FreefallEngine from './engine.js';
import FreefallRenderer from './renderer.js';

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
        <img src="https.latex.codecogs.com/svg.latex?F_D%20%3D%20%5Cfrac%7B1%7D%7B2%7D%5Crho%20C_D%20A%20v%5E2." title="F_D = \frac{1}{2}\rho C_D A v^2." />
        <br>
        當加速度趨近於零（力平衡）時的終端速度：
        <img src="https.latex.codecogs.com/svg.latex?v_T%20%3D%20%5Csqrt%7B%5Cfrac%7B2%20m%20g%7D%7B%5Crho%20C_D%20A%7D%7D." title="v_T = \sqrt{\frac{2 m g}{\rho C_D A}}." />
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('h1').textContent = '自由落體模擬（空氣阻力 + RK4）';
    document.title = '自由落體模擬（空氣阻力 + RK4）';
    createParamControls();
    createEquations();

    const paramElements = {};
    params.forEach(p => {
        paramElements[p.id] = document.getElementById(p.id);
    });

    const m = +paramElements.m.value;
    const Cd = +paramElements.cd.value;
    const A = +paramElements.A.value;
    const rho = +paramElements.rho.value;
    const h0 = +paramElements.h0.value;
    const dt = +paramElements.dt.value;
    const g = +paramElements.g.value;
    const vT = Math.sqrt((2 * m * g) / (rho * Cd * A));

    const initialState = {
        h: h0,
        v: 0,
        t: 0,
        dt,
        vT,
    };

    const animCanvas = document.getElementById('anim');
    const chartCanvas = document.getElementById('chart');
    const legendElement = document.getElementById('chart-legend');

    const engine = new FreefallEngine({ m, g, rho, Cd, A });
    const renderer = new FreefallRenderer(animCanvas, chartCanvas, legendElement, { h0 });
    const simulation = new Simulation(initialState, engine, renderer);

    document.getElementById('run').addEventListener('click', () => simulation.start());
    document.getElementById('pause').addEventListener('click', () => simulation.pause());
    document.getElementById('reset').addEventListener('click', () => simulation.reset());
});

