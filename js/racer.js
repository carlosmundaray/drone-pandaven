// ============================================
// DRONES PANDAVEN 3D — FPV Racing System
// Inspired by Liftoff®: FPV Drone Racing
// ============================================

// -------- RACE GATE (Neon Hoop Checkpoint) --------
class RaceGate {
    constructor(x, y, z, rotation, gateIndex, scene) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.rotation = rotation || 0;
        this.gateIndex = gateIndex;
        this.scene = scene;
        this.radius = 18; // flythrough radius
        this.active = true;
        this.passed = false;
        this.glowPulse = Math.random() * Math.PI * 2;
        this.type = 'race_gate';
        this._create();
    }

    _create() {
        this.mesh = new THREE.Group();

        // Main torus (neon ring gate)
        const torusGeo = new THREE.TorusGeometry(this.radius, 1.8, 8, 24);
        this.gateMat = new THREE.MeshStandardMaterial({
            color: 0x00ffaa,
            emissive: 0x00ffaa,
            emissiveIntensity: 2.0,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.9
        });
        this.gateMesh = new THREE.Mesh(torusGeo, this.gateMat);
        this.mesh.add(this.gateMesh);

        // Inner glow plane (translucent disc to show the "hole")
        const discGeo = new THREE.CircleGeometry(this.radius - 2, 24);
        this.discMat = new THREE.MeshBasicMaterial({
            color: 0x00ffaa,
            transparent: true,
            opacity: 0.06,
            side: THREE.DoubleSide
        });
        this.disc = new THREE.Mesh(discGeo, this.discMat);
        this.mesh.add(this.disc);

        // LED strips on the sides (vertical poles)
        const poleMat = new THREE.MeshStandardMaterial({
            color: 0x222222, metalness: 0.8, roughness: 0.3
        });
        const poleGeo = new THREE.CylinderGeometry(0.8, 0.8, this.radius * 2 + 10);
        const leftPole = new THREE.Mesh(poleGeo, poleMat);
        leftPole.position.set(-this.radius - 2, 0, 0);
        this.mesh.add(leftPole);
        const rightPole = new THREE.Mesh(poleGeo, poleMat);
        rightPole.position.set(this.radius + 2, 0, 0);
        this.mesh.add(rightPole);

        // LED strips (glowing lines on poles)
        const ledGeo = new THREE.CylinderGeometry(0.4, 0.4, this.radius * 2 + 8);
        const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: 0.6 });
        const ledL = new THREE.Mesh(ledGeo, ledMat.clone());
        ledL.position.set(-this.radius - 2.5, 0, 0);
        this.mesh.add(ledL);
        const ledR = new THREE.Mesh(ledGeo, ledMat.clone());
        ledR.position.set(this.radius + 2.5, 0, 0);
        this.mesh.add(ledR);

        // Gate number floating above
        // (We'll render numbers via the HUD canvas instead)

        // Position and rotate
        this.mesh.position.set(this.x, this.y, this.z);
        this.mesh.rotation.y = this.rotation;
        this.scene.add(this.mesh);
    }

    update(dt) {
        this.glowPulse += dt * 3;
        if (this.gateMat) {
            const pulse = 1.5 + Math.sin(this.glowPulse) * 0.8;
            this.gateMat.emissiveIntensity = this.passed ? 0.3 : pulse;
            if (this.passed) {
                this.gateMat.color.setHex(0x444444);
                this.gateMat.emissive.setHex(0x333333);
                this.discMat.opacity = 0.02;
            }
        }
    }

    // Check if a position passed through this gate
    checkPass(px, py, pz, prevZ) {
        if (this.passed) return false;
        // Simple Z-crossing check within radius
        const dz = this.z;
        if ((prevZ > dz && pz <= dz) || (prevZ < dz && pz >= dz)) {
            const dx = px - this.x;
            const dy = py - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.radius + 5) {
                this.passed = true;
                return true;
            }
        }
        return false;
    }

    dispose() {
        if (this.mesh && this.scene) {
            this.scene.remove(this.mesh);
            this.mesh.traverse(c => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) c.material.dispose();
            });
        }
    }
}


// -------- AI RACING DRONE (Gate-Aware) --------
class AIRacer {
    constructor(x, y, z, colorHex, scene) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.scene = scene;
        this.radius = 8;
        this.active = true;
        this.color = colorHex;

        // Speed profile — each AI has a personality
        this.baseSpeed = CONFIG.SCROLL_SPEED * randomRange(0.9, 1.2);
        this.currentSpeed = 0;
        this.maxSpeed = this.baseSpeed * 1.3;

        // Physics
        this.vx = 0;
        this.vy = 0;
        this.roll = 0;
        this.pitch = 0;

        // Gate tracking
        this.currentGateIndex = 0;
        this.gatesPassed = 0;

