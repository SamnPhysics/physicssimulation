class WirelessChargeSimulation extends Simulation {
    constructor() {
        super();
        this.canvas = document.getElementById('simCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('canvas-container');

        this.btnModeAC = document.getElementById('btn-mode-ac');
        this.btnModeDC = document.getElementById('btn-mode-dc');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedLabel = document.getElementById('speedLabel');
        this.currentSlider = document.getElementById('currentSlider');
        this.currentLabel = document.getElementById('currentLabel');
        this.resetSettingsBtn = document.getElementById('resetSettingsBtn');
        this.physicsToggle = document.getElementById('physicsToggle');

        this.batteryFill = document.getElementById('battery-fill');
        this.batteryText = document.getElementById('battery-text');
        this.batteryLightning = document.getElementById('battery-lightning');

        this.width;
        this.height;
        this.time = 0;
        this.powerMode = 'AC';
        this.playbackSpeed = 1.0;
        this.currentStrength = 0.8;
        this.batteryLevel = 20;
        this.isCharging = false;
        this.isTruePhysics = true;
        this.globalScale = 1;

        this.ISO_SCALE = 0.5;
        this.cx;
        this.cy;

        this.pad = { radius: 100, height: 15, z: 0 };
        this.phone = {
            width: 70, length: 140, thickness: 8,
            z: 15, targetZ: 15, lastZ: 15,
            angle: -Math.PI / 6,
            isDragging: false
        };

        this.labels = {
            pad: document.getElementById('label-pad'),
            tx: document.getElementById('label-tx'),
            rx: document.getElementById('label-rx'),
            phone: document.getElementById('label-phone'),
            field: document.getElementById('label-field')
        };
        this.principlePanel = document.getElementById('principle-panel');

        this.dragStartScreenY = 0;
        this.dragStartPhoneZ = 0;
        
        this.bindEvents();
        this.updatePrinciplePanelText();
        this.start();
        
        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                this.width = entry.contentRect.width;
                this.height = entry.contentRect.height;
                this.canvas.width = this.width;
                this.canvas.height = this.height;
                
                const scaleW = this.width / 550;
                const scaleH = this.height / 500;
                this.globalScale = Math.min(2.5, Math.max(0.35, Math.min(scaleW, scaleH)));
                
                this.cx = this.width / 2;
                this.cy = this.height * (this.height < 500 ? 0.7 : 0.65); 
                
                this.updateLabels();
            }
        });
        this.resizeObserver.observe(this.container);
    }

    setModeUI(mode) {
        this.powerMode = mode;
        if (mode === 'AC') {
            this.btnModeAC.className = "flex-1 py-1.5 text-sm font-semibold rounded-md bg-white shadow text-blue-600 transition-all";
            this.btnModeDC.className = "flex-1 py-1.5 text-sm font-semibold rounded-md text-slate-500 hover:text-slate-700 transition-all";
        } else {
            this.btnModeAC.className = "flex-1 py-1.5 text-sm font-semibold rounded-md text-slate-500 hover:text-slate-700 transition-all";
            this.btnModeDC.className = "flex-1 py-1.5 text-sm font-semibold rounded-md bg-white shadow text-red-600 transition-all";
        }
        this.updatePrinciplePanelText();
    }
    
    getScreenPos(x, y, z) {
        return {
            x: this.cx + x * this.globalScale,
            y: this.cy + (y * this.ISO_SCALE - z) * this.globalScale
        };
    }
    
    getPointerY(e) { return e.touches ? e.touches[0].clientY : e.clientY; }
    getPointerX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }

    onPointerDown(e) {
        if(e.target === this.canvas) e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const px = this.getPointerX(e) - rect.left;
        const py = this.getPointerY(e) - rect.top;
        
        const phoneScreenPos = this.getScreenPos(0, 0, this.phone.z);
        
        if (Math.abs(px - phoneScreenPos.x) < this.phone.length * 0.7 * this.globalScale &&
            Math.abs(py - phoneScreenPos.y) < this.phone.length * 0.6 * this.globalScale) {
            this.phone.isDragging = true;
            this.dragStartScreenY = py;
            this.dragStartPhoneZ = this.phone.z;
            this.canvas.style.cursor = 'grabbing';
        }
    }

    onPointerMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const px = this.getPointerX(e) - rect.left;
        const py = this.getPointerY(e) - rect.top;

        if (!this.phone.isDragging) {
            const phoneScreenPos = this.getScreenPos(0, 0, this.phone.z);
            if (Math.abs(px - phoneScreenPos.x) < this.phone.length * 0.7 * this.globalScale &&
                Math.abs(py - phoneScreenPos.y) < this.phone.length * 0.6 * this.globalScale) {
                this.canvas.style.cursor = 'grab';
            } else {
                this.canvas.style.cursor = 'default';
            }
            return;
        }
        
        const deltaY = py - this.dragStartScreenY;
        this.phone.targetZ = this.dragStartPhoneZ - (deltaY / this.globalScale);
        
        if (this.phone.targetZ < this.pad.height) this.phone.targetZ = this.pad.height;
        if (this.phone.targetZ > 250) this.phone.targetZ = 250;
    }

    onPointerUp() {
        this.phone.isDragging = false;
        this.canvas.style.cursor = 'default';
    }
    
    drawCylinder(z, r, h, topColor, sideColor) {
        const pBottom = this.getScreenPos(0, 0, z);
        const pTop = this.getScreenPos(0, 0, z + h);
        const scaledR = r * this.globalScale;

        this.ctx.fillStyle = sideColor;
        this.ctx.beginPath();
        this.ctx.ellipse(pBottom.x, pBottom.y, scaledR, scaledR * this.ISO_SCALE, 0, 0, Math.PI);
        this.ctx.lineTo(pTop.x - scaledR, pTop.y);
        this.ctx.ellipse(pTop.x, pTop.y, scaledR, scaledR * this.ISO_SCALE, 0, Math.PI, 0, true);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = topColor;
        this.ctx.beginPath();
        this.ctx.ellipse(pTop.x, pTop.y, scaledR, scaledR * this.ISO_SCALE, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#cbd5e1';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    drawFlatCoil(x, y, z, maxRadius, turns, color, glow = false) {
        const pos = this.getScreenPos(x, y, z);
        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.scale(this.globalScale, this.ISO_SCALE * this.globalScale);
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        if(glow) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = color;
        }

        for(let i=1; i<=turns; i++) {
            const r = maxRadius * (i / turns);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, r, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }
    
    drawMagneticFields(zBase, isFrontLayer) {
        if (this.currentStrength === 0) return; 
        
        const isAC = (this.powerMode === 'AC');
        const acPhase = Math.sin(this.time * 3); 
        const baseAlpha = isAC ? Math.abs(acPhase) * 0.7 : 0.6;
        const finalAlpha = baseAlpha * this.currentStrength;

        const angles = [0, Math.PI/4, Math.PI/2, Math.PI*3/4, Math.PI, -Math.PI*3/4, -Math.PI/2, -Math.PI/4];
        this.ctx.lineWidth = 2;

        angles.forEach(angle => {
            const isFront = Math.sin(angle) > -0.1; 
            if (isFrontLayer !== isFront) return;

            const numLoops = 3; 
            for (let i = 0; i < numLoops; i++) {
                const rInner = 15 + i * 8;   
                const rOuter = 50 + i * 18;  
                const maxH = (45 + i * 30) * (0.4 + this.currentStrength * 0.6);

                this.ctx.beginPath();
                if (isAC) {
                    this.ctx.setLineDash([12, 8]);
                    this.ctx.lineDashOffset = this.time * 20 * Math.sign(acPhase);
                } else {
                    this.ctx.setLineDash([]); 
                }
                
                this.ctx.strokeStyle = `rgba(239, 68, 68, ${Math.max(0, finalAlpha - i*0.15)})`;

                for (let t = 0; t <= Math.PI * 2; t += 0.05) {
                    const r = (rInner + rOuter)/2 + (rOuter - rInner)/2 * Math.cos(t);
                    const zLoop = zBase + maxH * Math.sin(t);
                    const px = r * Math.cos(angle);
                    const py = r * Math.sin(angle);
                    
                    const pos = this.getScreenPos(px, py, zLoop);
                    if (t === 0) this.ctx.moveTo(pos.x, pos.y);
                    else this.ctx.lineTo(pos.x, pos.y);
                }
                this.ctx.stroke();
            }
        });
        this.ctx.setLineDash([]);
    }

    drawIsoPhone(z, isReceivingCurrent, isWeakInduction) {
        const thicknessLayers = this.phone.thickness;
        const screenColor = '#0f172a';
        const bodyColorSide = '#94a3b8';
        const bodyColorTop = '#f8fafc';

        this.ctx.save();
        for (let i = 0; i <= thicknessLayers; i++) {
            const layerZ = z + i;
            const pos = this.getScreenPos(0, 0, layerZ);
            
            this.ctx.save();
            this.ctx.translate(pos.x, pos.y);
            this.ctx.scale(this.globalScale, this.ISO_SCALE * this.globalScale); 
            this.ctx.rotate(this.phone.angle);
            
            this.ctx.beginPath();
            this.ctx.roundRect(-this.phone.width/2, -this.phone.length/2, this.phone.width, this.phone.length, 12);

            if (i < thicknessLayers) {
                this.ctx.fillStyle = bodyColorSide;
                this.ctx.fill();
                this.ctx.strokeStyle = '#64748b';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            } else {
                this.ctx.fillStyle = bodyColorTop;
                this.ctx.fill();
                this.ctx.strokeStyle = '#cbd5e1';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                this.ctx.fillStyle = screenColor;
                this.ctx.beginPath();
                this.ctx.roundRect(-this.phone.width/2 + 4, -this.phone.length/2 + 12, this.phone.width - 8, this.phone.length - 24, 6);
                this.ctx.fill();

                this.ctx.save();
                this.ctx.translate(0, 20); 
                let rxColor = '#64748b';
                let glowIntensity = 0;

                if (isReceivingCurrent) {
                    if (isWeakInduction) {
                        rxColor = '#a855f7'; 
                        glowIntensity = 5;
                    } else {
                        rxColor = '#3b82f6'; 
                        glowIntensity = 10 * this.currentStrength;
                    }
                }

                this.ctx.strokeStyle = rxColor;
                this.ctx.lineWidth = 2;
                this.ctx.globalAlpha = 0.8;
                if (isReceivingCurrent) {
                    this.ctx.shadowBlur = glowIntensity;
                    this.ctx.shadowColor = rxColor;
                }
                for (let c = 1; c <= 4; c++) {
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 5 + c * 5, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
                this.ctx.restore();
            }
            this.ctx.restore();
        }
        this.ctx.restore();
    }

    drawLineAndAttachLabel(labelEl, start, end, align) {
        if(labelEl.style.display === 'none') return;
        
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        const midX = start.x + (end.x - start.x) * 0.5;
        this.ctx.lineTo(midX, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.strokeStyle = '#64748b';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(start.x, start.y, 3, 0, Math.PI*2);
        this.ctx.fillStyle = '#64748b';
        this.ctx.fill();

        labelEl.style.left = `${end.x}px`;
        labelEl.style.top = `${end.y}px`;
        
        const gap = 8; 
        if (align === 'right') {
            labelEl.style.transform = `translate(calc(-100% - ${gap}px), -50%)`;
        } else {
            labelEl.style.transform = `translate(${gap}px, -50%)`;
        }
    }
    
    updatePrinciplePanelText() {
        let physicsNote = this.isTruePhysics ? 
            `<div class="mt-3 text-xs text-yellow-800 bg-yellow-100/50 p-2 rounded-md border border-yellow-200">⚠️ <strong>真實物理衰減：</strong>磁場呈斷崖式衰減，需貼近方能感應。</div>` : 
            `<div class="mt-3 text-xs text-blue-800 bg-blue-100/50 p-2 rounded-md border border-blue-200">✅ <strong>教學優化模式：</strong>磁場呈線性寬容衰減，感應範圍較廣。</div>`;

        if (this.currentStrength === 0) {
            this.principlePanel.innerHTML = `<h3 class="text-base font-bold text-slate-700 mb-1">物理狀態</h3><p class="text-sm text-slate-500">無電流，未產生磁場。</p>`;
            this.labels.field.style.display = 'none';
            this.principlePanel.className = "mt-2 bg-slate-50 border-2 border-slate-300 p-4 rounded-xl shadow-sm shrink-0";
        } else if (this.powerMode === 'DC') {
            this.principlePanel.innerHTML = `<h3 class="text-base font-bold text-slate-700 mb-1">物理狀態</h3><p class="text-sm leading-relaxed mb-2">直流電產生<strong class="text-blue-600">固定不變</strong>的磁場。</p><div class="border-t border-slate-300 pt-2 text-sm text-slate-600">靜止時無磁通量變化 ➔ <strong class="text-red-500">無法充電</strong><br><span class="text-xs text-purple-600">※ 拖曳切割磁場時可產生瞬間微弱電流</span></div>${physicsNote}`;
            this.labels.field.innerHTML = "產生固定不變<br>的靜止磁場 (DC)";
            this.labels.field.style.display = 'block';
            this.principlePanel.className = "mt-2 bg-slate-50 border-2 border-slate-400 p-4 rounded-xl shadow-sm shrink-0";
        } else {
            this.principlePanel.innerHTML = `
                <h3 class="text-base font-bold text-slate-700 mb-1">物理狀態</h3>
                <p class="text-sm leading-relaxed mb-2">接收線圈所圍面積中的<strong class="text-orange-500">磁通量</strong>發生持續變化。</p>
                <div class="border-t border-purple-200 pt-2 text-sm text-slate-800">根據法拉第定律產生<strong class="text-orange-500">感應電動勢</strong> ➔ <strong class="text-green-600">成功充電</strong></div>
                ${physicsNote}
            `;
            this.labels.field.innerHTML = "產生隨時間<br>變化的磁場 (AC)";
            this.labels.field.style.display = 'block';
            this.principlePanel.className = "mt-2 bg-pink-50/50 border-2 border-pink-400 p-4 rounded-xl shadow-sm shrink-0";
        }
    }
    
    updateLabels() {
        if(!this.width) return;
        
        const posPad = this.getScreenPos(-this.pad.radius - 10, 0, this.pad.height / 2);
        const posTx = this.getScreenPos(20, 20, this.pad.height); 
        const rxLocalX = 20 * Math.sin(-this.phone.angle);
        const rxLocalY = 20 * Math.cos(-this.phone.angle);
        const posRx = this.getScreenPos(rxLocalX, rxLocalY, this.phone.z + this.phone.thickness);
        const posPhone = this.getScreenPos(30, -40, this.phone.z + this.phone.thickness); 
        const posField = this.getScreenPos(-60, -30, this.pad.height + 20);

        const fontSize = Math.max(12, Math.min(18, 14 * this.globalScale));
        Object.values(this.labels).forEach(l => {
            if(l) l.style.fontSize = `${fontSize}px`;
        });

        const isMobile = this.width < 600;
        const lineLen = isMobile ? 30 : 60;
        const upLen = isMobile ? -40 : -80;

        this.drawLineAndAttachLabel(this.labels.pad, posPad, { x: posPad.x - lineLen * this.globalScale, y: posPad.y + 10 * this.globalScale }, 'right');
        this.drawLineAndAttachLabel(this.labels.tx, posTx, { x: posTx.x + (lineLen+20) * this.globalScale, y: posTx.y - 15 * this.globalScale }, 'left');
        this.drawLineAndAttachLabel(this.labels.rx, posRx, { x: posRx.x - 10 * this.globalScale, y: posRx.y + upLen * this.globalScale }, 'right');
        this.drawLineAndAttachLabel(this.labels.phone, posPhone, { x: posPhone.x + (lineLen+30) * this.globalScale, y: posPhone.y - 30 * this.globalScale }, 'left');

        if (this.currentStrength > 0) {
            this.drawLineAndAttachLabel(this.labels.field, posField, { x: posField.x - (lineLen+20) * this.globalScale, y: posField.y - 10 * this.globalScale }, 'right');
        }
    }
    
    update() {
        this.time += 0.05 * this.playbackSpeed;
        if(!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let velocityZ = this.phone.z - (this.phone.lastZ !== undefined ? this.phone.lastZ : this.phone.z);
        this.phone.lastZ = this.phone.z;
        this.phone.z += (this.phone.targetZ - this.phone.z) * 0.2;

        const distance = this.phone.z - this.pad.height;
        let couplingFactor = 0;
        let CHARGING_THRESHOLD = 0;

        if (this.isTruePhysics) {
            const R = 30; 
            const bFieldRatio = Math.pow(R, 3) / Math.pow(Math.pow(R, 2) + Math.pow(distance, 2), 1.5);
            couplingFactor = bFieldRatio * this.currentStrength;
            CHARGING_THRESHOLD = 0.20; 
        } else {
            const maxDistance = 40 + 120 * this.currentStrength; 
            if (distance < maxDistance && distance >= 0) {
                couplingFactor = Math.max(0, 1 - (distance / maxDistance));
            }
            CHARGING_THRESHOLD = 0.05; 
        }
        
        this.isCharging = (this.powerMode === 'AC') && (this.currentStrength > 0) && (couplingFactor > CHARGING_THRESHOLD);
        let isReceivingCurrent = this.isCharging;
        let isWeakInduction = false;

        if (this.powerMode === 'DC' && this.currentStrength > 0 && Math.abs(velocityZ) > 0.5 && couplingFactor > (CHARGING_THRESHOLD / 3)) {
            isReceivingCurrent = true;
            isWeakInduction = true; 
        }

        if (this.isCharging && this.batteryLevel < 100) {
            this.batteryLevel += 0.05 * couplingFactor * this.playbackSpeed;
        }

        const currentBatInt = Math.floor(Math.min(this.batteryLevel, 100));
        this.batteryFill.style.width = `${currentBatInt}%`;
        if (this.batteryText.innerText !== `${currentBatInt}%`) this.batteryText.innerText = `${currentBatInt}%`;

        if (this.isCharging) {
            this.batteryFill.className = "h-full bg-green-500 rounded-sm transition-all";
            this.batteryText.className = "text-[10px] font-bold text-green-600 min-w-[2rem] text-right";
            this.batteryLightning.classList.remove('hidden');
        } else {
            const isLow = currentBatInt <= 20;
            this.batteryFill.className = `h-full ${isLow ? 'bg-red-500' : 'bg-slate-500'} rounded-sm transition-all`;
            this.batteryText.className = `text-[10px] font-bold ${isLow ? 'text-red-500' : 'text-slate-500'} min-w-[2rem] text-right`;
            this.batteryLightning.classList.add('hidden');
        }

        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        const gridLimit = Math.max(500, this.canvas.width / this.globalScale);
        for(let i = -gridLimit; i <= gridLimit; i += 50) {
            const p1 = this.getScreenPos(i, -gridLimit, 0);
            const p2 = this.getScreenPos(i, gridLimit, 0);
            this.ctx.moveTo(p1.x, p1.y); this.ctx.lineTo(p2.x, p2.y);
            const p3 = this.getScreenPos(-gridLimit, i, 0);
            const p4 = this.getScreenPos(gridLimit, i, 0);
            this.ctx.moveTo(p3.x, p3.y); this.ctx.lineTo(p4.x, p4.y);
        }
        this.ctx.stroke();

        this.drawCylinder(this.pad.z, this.pad.radius, this.pad.height, '#f1f5f9', '#cbd5e1');
        let txColor = this.currentStrength > 0 ? (this.powerMode === 'AC' ? '#fb923c' : '#3b82f6') : '#94a3b8';
        this.drawFlatCoil(0, 0, this.pad.height, 35, 5, txColor, this.currentStrength > 0);
        
        this.drawMagneticFields(this.pad.height, false);
        this.drawIsoPhone(this.phone.z, isReceivingCurrent, isWeakInduction);
        this.drawMagneticFields(this.pad.height, true);

        this.updateLabels();
    }
    
    bindEvents() {
        this.btnModeAC.addEventListener('click', () => this.setModeUI('AC'));
        this.btnModeDC.addEventListener('click', () => this.setModeUI('DC'));

        this.speedSlider.addEventListener('input', (e) => {
            this.playbackSpeed = parseInt(e.target.value) / 10;
            this.speedLabel.innerText = `${this.playbackSpeed.toFixed(1)}x`;
        });

        this.currentSlider.addEventListener('input', (e) => {
            this.currentStrength = parseInt(e.target.value) / 100;
            this.currentLabel.innerText = `${e.target.value}%`;
            this.updatePrinciplePanelText();
        });

        this.physicsToggle.addEventListener('change', (e) => {
            this.isTruePhysics = e.target.checked;
            this.updatePrinciplePanelText();
        });

        this.resetSettingsBtn.addEventListener('click', () => {
            this.batteryLevel = 20;
            this.setModeUI('AC');
            this.playbackSpeed = 1.0;
            this.speedSlider.value = 10;
            this.speedLabel.innerText = `1.0x`;
            this.currentStrength = 0.8;
            this.currentSlider.value = 80;
            this.currentLabel.innerText = `80%`;
            this.isTruePhysics = true;
            this.physicsToggle.checked = true;
            this.phone.targetZ = this.pad.height;
            this.updatePrinciplePanelText();
        });
        
        this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
        window.addEventListener('mousemove', (e) => this.onPointerMove(e));
        window.addEventListener('mouseup', () => this.onPointerUp());
        this.canvas.addEventListener('touchstart', (e) => this.onPointerDown(e), {passive: false});
        window.addEventListener('touchmove', (e) => this.onPointerMove(e), {passive: false});
        window.addEventListener('touchend', () => this.onPointerUp());
    }

    start() {
        if (!this.running) {
            this.running = true;
            this.rafId = requestAnimationFrame(() => this.loop());
        }
    }

    loop() {
        if (!this.running || this.paused) {
            return;
        }

        if(this.update) {
            this.update();
        }

        this.rafId = requestAnimationFrame(() => this.loop());
    }
}

new WirelessChargeSimulation();
