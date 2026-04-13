// ============================================
// DRONES PANDAVEN 3D — Camera (Chase Cam)
// ============================================
class Camera {
    constructor() {
        this.cam = new THREE.PerspectiveCamera(CONFIG.CAMERA_FOV, CONFIG.CANVAS_WIDTH/CONFIG.CANVAS_HEIGHT, 1, 4000);
        this.rig = new THREE.Group();
        this.rig.add(this.cam);
        this.cam.position.set(0, CONFIG.CAMERA_HEIGHT, CONFIG.CAMERA_DISTANCE);
        this.cam.lookAt(0, 40, -300);
        this.x=0; this.y=0; this.z=0;
        this.shakeIntensity=0; this.shakeDuration=0; this.shakeTimer=0;
        this.targetFOV=CONFIG.CAMERA_FOV; this.currentFOV=CONFIG.CAMERA_FOV;
        this.followLerp=0.06;
    }
    follow(px, py, pz, dt) {
        this.x = lerp(this.x, px, this.followLerp);
        this.y = lerp(this.y, py + CONFIG.CAMERA_HEIGHT, this.followLerp);
        this.z = lerp(this.z, pz + CONFIG.CAMERA_DISTANCE, this.followLerp);
    }
    shake(intensity, duration) {
        if (intensity > this.shakeIntensity) { this.shakeIntensity=intensity; this.shakeDuration=duration; this.shakeTimer=0; }
    }
    setZoom(mult) { this.targetFOV = mult > 1 ? CONFIG.CAMERA_FOV_RUSH : CONFIG.CAMERA_FOV; }
    update(dt) {
        let sx=0, sy=0;
        if (this.shakeTimer < this.shakeDuration) {
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
    resize(w, h) { this.cam.aspect=w/h; this.cam.updateProjectionMatrix(); }
}
