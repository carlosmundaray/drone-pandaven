// ============================================
// DRONES PANDAVEN 3D — Player Drone (Third Person Visible)
// ============================================
class Player {
    constructor(x,y,z,scene) {
        this.x=x; this.y=y; this.z=z;
        this.vx=0; this.vy=0; this.vz=0;
        this.radius=CONFIG.DRONE_SIZE;
        this.alive=true;
        this.lives=CONFIG.DRONE_MAX_LIVES;
        this.maxLives=CONFIG.DRONE_MAX_LIVES;
        this.speed=CONFIG.DRONE_SPEED;

        // Boost
        this.boostTimer=0;
        this.boostCooldown=0;
        this.isBoosting=false;
        this.boostCooldownMax=CONFIG.DRONE_BOOST_COOLDOWN;

        // Invincibility
        this.invincible=false;
        this.invincibleTimer=0;

        // Package
        this.magnetRange=60;
        this.carryingPackage=false;

        // Animation
        this.animTimer=0;
        this.damageFlash=0;

        // Barrel roll
        this.barrelRollCooldown=0;
        this.barrelRolling=false;
        this.barrelRollTimer=0;
        this.barrelRollDir=0;

        // EMP Shield
        this.empShieldActive=false;
        this.empShieldTimer=0;

        // Shooting
        this.shootCooldown=0;
        this.shootCooldownMax=0.2; // fire rate
        this.projectiles=[];

        // Upgrades
        this.upgrades={speed:0,battery:0,magnet:0,rush:0,boost:0};

        // Scene
        this.scene=scene;
        this.droneGroup=null;
        this.rotors=[];
        this.packageMesh=null;
        this.shieldMesh=null;

        // Speed tracking
        this.currentSpeed=0;

        // Jammer effect
        this.jammed=false;
        this.jamIntensity=0;

        this._createDrone();
    }

