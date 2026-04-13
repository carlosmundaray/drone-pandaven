// ============================================
// DRONES PANDAVEN 3D — Player Drone (Optimized)
// ============================================
class Player {
    constructor(x,y,z,scene) {
        this.x=x;this.y=y;this.z=z;
        this.vx=0;this.vy=0;
        this.radius=CONFIG.DRONE_SIZE;
        this.alive=true;this.lives=CONFIG.DRONE_MAX_LIVES;this.maxLives=CONFIG.DRONE_MAX_LIVES;
        this.speed=CONFIG.DRONE_SPEED;
        this.boostTimer=0;this.boostCooldown=0;this.boostDirX=0;this.boostDirY=0;
        this.isBoosting=false;this.boostCooldownMax=CONFIG.DRONE_BOOST_COOLDOWN;
        this.invincible=false;this.invincibleTimer=0;
        this.magnetRange=60;this.carryingPackage=false;
        this.animTimer=0;this.damageFlash=0;this.tiltX=0;this.tiltZ=0;
        this.upgrades={speed:0,battery:0,magnet:0,rush:0,boost:0};
        this.scene=scene;this.mesh=null;this.rotors=[];
        this._createMesh();
    }

    _createMesh() {
        this.mesh=new THREE.Group();

        // Body
        const bodyGeo=new THREE.BoxGeometry(18,7,14);
        const bodyMat=new THREE.MeshStandardMaterial({color:0x1a1a1a,metalness:0.7,roughness:0.3});
        this.bodyMesh=new THREE.Mesh(bodyGeo,bodyMat);this.bodyMat=bodyMat;
        this.mesh.add(this.bodyMesh);

        // Yellow top accent
        const topGeo=new THREE.BoxGeometry(14,2.5,10);
        const topMat=new THREE.MeshStandardMaterial({color:0xFFB800,emissive:0xFFB800,emissiveIntensity:0.2,metalness:0.5,roughness:0.3});
        const top=new THREE.Mesh(topGeo,topMat);top.position.y=4.5;
        this.mesh.add(top);

        // Motors + rotors (4)
        const motorGeo=new THREE.CylinderGeometry(2.5,2.5,4,6);
        const motorMat=new THREE.MeshStandardMaterial({color:0x1a1a1a,metalness:0.8,roughness:0.3});
        const rotorGeo=new THREE.CylinderGeometry(7,7,0.5,10);
        const rotorMat=new THREE.MeshStandardMaterial({color:0x333333,transparent:true,opacity:0.4});

        [[-12,6,9],[12,6,9],[-12,6,-9],[12,6,-9]].forEach(([px,py,pz])=>{
            this.mesh.add(new THREE.Mesh(motorGeo,motorMat).translateX(px).translateY(py).translateZ(pz));
            const rotor=new THREE.Mesh(rotorGeo,rotorMat.clone());
            rotor.position.set(px,py+2.5,pz);
            this.mesh.add(rotor);
            this.rotors.push(rotor);
        });

        // Front LED
        const eyeGeo=new THREE.SphereGeometry(1.5,6,6);
        const eyeMat=new THREE.MeshStandardMaterial({color:0x00f0ff,emissive:0x00f0ff,emissiveIntensity:3});
        this.eyeMesh=new THREE.Mesh(eyeGeo,eyeMat);this.eyeMesh.position.set(0,1,-8);
        this.mesh.add(this.eyeMesh);

        // Bottom ring (glow indicator)
        const ringGeo=new THREE.TorusGeometry(5,0.6,6,12);
        const ringMat=new THREE.MeshStandardMaterial({color:0xFFB800,emissive:0xFFB800,emissiveIntensity:1,transparent:true,opacity:0.6});
        this.ringMesh=new THREE.Mesh(ringGeo,ringMat);this.ringMat=ringMat;
        this.ringMesh.rotation.x=Math.PI/2;this.ringMesh.position.y=-4;
        this.mesh.add(this.ringMesh);

        // Single glow light (minimal)
        this.glowLight=new THREE.PointLight(0xFFB800,0.6,80);
        this.glowLight.position.y=-3;
        this.mesh.add(this.glowLight);

        // Package indicator (hidden)
        const pkgGeo=new THREE.BoxGeometry(8,6,8);
        const pkgMat=new THREE.MeshStandardMaterial({color:0x8B6914,emissive:0x8B6914,emissiveIntensity:0.1});
        this.packageMesh=new THREE.Mesh(pkgGeo,pkgMat);this.packageMesh.position.y=-9;this.packageMesh.visible=false;
        const tGeo=new THREE.BoxGeometry(8.5,1.5,8.5);
        const tMat=new THREE.MeshStandardMaterial({color:0xFFB800,emissive:0xFFB800,emissiveIntensity:0.3});
        this.packageMesh.add(new THREE.Mesh(tGeo,tMat));
        this.mesh.add(this.packageMesh);

        this.mesh.position.set(this.x,this.y,this.z);
        this.scene.add(this.mesh);
    }

