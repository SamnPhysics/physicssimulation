// twostar/main.js
import Simulation from '../app/simulation.js';
import TwostarEngine from './engine.js';
import TwostarRenderer from './renderer.js';

// --- DOM Elements ---
const orbitCanvas = document.getElementById('orbitCanvas');
const lightCurveCanvas = document.getElementById('lightCurveCanvas');
const spectrumCanvas = document.getElementById('spectrumCanvas');
const eclipseLabel = document.getElementById('eclipseLabel');
const orbitStatus = document.getElementById('orbitStatus');

// --- Star Parameters ---
const starA = {
    color: '#60a5fa', radius: 32, brightness: 100, mass: 3.0, distFromCenter: 0
};
const starB = {
    color: '#f97316', radius: 20, brightness: 40, mass: 1.0, distFromCenter: 0
};
const totalSeparation = 140;
const totalMass = starA.mass + starB.mass;
starA.distFromCenter = totalSeparation * (starB.mass / totalMass);
starB.distFromCenter = totalSeparation * (starA.mass / totalMass);

// --- Initial State ---
const initialState = {
    systemAngle: 0,
    speedMultiplier: 0.5,
    lcScale: 1.0,
    spScale: 1.0,
    fluxHistory: [],
    velAHistory: [],
    velBHistory: [],
};

// --- Engine and Renderer ---
const engine = new TwostarEngine(starA, starB, totalSeparation);
const renderer = new TwostarRenderer(orbitCanvas, lightCurveCanvas, spectrumCanvas, eclipseLabel, orbitStatus, starA, starB);

// --- Simulation ---
const simulation = new Simulation(initialState, engine, renderer);

// --- UI Controls ---
function resizeCanvases() {
    [orbitCanvas, lightCurveCanvas, spectrumCanvas].forEach(canvas => {
        canvas.width = canvas.clientWidth * 2;
        canvas.height = canvas.clientHeight * 2;
    });
}
window.addEventListener('resize', resizeCanvases);
resizeCanvases();

document.getElementById('toggleBtn').onclick = () => simulation.pause();
document.getElementById('resetBtn').onclick = () => simulation.reset();
document.getElementById('speedRange').oninput = (e) => {
    simulation.state.speedMultiplier = parseFloat(e.target.value);
};
document.getElementById('lcZoomIn').onclick = () => {
    if (simulation.state.lcScale < 5) simulation.state.lcScale += 0.5;
    updateZoom();
};
document.getElementById('lcZoomOut').onclick = () => {
    if (simulation.state.lcScale > 0.5) simulation.state.lcScale -= 0.5;
    updateZoom();
};
document.getElementById('spZoomIn').onclick = () => {
    if (simulation.state.spScale < 5) simulation.state.spScale += 0.5;
    updateZoom();
};
document.getElementById('spZoomOut').onclick = () => {
    if (simulation.state.spScale > 0.5) simulation.state.spScale -= 0.5;
    updateZoom();
};

function updateZoom() {
    document.getElementById('lcScaleDisplay').textContent = `x${simulation.state.lcScale.toFixed(1)}`;
    document.getElementById('spScaleDisplay').textContent = `x${simulation.state.spScale.toFixed(1)}`;
}

// --- Start Simulation ---
simulation.start();