    _createDrone() {
        this.droneGroup = new THREE.Group();

        // Main body
        const bodyGeo = new THREE.BoxGeometry(12, 4, 10);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a, metalness:0.7, roughness:0.3
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        this.droneGroup.add(body);

        // Yellow accents on body
        const accentGeo = new THREE.BoxGeometry(12.5, 1, 10.5);
        const accentMat = new THREE.MeshStandardMaterial({
            color: 0xFFB800, metalness:0.5, roughness:0.3,
            emissive: 0xFFB800, emissiveIntensity: 0.2
        });
        const accent = new THREE.Mesh(accentGeo, accentMat);
        accent.position.y = 1;
        this.droneGroup.add(accent);

        // Camera/sensor dome (front)
        const domeGeo = new THREE.SphereGeometry(2.5, 8, 6, 0, Math.PI*2, 0, Math.PI/2);
        const domeMat = new THREE.MeshStandardMaterial({
            color: 0x333333, metalness:0.9, roughness:0.1
        });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.rotation.x = Math.PI;
        dome.position.set(0, -1.5, -4);
        this.droneGroup.add(dome);

        // Lens (emissive)
        const lensGeo = new THREE.SphereGeometry(1, 6, 6);
        const lensMat = new THREE.MeshStandardMaterial({
            color: 0x0088cc, emissive: 0x0088cc, emissiveIntensity: 1
        });
        this.lensMesh = new THREE.Mesh(lensGeo, lensMat);
        this.lensMesh.position.set(0, -1.5, -5);
        this.droneGroup.add(this.lensMesh);

        // 4 Arms + Motors + Rotors
        const armPositions = [
            [-12, 0, -8],  // front-left
            [12, 0, -8],   // front-right
            [-12, 0, 8],   // back-left
            [12, 0, 8]     // back-right
        ];

        const armMat = new THREE.MeshStandardMaterial({
            color: 0x333333, metalness:0.7, roughness:0.3
        });
        const motorMat = new THREE.MeshStandardMaterial({
            color: 0x222222, metalness:0.8, roughness:0.2
        });
        const rotorMat = new THREE.MeshStandardMaterial({
            color: 0x888888, transparent:true, opacity:0.25
        });

        armPositions.forEach(([px, py, pz]) => {
            // Arm
            const armDir = px > 0 ? 1 : -1;
            const armGeo = new THREE.BoxGeometry(Math.abs(px)-4, 1.5, 2);
            const arm = new THREE.Mesh(armGeo, armMat);
            arm.position.set(armDir*(Math.abs(px)/2+2), py, pz);
            this.droneGroup.add(arm);

            // Motor
            const motorGeo = new THREE.CylinderGeometry(2.5, 2.5, 3, 6);
            const motor = new THREE.Mesh(motorGeo, motorMat);
            motor.position.set(px, py+2, pz);
            this.droneGroup.add(motor);

            // Rotor disc
            const rotorGeo = new THREE.CylinderGeometry(8, 8, 0.4, 8);
            const rotor = new THREE.Mesh(rotorGeo, rotorMat.clone());
            rotor.position.set(px, py+4, pz);
            this.droneGroup.add(rotor);
            this.rotors.push(rotor);
        });

        // Landing gear
        [-1,1].forEach(side => {
            const gearGeo = new THREE.CylinderGeometry(0.4, 0.4, 6, 4);
            const gearMat = new THREE.MeshStandardMaterial({color:0x444444,metalness:0.6,roughness:0.4});
            const gear = new THREE.Mesh(gearGeo, gearMat);
            gear.position.set(side*8, -4, 0);
            this.droneGroup.add(gear);
            // Feet
            const footGeo = new THREE.BoxGeometry(12, 0.5, 1.5);
            const foot = new THREE.Mesh(footGeo, gearMat);
            foot.position.set(side*8, -7, 0);
            this.droneGroup.add(foot);
        });

        // Status LED
        const ledGeo = new THREE.SphereGeometry(0.6, 6, 6);
        const ledMat = new THREE.MeshStandardMaterial({
            color:0x00cc66, emissive:0x00cc66, emissiveIntensity:2
        });
        this.statusLED = new THREE.Mesh(ledGeo, ledMat);
        this.statusLED.position.set(0, 2.5, 5);
        this.droneGroup.add(this.statusLED);

        // Front weapon barrels
        [-1,1].forEach(side => {
            const barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 4);
            const barrelMat = new THREE.MeshStandardMaterial({color:0x555555,metalness:0.9,roughness:0.2});
            const barrel = new THREE.Mesh(barrelGeo, barrelMat);
            barrel.rotation.x = Math.PI/2;
            barrel.position.set(side*4, -0.5, -7);
            this.droneGroup.add(barrel);
        });

        // Muzzle flash indicators
        const mfGeo = new THREE.SphereGeometry(1.5, 4, 4);
        const mfMat = new THREE.MeshStandardMaterial({
            color:0xFFDD44, emissive:0xFFDD44, emissiveIntensity:0,
            transparent:true, opacity:0
        });
        this.muzzleL = new THREE.Mesh(mfGeo, mfMat.clone());
        this.muzzleL.position.set(-4, -0.5, -10);
        this.droneGroup.add(this.muzzleL);
        this.muzzleR = new THREE.Mesh(mfGeo, mfMat.clone());
        this.muzzleR.position.set(4, -0.5, -10);
        this.droneGroup.add(this.muzzleR);

        // Package hanging below
        const pkgGeo = new THREE.BoxGeometry(8, 6, 8);
        const pkgMat = new THREE.MeshStandardMaterial({
            color:0x8B6914, emissive:0x8B6914, emissiveIntensity:0.1
        });
        this.packageMesh = new THREE.Mesh(pkgGeo, pkgMat);
        this.packageMesh.position.set(0, -10, 0);
        this.packageMesh.visible = false;
        const tapeMesh = new THREE.Mesh(
            new THREE.BoxGeometry(8.5,1.5,8.5),
            new THREE.MeshStandardMaterial({color:0xFFB800,emissive:0xFFB800,emissiveIntensity:0.3})
        );
        this.packageMesh.add(tapeMesh);
        this.droneGroup.add(this.packageMesh);

        // EMP Shield sphere
        const shieldGeo = new THREE.SphereGeometry(CONFIG.EMP_SHIELD_RADIUS, 16, 12);
        const shieldMat = new THREE.MeshStandardMaterial({
            color:0x00ccff, emissive:0x00ccff, emissiveIntensity:0.5,
            transparent:true, opacity:0, side:THREE.DoubleSide,
            wireframe:true
        });
        this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        this.shieldMat = shieldMat;
        this.droneGroup.add(this.shieldMesh);

