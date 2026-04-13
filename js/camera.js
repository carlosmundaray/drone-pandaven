// ============================================
// DRONES PANDAVEN 3D — Chase Camera (Third Person)
// ============================================
class Camera {
    constructor() {
        this.cam = new THREE.PerspectiveCamera(CONFIG.FPS_FOV, CONFIG.CANVAS_WIDTH/CONFIG.CANVAS_HEIGHT, 0.5, 4000);
        this.rig = new THREE.Group();
        this.rig.add(this.cam);

        // Chase cam offset: behind and above the drone
        this.chaseHeight = 18;
        this.chaseDist = 45;
        this.cam.position.set(0, this.chaseHeight, this.chaseDist);
        this.cam.lookAt(0, 5, -30);

        // Position
        this.x=0; this.y=0; this.z=0;

        // Mouse look
        this.yaw=0;
        this.pitch=-0.05; // slight downward default
        this.maxPitch=Math.PI*0.3;
        this.minPitch=-Math.PI*0.4;

        // Shake
        this.shakeIntensity=0; this.shakeDuration=0; this.shakeTimer=0;

        // FOV
        this.targetFOV=CONFIG.FPS_FOV;
        this.currentFOV=CONFIG.FPS_FOV;

        // Head bob / engine vibration
        this.bobTimer=0;
        this.bobIntensity=0;
        this.vibTimer=0;

        // Tilt
        this.currentTilt=0;
        this.targetTilt=0;

        // Barrel roll
        this.rollAngle=0;
        this.rollTarget=0;
        this.rolling=false;

        // Damage glitch
        this.glitchTimer=0;
        this.glitchIntensity=0;

        // Mode
        this.fpsMode=false;

        // Menu camera
        this.followLerp=0.06;
    }

    setFPS(enabled) {
        this.fpsMode=enabled;
        if(enabled) {
            this.targetFOV=CONFIG.FPS_FOV;
            this.currentFOV=CONFIG.FPS_FOV;
            this.cam.fov=CONFIG.FPS_FOV;
            this.cam.near=0.5;
            this.cam.position.set(0, this.chaseHeight, this.chaseDist);
            this.cam.updateProjectionMatrix();
        } else {
            this.targetFOV=CONFIG.CAMERA_FOV;
            this.currentFOV=CONFIG.CAMERA_FOV;
            this.cam.fov=CONFIG.CAMERA_FOV;
            this.cam.near=1;
            this.cam.position.set(0, CONFIG.CAMERA_HEIGHT, CONFIG.CAMERA_DISTANCE);
            this.cam.updateProjectionMatrix();
        }
    }

    applyMouseDelta(dx, dy) {
        if(!this.fpsMode) return;
        this.yaw -= dx * CONFIG.MOUSE_SENSITIVITY;
        this.pitch -= dy * CONFIG.MOUSE_SENSITIVITY;
        this.pitch = clamp(this.pitch, this.minPitch, this.maxPitch);
    }

    follow(px, py, pz, dt, vx) {
        if(this.fpsMode) {
            this.x = lerp(this.x, px, 8*dt);
            this.y = lerp(this.y, py, 8*dt);
            this.z = lerp(this.z, pz, 8*dt);
            this.targetTilt = -(vx||0) * CONFIG.CAMERA_TILT_FACTOR;
        } else {
            this.x = lerp(this.x, px, this.followLerp);
            this.y = lerp(this.y, py + CONFIG.CAMERA_HEIGHT, this.followLerp);
            this.z = lerp(this.z, pz + CONFIG.CAMERA_DISTANCE, this.followLerp);
        }
    }

    shake(intensity, duration) {
        if(intensity > this.shakeIntensity) {
            this.shakeIntensity=intensity;
            this.shakeDuration=duration;
            this.shakeTimer=0;
        }
    }

    triggerGlitch(intensity) {
        this.glitchTimer=0.3;
        this.glitchIntensity=intensity||1;
    }

    setZoom(mult) {
        if(this.fpsMode) {
            this.targetFOV = mult > 1 ? CONFIG.FPS_FOV_RUSH : CONFIG.FPS_FOV;
        } else {
            this.targetFOV = mult > 1 ? CONFIG.CAMERA_FOV_RUSH : CONFIG.CAMERA_FOV;
        }
    }

    setBoostFOV(boosting) {
        if(!this.fpsMode) return;
        if(boosting) this.targetFOV = CONFIG.FPS_FOV_BOOST;
        else this.targetFOV = CONFIG.FPS_FOV;
    }