        // Boost
        this.isBoosting = false;
        this.boostTimer = 0;

        // Trail
        this.trailTimer = 0;

        this._createMesh(colorHex);
    }

    _createMesh(colorHex) {
        this.mesh = new THREE.Group();

        // Carbon fiber body
        const bodyGeo = new THREE.BoxGeometry(8, 3, 14);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x111111, metalness: 0.9, roughness: 0.2
        });
        this.mesh.add(new THREE.Mesh(bodyGeo, bodyMat));

        // Colored accent stripe
        const stripeGeo = new THREE.BoxGeometry(8.2, 0.5, 14.2);
        const stripeMat = new THREE.MeshStandardMaterial({
            color: colorHex, emissive: colorHex, emissiveIntensity: 0.8,
            metalness: 0.5, roughness: 0.3
        });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = 1.8;
        this.mesh.add(stripe);

        // Arms, motors and rotors
        const armPositions = [
            { x: 7, z: 7 }, { x: -7, z: 7 },
            { x: 7, z: -7 }, { x: -7, z: -7 }
        ];
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });

        this.rotors = [];
        armPositions.forEach(pos => {
            // Arm
            const armGeo = new THREE.BoxGeometry(
                pos.x > 0 ? 6 : 6, 1.5, 1.5
            );
            const arm = new THREE.Mesh(armGeo, darkMat);
            arm.position.set(pos.x / 2, 0, pos.z / 2);
            arm.rotation.y = Math.atan2(pos.z, pos.x);
            this.mesh.add(arm);

            // Motor
            const motorGeo = new THREE.CylinderGeometry(2, 2, 2.5);
            const motor = new THREE.Mesh(motorGeo, darkMat);
            motor.position.set(pos.x, 1, pos.z);
            this.mesh.add(motor);

            // Rotor disc
            const rotorGeo = new THREE.CylinderGeometry(5, 5, 0.15, 12);
            const rotorMat = new THREE.MeshStandardMaterial({
                color: 0xaaaaaa, transparent: true, opacity: 0.25
            });
            const rotor = new THREE.Mesh(rotorGeo, rotorMat);
            rotor.position.set(pos.x, 2.5, pos.z);
            this.mesh.add(rotor);
            this.rotors.push(rotor);
        });

        // Rear LED
        const ledGeo = new THREE.SphereGeometry(1, 6, 6);
        const ledMat = new THREE.MeshBasicMaterial({ color: colorHex });
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.set(0, 0, 8);
        this.mesh.add(led);

        this.mesh.position.set(this.x, this.y, this.z);
        this.scene.add(this.mesh);
    }

    update(dt, gates) {
        if (!this.active || dt === 0) return;

        // Spin rotors fast
        this.rotors.forEach(r => r.rotation.y += dt * 40);

        // Find current target gate
        let targetGate = null;
        if (gates && this.currentGateIndex < gates.length) {
            targetGate = gates[this.currentGateIndex];
        }

        // Steer toward next gate
        if (targetGate) {
            const dx = targetGate.x - this.x;
            const dy = targetGate.y - this.y;
            const dz = targetGate.z - this.z;

            this.vx = lerp(this.vx, clamp(dx * 1.5, -80, 80), dt * 4);
            this.vy = lerp(this.vy, clamp(dy * 1.5, -60, 60), dt * 3);

            // Check if passed through gate
            if (Math.abs(dz) < 15 && Math.abs(dx) < targetGate.radius + 5 && Math.abs(dy) < targetGate.radius + 5) {
                this.currentGateIndex++;
                this.gatesPassed++;
            }
        } else {
            // Past all gates — head to finish
            this.vx = lerp(this.vx, 0, dt * 2);
            this.vy = lerp(this.vy, 0, dt * 2);
        }

        // Random boost bursts
        if (!this.isBoosting && Math.random() < dt * 0.3) {
            this.isBoosting = true;
            this.boostTimer = randomRange(1.5, 4);
        }
        if (this.isBoosting) {
            this.boostTimer -= dt;
            if (this.boostTimer <= 0) this.isBoosting = false;
        }

        // Speed
        const targetSpeed = this.isBoosting ? this.maxSpeed : this.baseSpeed;
        this.currentSpeed = lerp(this.currentSpeed, targetSpeed, dt * 2);

        // Apply movement
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.z -= this.currentSpeed * dt;

        // Clamp altitude
        this.y = clamp(this.y, 8, 200);

        // Visual tilt
        this.roll = lerp(this.roll, -this.vx * 0.008, dt * 6);
        this.pitch = lerp(this.pitch, -0.15, dt * 3);

        this.mesh.rotation.z = this.roll;
        this.mesh.rotation.x = this.pitch;
        this.mesh.position.set(this.x, this.y, this.z);
    }

    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.traverse(c => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) c.material.dispose();
            });
        }
    }
}
