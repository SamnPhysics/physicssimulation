class TwoStarSimulation extends Simulation {
    constructor() {
        super();
        this.orbitCanvas = document.getElementById('orbitCanvas');
        this.lightCurveCanvas = document.getElementById('lightCurveCanvas');
        this.spectrumCanvas = document.getElementById('spectrumCanvas');
        this.orbitCtx = this.orbitCanvas.getContext('2d');
        this.lcCtx = this.lightCurveCanvas.getContext('2d');
        this.spCtx = this.spectrumCanvas.getContext('2d');
        this.eclipseLabel = document.getElementById('eclipseLabel');
        this.orbitStatus = document.getElementById('orbitStatus');

        this.starA = { 
            color: '#60a5fa', radius: 32, brightness: 100, mass: 3.0, distFromCenter: 0 
        };
        this.starB = { 
            color: '#f97316', radius: 20, brightness: 40, mass: 1.0, distFromCenter: 0 
        };

        this.totalSeparation = 140; 
        this.totalMass = this.starA.mass + this.starB.mass;
        this.starA.distFromCenter = this.totalSeparation * (this.starB.mass / this.totalMass);
        this.starB.distFromCenter = this.totalSeparation * (this.starA.mass / this.totalMass);

        this.maxFlux = (Math.PI * this.starA.radius**2 * this.starA.brightness) + (Math.PI * this.starB.radius**2 * this.starB.brightness);

        this.INITIAL_ANGLE = 0;
        this.systemAngle = this.INITIAL_ANGLE; 
        this.speedMultiplier = 0.5;
        this.lcScale = 1.0;
        this.spScale = 1.0;

        this.maxHistory = 600;
        this.fluxHistory = [];
        this.velAHistory = [];
        this.velBHistory = [];
        
        this.resizeCanvases();
        this.bindEvents();
        this.start();
    }

    calculateOverlapArea(r1, r2, d) {
        if (d >= r1 + r2) return 0;
        if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2)**2;
        const r1Sq = r1**2, r2Sq = r2**2;
        const angle1 = 2 * Math.acos((r1Sq + d**2 - r2Sq) / (2 * r1 * d));
        const angle2 = 2 * Math.acos((r2Sq + d**2 - r1Sq) / (2 * r2 * d));
        return 0.5 * (r2Sq * (angle2 - Math.sin(angle2)) + r1Sq * (angle1 - Math.sin(angle1)));
    }

    stepSimulation(isReset = false) {
        if (!isReset) {
            this.systemAngle += 0.015 * this.speedMultiplier;
        }

        const xB_3d = this.starB.distFromCenter * Math.cos(this.systemAngle);
        const zB_3d = this.starB.distFromCenter * Math.sin(this.systemAngle);
        
        const xA_3d = this.starA.distFromCenter * Math.cos(this.systemAngle + Math.PI);
        const zA_3d = this.starA.distFromCenter * Math.sin(this.systemAngle + Math.PI);

        const visualTilt = 0.3; 
        const cx = this.orbitCanvas.width / 2;
        const cy = this.orbitCanvas.height / 2;
        
        const xB_screen = cx + xB_3d * 2;
        const yB_screen = cy - zB_3d * 2 * visualTilt; 
        
        const xA_screen = cx + xA_3d * 2;
        const yA_screen = cy - zA_3d * 2 * visualTilt;

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

        const currentFlux = (this.maxFlux - blockedFlux) / this.maxFlux;
        
        const vFactor = Math.cos(this.systemAngle); 
        const vb = vFactor * 1.0; 
        const va = -vFactor * (this.starB.mass / this.starA.mass);

        if (isReset) {
            this.fluxHistory = [currentFlux];
            this.velAHistory = [va];
            this.velBHistory = [vb];
        } else {
            this.fluxHistory.push(currentFlux);
            this.velAHistory.push(va);
            this.velBHistory.push(vb);
            
            if (this.fluxHistory.length > this.maxHistory) {
                this.fluxHistory.shift();
                this.velAHistory.shift();
                this.velBHistory.shift();
            }
        }

        this.drawOrbit(cx, cy, xA_screen, yA_screen, zA_3d, xB_screen, yB_screen, zB_3d);
        this.drawLightCurve();
        this.drawSpectrum();
    }

    drawOrbit(cx, cy, xA, yA, zA, xB, yB, zB) {
        this.orbitCtx.clearRect(0, 0, this.orbitCanvas.width, this.orbitCanvas.height);
        
        this.orbitCtx.lineWidth = 2;
        this.orbitCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        
        [this.starA.distFromCenter, this.starB.distFromCenter].forEach(r => {
            this.orbitCtx.beginPath();
            this.orbitCtx.ellipse(cx, cy, r*2, r*2*0.3, 0, 0, Math.PI*2);
            this.orbitCtx.stroke();
        });

        this.orbitCtx.fillStyle = '#fff';
        this.orbitCtx.fillRect(cx-2, cy-2, 4, 4);

        const stars = [
            { x: xA, y: yA, z: zA, r: this.starA.radius, c: this.starA.color },
            { x: xB, y: yB, z: zB, r: this.starB.radius, c: this.starB.color }
        ].sort((a, b) => b.z - a.z);

        stars.forEach(s => {
            this.orbitCtx.beginPath();
            const scale = 1 + (s.z * -0.002); 
            this.orbitCtx.arc(s.x, s.y, s.r * scale, 0, Math.PI * 2);
            this.orbitCtx.fillStyle = s.c;
            this.orbitCtx.shadowBlur = 20;
            this.orbitCtx.shadowColor = s.c;
            this.orbitCtx.fill();
        });
    }

    drawLightCurve() {
        const w = this.lightCurveCanvas.width;
        const h = this.lightCurveCanvas.height;
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
        
        const yMap = (val) => baselineY + (1 - val) * (h * 1.5 * this.lcScale);
        
        const drawStartIndex = Math.max(0, this.fluxHistory.length - this.maxHistory);
        
        for (let i = 0; i < this.fluxHistory.length; i++) {
            let x;
            if (this.fluxHistory.length < this.maxHistory) {
                 x = (i / this.maxHistory) * w;
            } else {
                 x = (i / this.maxHistory) * w;
            }
            
            const y = yMap(this.fluxHistory[i]);
            if (i === 0) this.lcCtx.moveTo(x, y);
            else this.lcCtx.lineTo(x, y);
        }
        this.lcCtx.stroke();

        const curX = (this.fluxHistory.length - 1) / this.maxHistory * w;
        const curY = yMap(this.fluxHistory[this.fluxHistory.length-1]);
        
        this.lcCtx.beginPath();
        this.lcCtx.moveTo(curX, 0);
        this.lcCtx.lineTo(curX, h);
        this.lcCtx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        this.lcCtx.lineWidth = 1;
        this.lcCtx.stroke();

        this.lcCtx.fillStyle = '#fff';
        this.lcCtx.beginPath();
        this.lcCtx.arc(curX, curY, 6, 0, Math.PI*2);
        this.lcCtx.fill();
    }

    drawSpectrum() {
        const w = this.spectrumCanvas.width;
        const h = this.spectrumCanvas.height;
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
            const scaleY = h * 0.35 * this.spScale; 
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
            this.spCtx.arc(curX, curY, 5, 0, Math.PI*2);
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

    resizeCanvases() {
        [this.orbitCanvas, this.lightCurveCanvas, this.spectrumCanvas].forEach(canvas => {
            canvas.width = canvas.clientWidth * 2;
            canvas.height = canvas.clientHeight * 2;
        });
        this.stepSimulation(true);
    }
    
    update() {
        this.stepSimulation();
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resizeCanvases());
        document.getElementById('toggleBtn').onclick = () => {
            this.pause();
        };
        document.getElementById('resetBtn').onclick = () => {
            this.systemAngle = this.INITIAL_ANGLE;
            this.fluxHistory = [];
            this.velAHistory = [];
            this.velBHistory = [];
            this.stepSimulation(true);
            if (!this.running) {
                this.start();
            }
        };

        document.getElementById('speedRange').oninput = (e) => this.speedMultiplier = parseFloat(e.target.value);
        
        const updateZoom = () => {
             document.getElementById('lcScaleDisplay').textContent = `x${this.lcScale.toFixed(1)}`;
             document.getElementById('spScaleDisplay').textContent = `x${this.spScale.toFixed(1)}`;
        };
        document.getElementById('lcZoomIn').onclick = () => { if(this.lcScale < 5) this.lcScale+=0.5; updateZoom(); };
        document.getElementById('lcZoomOut').onclick = () => { if(this.lcScale > 0.5) this.lcScale-=0.5; updateZoom(); };
        document.getElementById('spZoomIn').onclick = () => { if(this.spScale < 5) this.spScale+=0.5; updateZoom(); };
        document.getElementById('spZoomOut').onclick = () => { if(this.spScale > 0.5) this.spScale-=0.5; updateZoom(); };
    }

    start() {
        if (!this.running) {
            this.running = true;
            this.rafId = requestAnimationFrame(() => this.loop());
        }
    }

    pause() {
        this.running = !this.running;
        if(this.running) {
            this.rafId = requestAnimationFrame(() => this.loop());
        } else {
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        }
    }
}

new TwoStarSimulation();
