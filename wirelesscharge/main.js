// wirelesscharge/main.js
import Simulation from '../app/simulation.js';
import WirelessChargeEngine from './engine.js';
import WirelessChargeRenderer from './renderer.js';

// --- DOM Elements ---
const canvas = document.getElementById('simCanvas');
const domElements = {
    container: document.getElementById('canvas-container'),
    btnModeAC: document.getElementById('btn-mode-ac'),
    btnModeDC: document.getElementById('btn-mode-dc'),
    speedSlider: document.getElementById('speedSlider'),
    speedLabel: document.getElementById('speedLabel'),
    currentSlider: document.getElementById('currentSlider'),
    currentLabel: document.getElementById('currentLabel'),
    resetSettingsBtn: document.getElementById('resetSettingsBtn'),
    physicsToggle: document.getElementById('physicsToggle'),
    batteryFill: document.getElementById('battery-fill'),
    batteryText: document.getElementById('battery-text'),
    batteryLightning: document.getElementById('battery-lightning'),
    labels: {
        pad: document.getElementById('label-pad'),
        tx: document.getElementById('label-tx'),
        rx: document.getElementById('label-rx'),
        phone: document.getElementById('label-phone'),
        field: document.getElementById('label-field')
    },
    principlePanel: document.getElementById('principle-panel')
};

// --- Initial State and Parameters ---
const initialState = {
    time: 0,
    powerMode: 'AC',
    playbackSpeed: 1.0,
    currentStrength: 0.8,
    batteryLevel: 20,
    isTruePhysics: true,
    pad: { radius: 100, height: 15, z: 0 },
    phone: {
        width: 70, length: 140, thickness: 8,
        z: 15, targetZ: 15, lastZ: 15,
        angle: -Math.PI / 6,
        isDragging: false
    },
    dragStart: { screenY: 0, phoneZ: 0 }
};

// --- Engine and Renderer ---
const engine = new WirelessChargeEngine();
const renderer = new WirelessChargeRenderer(canvas, domElements);

// --- Simulation ---
const simulation = new Simulation(initialState, engine, renderer);

// --- UI Controls & Event Listeners ---
function updatePrinciplePanelText() {
    let state = simulation.state;
    let physicsNote = state.isTruePhysics ? 
        `<div class="mt-3 text-xs text-yellow-800 bg-yellow-100/50 p-2 rounded-md border border-yellow-200">⚠️ <strong>真實物理衰減：</strong>磁場呈斷崖式衰減，需貼近方能感應。</div>` : 
        `<div class="mt-3 text-xs text-blue-800 bg-blue-100/50 p-2 rounded-md border border-blue-200">✅ <strong>教學優化模式：</strong>磁場呈線性寬容衰減，感應範圍較廣。</div>`;

    if (state.currentStrength === 0) {
        domElements.principlePanel.innerHTML = `<h3 class="text-base font-bold text-slate-700 mb-1">物理狀態</h3><p class="text-sm text-slate-500">無電流，未產生磁場。</p>`;
        domElements.labels.field.style.display = 'none';
        domElements.principlePanel.className = "mt-2 bg-slate-50 border-2 border-slate-300 p-4 rounded-xl shadow-sm shrink-0";
    } else if (state.powerMode === 'DC') {
        domElements.principlePanel.innerHTML = `<h3 class="text-base font-bold text-slate-700 mb-1">物理狀態</h3><p class="text-sm leading-relaxed mb-2">直流電產生<strong class="text-blue-600">固定不變</strong>的磁場。</p><div class="border-t border-slate-300 pt-2 text-sm text-slate-600">靜止時無磁通量變化 ➔ <strong class="text-red-500">無法充電</strong><br><span class="text-xs text-purple-600">※ 拖曳切割磁場時可產生瞬間微弱電流</span></div>${physicsNote}`;
        domElements.labels.field.innerHTML = "產生固定不變<br>的靜止磁場 (DC)";
        domElements.labels.field.style.display = 'block';
        domElements.principlePanel.className = "mt-2 bg-slate-50 border-2 border-slate-400 p-4 rounded-xl shadow-sm shrink-0";
    } else {
        domElements.principlePanel.innerHTML = `
            <h3 class="text-base font-bold text-slate-700 mb-1">物理狀態</h3>
            <p class="text-sm leading-relaxed mb-2">接收線圈所圍面積中的<strong class="text-orange-500">磁通量</strong>發生持續變化。</p>
            <div class="border-t border-purple-200 pt-2 text-sm text-slate-800">根據法拉第定律產生<strong class="text-orange-500">感應電動勢</strong> ➔ <strong class="text-green-600">成功充電</strong></div>
            ${physicsNote}
        `;
        domElements.labels.field.innerHTML = "產生隨時間<br>變化的磁場 (AC)";
        domElements.labels.field.style.display = 'block';
        domElements.principlePanel.className = "mt-2 bg-pink-50/50 border-2 border-pink-400 p-4 rounded-xl shadow-sm shrink-0";
    }
}