    applyUpgrades() {
        this.speed=CONFIG.DRONE_SPEED*(1+this.upgrades.speed*0.15);
        this.magnetRange=60+this.upgrades.magnet*25;
        this.boostCooldownMax=CONFIG.DRONE_BOOST_COOLDOWN-this.upgrades.boost*0.3;
        this.maxLives=CONFIG.DRONE_MAX_LIVES+this.upgrades.battery;
        this.lives=this.maxLives;
    }

    update(dt,input,bounds) {
        if(!this.alive) return;
        this.animTimer+=dt;
        const move=input.getMovement();
        if(this.isBoosting){
            this.boostTimer-=dt;
            if(this.boostTimer<=0)this.isBoosting=false;
            else{this.vx=this.boostDirX*CONFIG.DRONE_BOOST_SPEED;this.vy=this.boostDirY*CONFIG.DRONE_BOOST_SPEED;}
        } else {
            this.vx+=move.x*CONFIG.DRONE_ACCEL*dt;
            this.vy+=move.y*CONFIG.DRONE_ACCEL*dt;
            this.vx*=CONFIG.DRONE_FRICTION;this.vy*=CONFIG.DRONE_FRICTION;
            const spd=Math.sqrt(this.vx*this.vx+this.vy*this.vy);
            if(spd>this.speed){this.vx=(this.vx/spd)*this.speed;this.vy=(this.vy/spd)*this.speed;}
        }
        this.boostCooldown-=dt;
        if(input.isDashPressed()&&this.boostCooldown<=0&&!this.isBoosting){
            const dir=move.x!==0||move.y!==0?normalize(move.x,move.y):{x:0,y:0};
            this.boostDirX=dir.x;this.boostDirY=dir.y;
            this.isBoosting=true;this.boostTimer=CONFIG.DRONE_BOOST_DURATION;this.boostCooldown=this.boostCooldownMax;
        }
        this.x+=this.vx*dt;this.y+=this.vy*dt;
        if(bounds){
            this.x=clamp(this.x,bounds.left+this.radius,bounds.right-this.radius);
            this.y=clamp(this.y,bounds.bottom+this.radius,bounds.top-this.radius);
        }
        if(this.invincible){this.invincibleTimer-=dt;if(this.invincibleTimer<=0)this.invincible=false;}
        if(this.damageFlash>0)this.damageFlash-=dt*4;
        this._updateMesh(dt);
    }

    _updateMesh(dt) {
        if(!this.mesh)return;
        this.mesh.position.set(this.x,this.y,this.z);
        this.tiltZ=lerp(this.tiltZ,-this.vx*0.002,8*dt);
        this.tiltX=lerp(this.tiltX,this.vy*0.002,8*dt);
        this.mesh.rotation.set(this.tiltX,0,this.tiltZ);
        for(const r of this.rotors) r.rotation.y+=dt*60;
        this.mesh.visible=this.invincible?Math.sin(this.animTimer*25)<0.3:true;
        if(this.bodyMat){
            if(this.damageFlash>0){this.bodyMat.emissive=new THREE.Color(0xff1744);this.bodyMat.emissiveIntensity=this.damageFlash;}
            else{this.bodyMat.emissive=new THREE.Color(0);this.bodyMat.emissiveIntensity=0;}
        }
        if(this.ringMat){
            this.ringMat.emissiveIntensity=0.5+Math.sin(this.animTimer*4)*0.3;
            const hex=this.carryingPackage?0x00ff88:0xFFB800;
            this.ringMat.color.setHex(hex);this.ringMat.emissive.setHex(hex);
        }
        if(this.glowLight){
            this.glowLight.intensity=this.isBoosting?2:0.4;
            this.glowLight.color.setHex(this.isBoosting?0x00f0ff:0xFFB800);
        }
        if(this.packageMesh){
            this.packageMesh.visible=this.carryingPackage;
            if(this.carryingPackage)this.packageMesh.rotation.y+=dt*0.5;
        }
    }

    takeDamage(particles,audio) {
        if(this.invincible||this.isBoosting)return false;
        this.lives--;this.damageFlash=1;this.invincible=true;this.invincibleTimer=CONFIG.DRONE_INVINCIBILITY_TIME;
        particles.emit(this.x,this.y,this.z,'damage',15);audio.playDamage();
        if(this.carryingPackage)this.carryingPackage=false;
        if(this.lives<=0){this.alive=false;particles.emit(this.x,this.y,this.z,'explosion',30);return true;}
        return false;
    }

    dispose() {
        if(this.mesh&&this.scene){this.scene.remove(this.mesh);
        this.mesh.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose();});}
    }
}
