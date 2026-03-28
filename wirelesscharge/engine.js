// wirelesscharge/engine.js
import Engine from '../app/phylets/engine.js';

class WirelessChargeEngine extends Engine {
    constructor() {
        super();
    }

    update(state) {
        const {
            time,
            playbackSpeed,
            phone,
            pad,
            isTruePhysics,
            currentStrength,
            powerMode,
            batteryLevel
        } = state;

        const newTime = time + 0.05 * playbackSpeed;

        const velocityZ = phone.z - (phone.lastZ !== undefined ? phone.lastZ : phone.z);
        const newPhoneZ = phone.z + (phone.targetZ - phone.z) * 0.2;

        const distance = newPhoneZ - pad.height;
        let couplingFactor = 0;
        let CHARGING_THRESHOLD = 0;

        if (isTruePhysics) {
            const R = 30; // Effective radius for physics calculation
            const bFieldRatio = Math.pow(R, 3) / Math.pow(Math.pow(R, 2) + Math.pow(distance, 2), 1.5);
            couplingFactor = bFieldRatio * currentStrength;
            CHARGING_THRESHOLD = 0.20;
        } else {
            const maxDistance = 40 + 120 * currentStrength;
            if (distance < maxDistance && distance >= 0) {
                couplingFactor = Math.max(0, 1 - (distance / maxDistance));
            }
            CHARGING_THRESHOLD = 0.05;
        }

        const isCharging = (powerMode === 'AC') && (currentStrength > 0) && (couplingFactor > CHARGING_THRESHOLD);
        
        let newBatteryLevel = batteryLevel;
        if (isCharging && batteryLevel < 100) {
            newBatteryLevel += 0.05 * couplingFactor * playbackSpeed;
        }

        let isReceivingCurrent = isCharging;
        let isWeakInduction = false;

        if (powerMode === 'DC' && currentStrength > 0 && Math.abs(velocityZ) > 0.5 && couplingFactor > (CHARGING_THRESHOLD / 3)) {
            isReceivingCurrent = true;
            isWeakInduction = true;
        }

        return {
            ...state,
            time: newTime,
            phone: {
                ...phone,
                z: newPhoneZ,
                lastZ: phone.z,
            },
            batteryLevel: newBatteryLevel,
            couplingFactor,
            isCharging,
            isReceivingCurrent,
            isWeakInduction,
            distance, // Pass for renderer debugging or UI
        };
    }
}

export default WirelessChargeEngine;
