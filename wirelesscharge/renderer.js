// wirelesscharge/renderer.js
import Renderer from '../app/phylets/renderer.js';

class WirelessChargeRenderer extends Renderer {
    constructor(canvas, domElements) {
        super(canvas);
        this.dom = domElements;
        this.container = this.dom.container;
        
        this.width = 0;
        this.height = 0;
        this.globalScale = 1;
        this.ISO_SCALE = 0.5;
        this.cx = 0;
        this.cy = 0;

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
            }
        });
        this.resizeObserver.observe(this.container);
    }
    
    getScreenPos(x, y, z) {
        return {
            x: this.cx + x * this.globalScale,
            y: this.cy + (y * this.ISO_SCALE - z) * this.globalScale
        };
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
    
    drawMagneticFields(state, zBase, isFrontLayer) {
        const { time, currentStrength, powerMode } = state;
        if (currentStrength === 0) return; 
        
        const isAC = (powerMode === 'AC');
        const acPhase = Math.sin(time * 3); 
        const baseAlpha = isAC ? Math.abs(acPhase) * 0.7 : 0.6;
        const finalAlpha = baseAlpha * currentStrength;

        const angles = [0, Math.PI/4, Math.PI/2, Math.PI*3/4, Math.PI, -Math.PI*3/4, -Math.PI/2, -Math.PI/4];
        this.ctx.lineWidth = 2;

        angles.forEach(angle => {
            const isFront = Math.sin(angle) > -0.1; 
            if (isFrontLayer !== isFront) return;

            const numLoops = 3; 
            for (let i = 0; i < numLoops; i++) {
                const rInner = 15 + i * 8;   
                const rOuter = 50 + i * 18;  
                const maxH = (45 + i * 30) * (0.4 + currentStrength * 0.6);

                this.ctx.beginPath();
                if (isAC) {
                    this.ctx.setLineDash([12, 8]);
                    this.ctx.lineDashOffset = time * 20 * Math.sign(acPhase);
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

    drawIsoPhone(state) {
        const { phone, isReceivingCurrent, isWeakInduction, currentStrength } = state;
        const thicknessLayers = phone.thickness;
        const screenColor = '#0f172a';
        const bodyColorSide = '#94a3b8';
        const bodyColorTop = '#f8fafc';

        this.ctx.save();
        for (let i = 0; i <= thicknessLayers; i++) {
            const layerZ = phone.z + i;
            const pos = this.getScreenPos(0, 0, layerZ);
            
            this.ctx.save();
            this.ctx.translate(pos.x, pos.y);
            this.ctx.scale(this.globalScale, this.ISO_SCALE * this.globalScale); 
            this.ctx.rotate(phone.angle);
            
            this.ctx.beginPath();
            this.ctx.roundRect(-phone.width/2, -phone.length/2, phone.width, phone.length, 12);

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
                this.ctx.roundRect(-phone.width/2 + 4, -phone.length/2 + 12, phone.width - 8, phone.length - 24, 6);
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
                        glowIntensity = 10 * currentStrength;
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
    
    updateBatteryUI(state) {
        const { isCharging, batteryLevel } = state;
        const currentBatInt = Math.floor(Math.min(batteryLevel, 100));
        
        this.dom.batteryFill.style.width = `${currentBatInt}%`;
        if (this.dom.batteryText.innerText !== `${currentBatInt}%`) {
            this.dom.batteryText.innerText = `${currentBatInt}%`;
        }

        if (isCharging) {
            this.dom.batteryFill.className = "h-full bg-green-500 rounded-sm transition-all";
            this.dom.batteryText.className = "text-[10px] font-bold text-green-600 min-w-[2rem] text-right";
            this.dom.batteryLightning.classList.remove('hidden');
        } else {
            const isLow = currentBatInt <= 20;
            this.dom.batteryFill.className = `h-full ${isLow ? 'bg-red-500' : 'bg-slate-500'} rounded-sm transition-all`;
            this.dom.batteryText.className = `text-[10px] font-bold ${isLow ? 'text-red-500' : 'text-slate-500'} min-w-[2rem] text-right`;
            this.dom.batteryLightning.classList.add('hidden');
        }
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
    
    updateLabels(state) {
        if(!this.width) return;
        
        const { pad, phone } = state;
        const posPad = this.getScreenPos(-pad.radius - 10, 0, pad.height / 2);
        const posTx = this.getScreenPos(20, 20, pad.height); 
        const rxLocalX = 20 * Math.sin(-phone.angle);
        const rxLocalY = 20 * Math.cos(-phone.angle);
        const posRx = this.getScreenPos(rxLocalX, rxLocalY, phone.z + phone.thickness);
        const posPhone = this.getScreenPos(30, -40, phone.z + phone.thickness); 
        const posField = this.getScreenPos(-60, -30, pad.height + 20);

        const fontSize = Math.max(12, Math.min(18, 14 * this.globalScale));
        Object.values(this.dom.labels).forEach(l => {
            if(l) l.style.fontSize = `${fontSize}px`;
        });

        const isMobile = this.width < 600;
        const lineLen = isMobile ? 30 : 60;
        const upLen = isMobile ? -40 : -80;

        this.drawLineAndAttachLabel(this.dom.labels.pad, posPad, { x: posPad.x - lineLen * this.globalScale, y: posPad.y + 10 * this.globalScale }, 'right');
        this.drawLineAndAttachLabel(this.dom.labels.tx, posTx, { x: posTx.x + (lineLen+20) * this.globalScale, y: posTx.y - 15 * this.globalScale }, 'left');
        this.drawLineAndAttachLabel(this.dom.labels.rx, posRx, { x: posRx.x - 10 * this.globalScale, y: posRx.y + upLen * this.globalScale }, 'right');
        this.drawLineAndAttachLabel(this.dom.labels.phone, posPhone, { x: posPhone.x + (lineLen+30) * this.globalScale, y: posPhone.y - 30 * this.globalScale }, 'left');

        if (state.currentStrength > 0) {
            this.drawLineAndAttachLabel(this.dom.labels.field, posField, { x: posField.x - (lineLen+20) * this.globalScale, y: posField.y - 10 * this.globalScale }, 'right');
        }
    }

    render(state) {
        if (!this.ctx || !this.width) return;
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw grid
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

        // Draw scene objects
        const { pad, currentStrength, powerMode } = state;
        this.drawCylinder(pad.z, pad.radius, pad.height, '#f1f5f9', '#cbd5e1');
        let txColor = currentStrength > 0 ? (powerMode === 'AC' ? '#fb923c' : '#3b82f6') : '#94a3b8';
        this.drawFlatCoil(0, 0, pad.height, 35, 5, txColor, currentStrength > 0);
        
        this.drawMagneticFields(state, pad.height, false); // Back layer
        this.drawIsoPhone(state);
        this.drawMagneticFields(state, pad.height, true); // Front layer

        // Update DOM elements
        this.updateLabels(state);
        this.updateBatteryUI(state);
    }
}

export default WirelessChargeRenderer;