    startBarrelRoll(direction) {
        if(this.rolling) return;
        this.rolling=true;
        this.rollTarget = direction * Math.PI * 2;
        this.rollAngle = 0;
    }

    getForward() {
        return { x: Math.sin(this.yaw), z: -Math.cos(this.yaw) };
    }

    getRight() {
        return { x: Math.cos(this.yaw), z: Math.sin(this.yaw) };
    }

    // Get world-space aim direction (for shooting)
    getAimDirection() {
        const sinY=Math.sin(this.yaw), cosY=Math.cos(this.yaw);
        const sinP=Math.sin(this.pitch), cosP=Math.cos(this.pitch);
        return {
            x: sinY*cosP,
            y: sinP,
            z: -cosY*cosP
        };
    }

    update(dt, speed) {
        speed = speed || 0;

        if(this.fpsMode) {
            // Engine vibration
            this.vibTimer += dt * 35;
            const vibX = Math.sin(this.vibTimer) * CONFIG.ENGINE_VIBRATION * 0.5;
            const vibY = Math.cos(this.vibTimer * 1.3) * CONFIG.ENGINE_VIBRATION * 0.5;

            // Bob
            this.bobIntensity = lerp(this.bobIntensity, speed > 50 ? 0.5 : 0.1, 2*dt);
            this.bobTimer += dt * CONFIG.HEAD_BOB_SPEED * (speed / 300);
            const bobY = Math.sin(this.bobTimer) * CONFIG.HEAD_BOB_INTENSITY * this.bobIntensity * 0.5;

            // Shake
            let sx=0, sy=0;
            if(this.shakeTimer < this.shakeDuration) {
                this.shakeTimer += dt;
                const decay = 1 - easeOutQuad(this.shakeTimer/this.shakeDuration);
                sx = (Math.random()*2-1) * this.shakeIntensity * decay;
                sy = (Math.random()*2-1) * this.shakeIntensity * decay;
            } else {
                this.shakeIntensity=0;
            }

            // Glitch
            let gx=0, gy=0;
            if(this.glitchTimer > 0) {
                this.glitchTimer -= dt;
                gx = (Math.random()*2-1) * this.glitchIntensity * 1.5;
                gy = (Math.random()*2-1) * this.glitchIntensity * 1.5;
            }

            // Tilt
            this.currentTilt = lerp(this.currentTilt, clamp(this.targetTilt, -0.15, 0.15), 4*dt);

            // Barrel roll
            if(this.rolling) {
                const rollSpeed = Math.PI*2 / CONFIG.BARREL_ROLL_DURATION;
                this.rollAngle += Math.sign(this.rollTarget) * rollSpeed * dt;
                if(Math.abs(this.rollAngle) >= Math.abs(this.rollTarget)) {
                    this.rollAngle = 0;
                    this.rollTarget = 0;
                    this.rolling = false;
                }
            }

            // Position the rig at player
            this.rig.position.set(this.x, this.y, this.z);
            this.rig.rotation.set(0, 0, 0);
            this.rig.rotateY(this.yaw);

            // Camera behind + above with offsets
            this.cam.position.set(
                vibX + sx + gx,
                this.chaseHeight + bobY + vibY + sy + gy,
                this.chaseDist
            );

            // Camera looks forward past the drone
            this.cam.rotation.set(0, 0, 0);
            this.cam.rotateX(this.pitch - 0.12); // slight down to see drone
            this.cam.rotateZ(this.currentTilt + this.rollAngle);

            // FOV
            this.currentFOV = lerp(this.currentFOV, this.targetFOV, 3*dt);
            this.cam.fov = this.currentFOV;
            this.cam.updateProjectionMatrix();

        } else {
            // Menu mode
            let sx=0, sy=0;
            if(this.shakeTimer < this.shakeDuration) {
                this.shakeTimer += dt;
                const decay = 1 - easeOutQuad(this.shakeTimer/this.shakeDuration);
                sx = (Math.random()*2-1)*this.shakeIntensity*decay;
                sy = (Math.random()*2-1)*this.shakeIntensity*decay;
            } else { this.shakeIntensity=0; }

            this.currentFOV = lerp(this.currentFOV, this.targetFOV, 2*dt);
            this.cam.fov = this.currentFOV;
            this.cam.updateProjectionMatrix();

            this.rig.position.set(this.x+sx, this.y+sy, this.z);
            this.cam.lookAt(this.x, this.y - CONFIG.CAMERA_HEIGHT + 40, this.z - CONFIG.CAMERA_DISTANCE - 300);
        }
    }

    resize(w, h) {
        this.cam.aspect=w/h;
        this.cam.updateProjectionMatrix();
    }
}