        this.droneGroup.position.set(this.x, this.y, this.z);
        this.scene.add(this.droneGroup);
    }

    applyUpgrades() {
        this.speed = CONFIG.DRONE_SPEED * (1 + this.upgrades.speed * 0.15);
        this.magnetRange = 60 + this.upgrades.magnet * 25;
        this.boostCooldownMax = CONFIG.DRONE_BOOST_COOLDOWN - this.upgrades.boost * 0.3;
        this.maxLives = CONFIG.DRONE_MAX_LIVES + this.upgrades.battery;
        this.lives = this.maxLives;
    }

    // --- SHOOTING ---
    shoot(camera) {
        if(this.shootCooldown > 0) return;
        this.shootCooldown = this.shootCooldownMax;

        const aim = camera.getAimDirection();
        // Fire from both barrels
        [-4, 4].forEach(side => {
            // Transform barrel position by drone yaw
            const cosY = Math.cos(camera.yaw);
            const sinY = Math.sin(camera.yaw);
            const localX = side, localZ = -10;
            const worldX = this.x + localX*cosY - localZ*sinY;
            const worldZ = this.z + localX*sinY + localZ*cosY;

            const proj = new Projectile(
                worldX, this.y - 0.5, worldZ,
                aim.x, aim.y, aim.z,
                CONFIG.PROJECTILE_SPEED * 1.8,
                this.scene, false
            );
            // Player projectiles are blue
            if(proj.mesh) {
                proj.mesh.material.color.setHex(0x00bbff);
                proj.mesh.material.emissive.setHex(0x00bbff);
            }
            if(proj.light) proj.light.color.setHex(0x00bbff);
            this.projectiles.push(proj);
        });

        // Muzzle flash
        if(this.muzzleL) {
            this.muzzleL.material.emissiveIntensity = 8;
            this.muzzleL.material.opacity = 1;
        }
        if(this.muzzleR) {
            this.muzzleR.material.emissiveIntensity = 8;
            this.muzzleR.material.opacity = 1;
        }
    }

    update(dt, input, bounds, camera) {
        if (!this.alive) return;
        this.animTimer += dt;

        // Camera-relative movement
        const forward = camera.getForward();
        const right = camera.getRight();
        const move = input.getMovement();

        const worldMoveX = move.x * right.x + move.y * forward.x;
        const worldMoveZ = move.x * right.z + move.y * forward.z;

        // Vertical — Space = ascend, Shift = descend (strong)
        let vertMove = 0;
        if (input.keys['Space']) vertMove += 1;
        if (input.keys['ShiftLeft'] || input.keys['ShiftRight']) vertMove -= 1;

        if (!this.barrelRolling) {
            this.vx += worldMoveX * CONFIG.DRONE_ACCEL * dt;
            this.vz += worldMoveZ * CONFIG.DRONE_ACCEL * dt;
            this.vy += vertMove * CONFIG.DRONE_ACCEL * 0.9 * dt;
        }

        // Friction
        this.vx *= CONFIG.DRONE_FRICTION;
        this.vy *= CONFIG.DRONE_FRICTION;
        this.vz *= CONFIG.DRONE_FRICTION;

        // Speed cap
        const hSpd = Math.sqrt(this.vx*this.vx + this.vz*this.vz);
        if (hSpd > this.speed) {
            this.vx = (this.vx/hSpd) * this.speed;
            this.vz = (this.vz/hSpd) * this.speed;
        }
        if (Math.abs(this.vy) > this.speed * 0.8) {
            this.vy = Math.sign(this.vy) * this.speed * 0.8;
        }

        this.currentSpeed = Math.sqrt(this.vx*this.vx + this.vy*this.vy + this.vz*this.vz);

        // Boost (F key)
        this.boostCooldown -= dt;
        if (this.isBoosting) {
            this.boostTimer -= dt;
            if (this.boostTimer <= 0) this.isBoosting = false;
            else {
                this.vx += forward.x * CONFIG.DRONE_BOOST_SPEED * dt * 5;
                this.vz += forward.z * CONFIG.DRONE_BOOST_SPEED * dt * 5;
            }
        }
        if (input.isBoostPressed && input.isBoostPressed() && this.boostCooldown <= 0 && !this.isBoosting) {
            this.isBoosting = true;
            this.boostTimer = CONFIG.DRONE_BOOST_DURATION;
            this.boostCooldown = this.boostCooldownMax;
        }

        // Barrel roll
        this.barrelRollCooldown -= dt;
        if (input.isBarrelRollLeft() && this.barrelRollCooldown <= 0 && !this.barrelRolling) {
            this.barrelRolling = true;
            this.barrelRollTimer = CONFIG.BARREL_ROLL_DURATION;
            this.barrelRollDir = -1;
            this.barrelRollCooldown = CONFIG.BARREL_ROLL_COOLDOWN;
            this.invincible = true;
            this.invincibleTimer = Math.max(this.invincibleTimer, CONFIG.BARREL_ROLL_DURATION);
            camera.startBarrelRoll(-1);
            this.vx -= right.x * 200;
            this.vz -= right.z * 200;
        }
        if (input.isBarrelRollRight() && this.barrelRollCooldown <= 0 && !this.barrelRolling) {
            this.barrelRolling = true;
            this.barrelRollTimer = CONFIG.BARREL_ROLL_DURATION;
            this.barrelRollDir = 1;
            this.barrelRollCooldown = CONFIG.BARREL_ROLL_COOLDOWN;
            this.invincible = true;
            this.invincibleTimer = Math.max(this.invincibleTimer, CONFIG.BARREL_ROLL_DURATION);
            camera.startBarrelRoll(1);
            this.vx += right.x * 200;
            this.vz += right.z * 200;
        }
        if (this.barrelRolling) {
            this.barrelRollTimer -= dt;
            if (this.barrelRollTimer <= 0) this.barrelRolling = false;
        }

        // EMP Shield
        if (this.empShieldActive) {
            this.empShieldTimer -= dt;
            if (this.empShieldTimer <= 0) this.empShieldActive = false;
        }

        // Shoot cooldown
        this.shootCooldown -= dt;

        // Apply velocity
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.z += this.vz * dt;

        // Bounds
        if (bounds) {
            this.x = clamp(this.x, bounds.left + this.radius, bounds.right - this.radius);
            this.y = clamp(this.y, bounds.bottom + this.radius, bounds.top - this.radius);
        }

        // Invincibility
        if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }
        if (this.damageFlash > 0) this.damageFlash -= dt * 4;

        // Jammer decay
        if (this.jamIntensity > 0) this.jamIntensity -= dt * 2;
        if (this.jamIntensity < 0) this.jamIntensity = 0;

        // Update projectiles
        for(const p of this.projectiles) p.update(dt);
        this.projectiles = this.projectiles.filter(p => p.active);

        this._updateDrone(dt, camera);
    }

    activateEMP(rushMeter) {
        if (this.empShieldActive) return rushMeter;
        if (rushMeter < CONFIG.EMP_SHIELD_COST) return rushMeter;
        this.empShieldActive = true;
        this.empShieldTimer = CONFIG.EMP_SHIELD_DURATION;
        this.invincible = true;
        this.invincibleTimer = Math.max(this.invincibleTimer, CONFIG.EMP_SHIELD_DURATION);
        return rushMeter - CONFIG.EMP_SHIELD_COST;
    }

    _updateDrone(dt, camera) {
        if (!this.droneGroup) return;
        this.droneGroup.position.set(this.x, this.y, this.z);

        // Drone always faces camera yaw direction
        this.droneGroup.rotation.y = camera.yaw;

        // Tilt based on movement
        const moveAngle = Math.atan2(this.vx, -this.vz);
        const pitchTilt = clamp(-this.vz / this.speed * 0.2, -0.3, 0.3);
        const rollTilt = clamp(this.vx / this.speed * 0.25, -0.3, 0.3);
        this.droneGroup.rotation.x = lerp(this.droneGroup.rotation.x, pitchTilt, 5*dt);
        this.droneGroup.rotation.z = lerp(this.droneGroup.rotation.z, -rollTilt, 5*dt);

        // Barrel roll visual
        if (this.barrelRolling) {
            const t = 1 - (this.barrelRollTimer / CONFIG.BARREL_ROLL_DURATION);
            this.droneGroup.rotation.z = this.barrelRollDir * t * Math.PI * 2;
        }

        // Spin rotors
        for (const r of this.rotors) {
            r.rotation.y += dt * 60;
        }

        // Package
        if (this.packageMesh) {
            this.packageMesh.visible = this.carryingPackage;
            if (this.carryingPackage) {
                this.packageMesh.rotation.y += dt * 0.5;
                this.packageMesh.position.y = -10 + Math.sin(this.animTimer * 2) * 0.5;
            }
        }

        // Status LED
        if (this.statusLED) {
            if (this.empShieldActive) {
                this.statusLED.material.color.setHex(0x00ccff);
                this.statusLED.material.emissive.setHex(0x00ccff);
            } else if (this.carryingPackage) {
                this.statusLED.material.color.setHex(0x00ff88);
                this.statusLED.material.emissive.setHex(0x00ff88);
            } else if (this.damageFlash > 0) {
                this.statusLED.material.color.setHex(0xff1744);
                this.statusLED.material.emissive.setHex(0xff1744);
            } else {
                this.statusLED.material.color.setHex(0x00cc66);
                this.statusLED.material.emissive.setHex(0x00cc66);
            }
            this.statusLED.material.emissiveIntensity = 1.5 + Math.sin(this.animTimer * 4) * 0.5;
        }

        // Lens glow
        if (this.lensMesh) {
            this.lensMesh.material.emissiveIntensity = 0.8 + Math.sin(this.animTimer * 3) * 0.3;
        }

        // EMP Shield visual
        if (this.shieldMat) {
            if (this.empShieldActive) {
                this.shieldMat.opacity = 0.15 + Math.sin(this.animTimer * 12) * 0.08;
                this.shieldMat.emissiveIntensity = 0.5 + Math.sin(this.animTimer * 8) * 0.3;
                this.shieldMesh.rotation.y += dt * 2;
                this.shieldMesh.rotation.x += dt * 1.5;
            } else {
                this.shieldMat.opacity = 0;
            }
        }

        // Muzzle flash decay
        if (this.muzzleL && this.muzzleL.material.emissiveIntensity > 0) {
            this.muzzleL.material.emissiveIntensity = Math.max(0, this.muzzleL.material.emissiveIntensity - dt*40);
            this.muzzleL.material.opacity = Math.max(0, this.muzzleL.material.opacity - dt*20);
        }
        if (this.muzzleR && this.muzzleR.material.emissiveIntensity > 0) {
            this.muzzleR.material.emissiveIntensity = Math.max(0, this.muzzleR.material.emissiveIntensity - dt*40);
            this.muzzleR.material.opacity = Math.max(0, this.muzzleR.material.opacity - dt*20);
        }

        // Invincibility flicker
        if (this.invincible && !this.barrelRolling && !this.empShieldActive) {
            this.droneGroup.visible = Math.sin(this.animTimer * 25) > 0.3;
        } else {
            this.droneGroup.visible = true;
        }
    }

    takeDamage(particles, audio) {
        if (this.invincible || this.barrelRolling || this.empShieldActive) return false;
        this.lives--;
        this.damageFlash = 1;
        this.invincible = true;
        this.invincibleTimer = CONFIG.DRONE_INVINCIBILITY_TIME;
        particles.emit(this.x, this.y, this.z, 'damage', 15);
        audio.playDamage();
        if (this.carryingPackage) this.carryingPackage = false;
        if (this.lives <= 0) {
            this.alive = false;
            particles.emit(this.x, this.y, this.z, 'explosion', 30);
            return true;
        }
        return false;
    }

    dispose() {
        // Clean up player projectiles
        for(const p of this.projectiles) p.dispose();
        this.projectiles = [];
        if (this.droneGroup && this.scene) {
            this.scene.remove(this.droneGroup);
            this.droneGroup.traverse(c => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) c.material.dispose();
            });
        }
    }
}