function setModeUI(mode) {
    simulation.state.powerMode = mode;
    if (mode === 'AC') {
        domElements.btnModeAC.className = "flex-1 py-1.5 text-sm font-semibold rounded-md bg-white shadow text-blue-600 transition-all";
        domElements.btnModeDC.className = "flex-1 py-1.5 text-sm font-semibold rounded-md text-slate-500 hover:text-slate-700 transition-all";
    } else {
        domElements.btnModeAC.className = "flex-1 py-1.5 text-sm font-semibold rounded-md text-slate-500 hover:text-slate-700 transition-all";
        domElements.btnModeDC.className = "flex-1 py-1.5 text-sm font-semibold rounded-md bg-white shadow text-red-600 transition-all";
    }
    updatePrinciplePanelText();
}

domElements.btnModeAC.addEventListener('click', () => setModeUI('AC'));
domElements.btnModeDC.addEventListener('click', () => setModeUI('DC'));

domElements.speedSlider.addEventListener('input', (e) => {
    simulation.state.playbackSpeed = parseInt(e.target.value) / 10;
    domElements.speedLabel.innerText = `${simulation.state.playbackSpeed.toFixed(1)}x`;
});

domElements.currentSlider.addEventListener('input', (e) => {
    simulation.state.currentStrength = parseInt(e.target.value) / 100;
    domElements.currentLabel.innerText = `${e.target.value}%`;
    updatePrinciplePanelText();
});

domElements.physicsToggle.addEventListener('change', (e) => {
    simulation.state.isTruePhysics = e.target.checked;
    updatePrinciplePanelText();
});

domElements.resetSettingsBtn.addEventListener('click', () => {
    Object.assign(simulation.state, {
        ...initialState,
        phone: { ...initialState.phone, targetZ: initialState.pad.height }
    });
    setModeUI('AC');
    domElements.speedSlider.value = 10;
    domElements.speedLabel.innerText = `1.0x`;
    domElements.currentSlider.value = 80;
    domElements.currentLabel.innerText = `80%`;
    domElements.physicsToggle.checked = true;
    updatePrinciplePanelText();
});

// --- Phone Dragging Logic ---
function getPointer(e) { 
    return {
        x: e.touches ? e.touches[0].clientX : e.clientX,
        y: e.touches ? e.touches[0].clientY : e.clientY
    };
}

function onPointerDown(e) {
    if(e.target === canvas) e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const pointer = getPointer(e);
    const px = pointer.x - rect.left;
    const py = pointer.y - rect.top;
    
    const phoneScreenPos = renderer.getScreenPos(0, 0, simulation.state.phone.z);
    
    if (Math.abs(px - phoneScreenPos.x) < simulation.state.phone.length * 0.7 * renderer.globalScale &&
        Math.abs(py - phoneScreenPos.y) < simulation.state.phone.length * 0.6 * renderer.globalScale) {
        
        simulation.state.phone.isDragging = true;
        simulation.state.dragStart = {
            screenY: py,
            phoneZ: simulation.state.phone.z
        };
        canvas.style.cursor = 'grabbing';
    }
}

function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const pointer = getPointer(e);
    const px = pointer.x - rect.left;
    const py = pointer.y - rect.top;

    if (!simulation.state.phone.isDragging) {
        const phoneScreenPos = renderer.getScreenPos(0, 0, simulation.state.phone.z);
        if (Math.abs(px - phoneScreenPos.x) < simulation.state.phone.length * 0.7 * renderer.globalScale &&
            Math.abs(py - phoneScreenPos.y) < simulation.state.phone.length * 0.6 * renderer.globalScale) {
            canvas.style.cursor = 'grab';
        } else {
            canvas.style.cursor = 'default';
        }
        return;
    }
    
    const deltaY = py - simulation.state.dragStart.screenY;
    let targetZ = simulation.state.dragStart.phoneZ - (deltaY / renderer.globalScale);
    
    if (targetZ < simulation.state.pad.height) targetZ = simulation.state.pad.height;
    if (targetZ > 250) targetZ = 250;
    simulation.state.phone.targetZ = targetZ;
}

function onPointerUp() {
    simulation.state.phone.isDragging = false;
    canvas.style.cursor = 'default';
}

canvas.addEventListener('mousedown', (e) => onPointerDown(e));
window.addEventListener('mousemove', (e) => onPointerMove(e));
window.addEventListener('mouseup', () => onPointerUp());
canvas.addEventListener('touchstart', (e) => onPointerDown(e), {passive: false});
window.addEventListener('touchmove', (e) => onPointerMove(e), {passive: false});
window.addEventListener('touchend', () => onPointerUp());

// --- Initial Setup ---
updatePrinciplePanelText();
setModeUI(initialState.powerMode);

// --- Start Simulation ---
simulation.start();
