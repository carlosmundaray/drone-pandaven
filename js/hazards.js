// ============================================
// DRONES PANDAVEN 3D — Obstacles & Enemies (FPS)
// ============================================

class Obstacle {
    constructor(x,y,z,type,scene) {
        this.x=x; this.y=y; this.z=z; this.type=type;
        this.active=true; this.scene=scene; this.mesh=null;
        this.width=20; this.height=20; this.depth=20;
    }
    update(dt) {}
    dispose() {
        if(this.mesh&&this.scene) {
            this.scene.remove(this.mesh);
            this.mesh.traverse(child => {
                if(child.geometry) child.geometry.dispose();
                if(child.material) {
                    if(Array.isArray(child.material)) child.material.forEach(m=>m.dispose());
                    else child.material.dispose();
                }
            });
        }
    }
}

// --- Building ---
class Building extends Obstacle {
    constructor(x,y,z,w,h,d,scene) {
        super(x,y,z,'building',scene);
        this.width=w; this.height=h; this.depth=d;
        this._create();
    }
    _create() {
        this.mesh = new THREE.Group();
        const bodyGeo = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const texCanvas = document.createElement('canvas');
        texCanvas.width=128; texCanvas.height=256;
        const tctx = texCanvas.getContext('2d');
        const baseColors = ['#C8BEB0','#A8A098','#D8D0C4','#B0A898','#E0D8CC','#8A8880'];
        tctx.fillStyle = randomChoice(baseColors);
        tctx.fillRect(0,0,128,256);
        const winColors = ['#6BAADD','#88BBE8','#5599CC','#AAD4F0','#447799'];
        const winColor = randomChoice(winColors);
        const rows=12, cols=5;
        for(let r=0;r<rows;r++) {
            for(let c=0;c<cols;c++) {
                if(Math.random()<0.35) continue;
                tctx.fillStyle=winColor;
                tctx.globalAlpha=randomRange(0.3,0.9);
                tctx.fillRect(8+c*24,8+r*20,16,12);
            }
        }
        tctx.globalAlpha=1;
        if(Math.random()<0.3) {
            tctx.fillStyle=randomChoice(['#CC4444','#4488CC','#44AA44','#CC8844']);
            tctx.globalAlpha=0.7;
            tctx.fillRect(10,100,108,14);
            tctx.globalAlpha=1;
        }
        const texture = new THREE.CanvasTexture(texCanvas);
        texture.wrapS=THREE.RepeatWrapping; texture.wrapT=THREE.RepeatWrapping;
        const bodyMat = new THREE.MeshStandardMaterial({map:texture,metalness:0.4,roughness:0.6});
        const body = new THREE.Mesh(bodyGeo,bodyMat);
        body.position.y=this.height/2;
        this.mesh.add(body);
        if(Math.random()<0.4) {
            const antGeo=new THREE.CylinderGeometry(0.5,0.5,25,4);
            const antMat=new THREE.MeshStandardMaterial({color:0x444444,metalness:0.8,roughness:0.3});
            const ant=new THREE.Mesh(antGeo,antMat);
            ant.position.y=this.height+12;
            this.mesh.add(ant);
            const tipGeo=new THREE.SphereGeometry(1.5,6,6);
            const tipMat=new THREE.MeshStandardMaterial({color:0xff1744,emissive:0xff1744,emissiveIntensity:2});
            this.tipMesh=new THREE.Mesh(tipGeo,tipMat);
            this.tipMesh.position.y=this.height+25;
            this.mesh.add(this.tipMesh);
        }
        this.mesh.position.set(this.x,this.y,this.z);
        this.scene.add(this.mesh);
    }
    update(dt) {
        if(this.tipMesh) this.tipMesh.material.emissiveIntensity=Math.sin(Date.now()*0.003)>0?2:0.1;
    }
}

// --- Crane ---
class Crane extends Obstacle {
    constructor(x,y,z,scene) {
        super(x,y,z,'crane',scene);
        this.armAngle=0;
        this.armSpeed=randomRange(0.3,0.8)*randomChoice([-1,1]);
        this.armLength=randomRange(50,80);
        this.width=12; this.height=180; this.depth=12;
        this._create();
    }
    _create() {
        this.mesh=new THREE.Group();
        const tGeo=new THREE.BoxGeometry(10,180,10);
        const tMat=new THREE.MeshStandardMaterial({color:0xFFB800,metalness:0.6,roughness:0.4});
        const tower=new THREE.Mesh(tGeo,tMat); tower.position.y=90;
        this.mesh.add(tower);
        const aGeo=new THREE.BoxGeometry(this.armLength,5,5);
        this.armMesh=new THREE.Mesh(aGeo,tMat);
        this.armMesh.position.set(this.armLength/2,180,0);
        this.mesh.add(this.armMesh);
        this.mesh.position.set(this.x,this.y,this.z);
        this.scene.add(this.mesh);
    }
    update(dt) {
        this.armAngle+=this.armSpeed*dt;
        if(this.armMesh) this.armMesh.rotation.y=this.armAngle;
    }
}

// --- Projectile ---
class Projectile {
    constructor(x,y,z,dx,dy,dz,speed,scene,isEnemy=true) {
        this.x=x; this.y=y; this.z=z;
        const len=Math.sqrt(dx*dx+dy*dy+dz*dz)||1;
        this.dx=dx/len; this.dy=dy/len; this.dz=dz/len;
        this.speed=speed||CONFIG.PROJECTILE_SPEED;
        this.radius=CONFIG.PROJECTILE_RADIUS;
        this.active=true;
        this.life=0;
        this.maxLife=CONFIG.PROJECTILE_LIFE;
        this.scene=scene;
        this.isEnemy=isEnemy;
        this._create();
    }
    _create() {
        const geo=new THREE.SphereGeometry(this.radius,6,6);
        const mat=new THREE.MeshStandardMaterial({
            color:0xff2244,emissive:0xff2244,emissiveIntensity:3,transparent:true,opacity:0.9
        });
        this.mesh=new THREE.Mesh(geo,mat);
        // Trail light
        this.light=new THREE.PointLight(0xff2244,0.8,40);
        this.mesh.add(this.light);
        this.mesh.position.set(this.x,this.y,this.z);
        this.scene.add(this.mesh);
    }
    update(dt) {
        this.life+=dt;
        if(this.life>=this.maxLife) { this.active=false; this.dispose(); return; }
        this.x+=this.dx*this.speed*dt;
        this.y+=this.dy*this.speed*dt;
        this.z+=this.dz*this.speed*dt;
        if(this.mesh) {
            this.mesh.position.set(this.x,this.y,this.z);
            this.mesh.material.emissiveIntensity=2+Math.sin(this.life*20);
        }
    }
    checkHitPlayer(player) {
        if(!this.active||!player.alive) return false;
        return distance3D(this.x,this.y,this.z,player.x,player.y,player.z) < this.radius+player.radius;
    }
    checkHitShield(player) {
        if(!this.active||!player.empShieldActive) return false;
        return distance3D(this.x,this.y,this.z,player.x,player.y,player.z) < CONFIG.EMP_SHIELD_RADIUS;
    }
    dispose() {
        if(this.mesh&&this.scene) {
            this.scene.remove(this.mesh);
            this.mesh.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose();});
        }
    }
}

// --- Enemy Drone (Patrulla) ---
class EnemyDrone extends Obstacle {
    constructor(x,y,z,scene) {
        super(x,y,z,'enemy_drone',scene);
        this.width=16; this.height=8; this.depth=16;
        this.moveTimer=Math.random()*6.28;
        this.moveAmpX=randomRange(30,70);
        this.moveAmpY=randomRange(15,35);
        this.moveSpdX=randomRange(0.8,1.4);
        this.moveSpdY=randomRange(1,1.8);
        this.baseX=x; this.baseY=y;
        // Combat
        this.fireTimer=randomRange(1,CONFIG.ENEMY_FIRE_RATE_MAX);
        this.fireRate=randomRange(CONFIG.ENEMY_FIRE_RATE_MIN,CONFIG.ENEMY_FIRE_RATE_MAX);
        this.detectedPlayer=false;
        this.projectiles=[];
        this._create();
    }
    _create() {
        this.mesh=new THREE.Group();
        const bGeo=new THREE.BoxGeometry(12,5,10);
        const bMat=new THREE.MeshStandardMaterial({color:0xff2d78,emissive:0xff2d78,emissiveIntensity:0.3,metalness:0.6,roughness:0.3});
        this.mesh.add(new THREE.Mesh(bGeo,bMat));
        const rGeo=new THREE.CylinderGeometry(8,8,0.5,8);
        const rMat=new THREE.MeshStandardMaterial({color:0x333333,transparent:true,opacity:0.3});
        this.rotor=new THREE.Mesh(rGeo,rMat);
        this.rotor.position.y=4;
        this.mesh.add(this.rotor);
        // Angry eye
        const eGeo=new THREE.SphereGeometry(2,6,6);
        const eMat=new THREE.MeshStandardMaterial({color:0xff1744,emissive:0xff1744,emissiveIntensity:3});
        this.eyeMesh=new THREE.Mesh(eGeo,eMat);
        this.eyeMesh.position.set(0,0,-6);
        this.mesh.add(this.eyeMesh);
        // Weapon barrel
        const wGeo=new THREE.CylinderGeometry(0.8,0.8,6,4);
        const wMat=new THREE.MeshStandardMaterial({color:0x444444,metalness:0.9,roughness:0.2});
        this.weaponMesh=new THREE.Mesh(wGeo,wMat);
        this.weaponMesh.rotation.x=Math.PI/2;
        this.weaponMesh.position.set(0,-1,-8);
        this.mesh.add(this.weaponMesh);
        this.mesh.position.set(this.x,this.y,this.z);
        this.scene.add(this.mesh);
    }
    update(dt,player) {
        this.moveTimer+=dt;
        this.x=this.baseX+Math.sin(this.moveTimer*this.moveSpdX)*this.moveAmpX;
        this.y=this.baseY+Math.sin(this.moveTimer*this.moveSpdY)*this.moveAmpY;
        if(this.mesh) {
            this.mesh.position.set(this.x,this.y,this.z);
            this.mesh.rotation.z=Math.sin(this.moveTimer*this.moveSpdX)*0.15;
            // Look at player if detected
            if(player&&this.detectedPlayer) {
                const dx=player.x-this.x, dz=player.z-this.z;
                this.mesh.rotation.y=Math.atan2(dx,dz);
            }
        }
        if(this.rotor) this.rotor.rotation.y+=dt*50;
        // Eye pulse when detecting
        if(this.eyeMesh) {
            this.eyeMesh.material.emissiveIntensity=this.detectedPlayer?3+Math.sin(this.moveTimer*8):2;
        }
        // Detection & firing
        if(player&&player.alive) {
            const dist=distance3D(this.x,this.y,this.z,player.x,player.y,player.z);
            this.detectedPlayer = dist < CONFIG.PATROL_DETECT_RANGE;
            if(this.detectedPlayer && dist < CONFIG.PATROL_SHOOT_RANGE) {
                this.fireTimer-=dt;
                if(this.fireTimer<=0) {
                    this.fireTimer=this.fireRate;
                    // Shoot at player
                    const dx=player.x-this.x;
                    const dy=player.y-this.y;
                    const dz=player.z-this.z;
                    this.projectiles.push(new Projectile(
                        this.x, this.y, this.z,
                        dx, dy, dz,
                        CONFIG.PROJECTILE_SPEED,
                        this.scene
                    ));
                }
            }
        }
        // Update projectiles
        for(const p of this.projectiles) p.update(dt);
        this.projectiles=this.projectiles.filter(p=>p.active);
    }
    dispose() {
        for(const p of this.projectiles) p.dispose();
        this.projectiles=[];
        super.dispose();
    }
}

// --- Kamikaze Drone ---
class KamikazeDrone extends Obstacle {
    constructor(x,y,z,scene) {
        super(x,y,z,'kamikaze',scene);
        this.width=12; this.height=6; this.depth=12;
        this.activated=false;
        this.baseX=x; this.baseY=y;
        this.hoverTimer=Math.random()*6.28;
        this._create();
    }
    _create() {
        this.mesh=new THREE.Group();
        const bGeo=new THREE.BoxGeometry(10,4,8);
        const bMat=new THREE.MeshStandardMaterial({color:0xff4400,emissive:0xff4400,emissiveIntensity:0.5,metalness:0.6,roughness:0.3});
        this.bodyMat=bMat;
        this.mesh.add(new THREE.Mesh(bGeo,bMat));
        // Wings
        [-1,1].forEach(s=>{
            const wGeo=new THREE.BoxGeometry(8,1,5);
            const w=new THREE.Mesh(wGeo,bMat);
            w.position.set(s*9,0,0);
            w.rotation.z=s*-0.2;
            this.mesh.add(w);
        });
        // Eye
        const eGeo=new THREE.SphereGeometry(1.8,6,6);
        const eMat=new THREE.MeshStandardMaterial({color:0xffaa00,emissive:0xffaa00,emissiveIntensity:3});
        this.eyeMat=eMat;
        const eye=new THREE.Mesh(eGeo,eMat);
        eye.position.set(0,0,-5);
        this.mesh.add(eye);
        // Trail
        this.trailLight=new THREE.PointLight(0xff4400,0,50);
        this.trailLight.position.set(0,0,6);
        this.mesh.add(this.trailLight);
        this.mesh.position.set(this.x,this.y,this.z);
        this.scene.add(this.mesh);
    }
    update(dt,player) {
        this.hoverTimer+=dt;
        if(!this.activated) {
            // Hover
            this.y=this.baseY+Math.sin(this.hoverTimer*2)*5;
            if(player&&player.alive) {
                const dist=distance3D(this.x,this.y,this.z,player.x,player.y,player.z);
                if(dist<CONFIG.KAMIKAZE_DETECT_RANGE) {
                    this.activated=true;
                }
            }
        } else {
            // Chase player
            if(player&&player.alive) {
                const dx=player.x-this.x, dy=player.y-this.y, dz=player.z-this.z;
                const dist=Math.sqrt(dx*dx+dy*dy+dz*dz)||1;
                this.x+=dx/dist*CONFIG.KAMIKAZE_SPEED*dt;
                this.y+=dy/dist*CONFIG.KAMIKAZE_SPEED*dt;
                this.z+=dz/dist*CONFIG.KAMIKAZE_SPEED*dt;
                if(this.mesh) {
                    this.mesh.rotation.y=Math.atan2(dx,dz);
                    this.mesh.rotation.x=Math.atan2(dy,Math.sqrt(dx*dx+dz*dz))*0.3;
                }
            }
            if(this.bodyMat) this.bodyMat.emissiveIntensity=1+Math.sin(this.hoverTimer*12)*0.3;
            if(this.trailLight) this.trailLight.intensity=1.5;
        }
        if(this.mesh) this.mesh.position.set(this.x,this.y,this.z);
        if(this.eyeMat) this.eyeMat.emissiveIntensity=this.activated?4:2;
    }
}

// --- Jammer Drone ---
class JammerDrone extends Obstacle {
    constructor(x,y,z,scene) {
        super(x,y,z,'jammer',scene);
        this.width=14; this.height=8; this.depth=14;
        this.moveTimer=Math.random()*6.28;
        this.baseX=x; this.baseY=y;
        this.moveAmpX=randomRange(20,50);
        this.jamActive=false;
        this._create();
    }
    _create() {
        this.mesh=new THREE.Group();
        const bGeo=new THREE.BoxGeometry(10,6,10);
        const bMat=new THREE.MeshStandardMaterial({color:0x7722cc,emissive:0xaa44ff,emissiveIntensity:0.3,metalness:0.6,roughness:0.3});
        this.mesh.add(new THREE.Mesh(bGeo,bMat));
        // Antenna
        const aGeo=new THREE.CylinderGeometry(0.5,0.5,10,4);
        const aMat=new THREE.MeshStandardMaterial({color:0xaa44ff,emissive:0xaa44ff,emissiveIntensity:1});
        const ant=new THREE.Mesh(aGeo,aMat);
        ant.position.y=8;
        this.mesh.add(ant);
        // Jam field (visual)
        const fieldGeo=new THREE.SphereGeometry(CONFIG.JAMMER_RANGE,12,8);
        const fieldMat=new THREE.MeshStandardMaterial({
            color:0xaa44ff,emissive:0xaa44ff,emissiveIntensity:0.1,
            transparent:true,opacity:0.03,side:THREE.DoubleSide,wireframe:true
        });
        this.fieldMesh=new THREE.Mesh(fieldGeo,fieldMat);
        this.fieldMat=fieldMat;
        this.mesh.add(this.fieldMesh);
        // Rotor
        const rGeo=new THREE.CylinderGeometry(7,7,0.5,8);
        const rMat=new THREE.MeshStandardMaterial({color:0x333,transparent:true,opacity:0.3});
        this.rotor=new THREE.Mesh(rGeo,rMat);
        this.rotor.position.y=4;
        this.mesh.add(this.rotor);
        this.mesh.position.set(this.x,this.y,this.z);
        this.scene.add(this.mesh);
    }
    update(dt,player) {
        this.moveTimer+=dt;
        this.x=this.baseX+Math.sin(this.moveTimer*0.5)*this.moveAmpX;
        this.y=this.baseY+Math.sin(this.moveTimer*0.7)*10;
        if(this.mesh) this.mesh.position.set(this.x,this.y,this.z);
        if(this.rotor) this.rotor.rotation.y+=dt*40;
        if(this.fieldMesh) this.fieldMesh.rotation.y+=dt*0.3;
        // Check if player is in jam range
        this.jamActive=false;
        if(player&&player.alive) {
            const dist=distance3D(this.x,this.y,this.z,player.x,player.y,player.z);
            if(dist<CONFIG.JAMMER_RANGE) {
                this.jamActive=true;
                player.jammed=true;
                player.jamIntensity=Math.max(player.jamIntensity,(1-dist/CONFIG.JAMMER_RANGE)*CONFIG.JAMMER_DISTORTION);
            }
        }
        if(this.fieldMat) this.fieldMat.opacity=this.jamActive?0.06:0.03;
    }
}

// --- Turret (on buildings) ---
class Turret extends Obstacle {
    constructor(x,y,z,scene) {
        super(x,y,z,'turret',scene);
        this.width=8; this.height=8; this.depth=8;
        this.fireTimer=randomRange(1,CONFIG.TURRET_FIRE_RATE);
        this.burstCount=0;
        this.burstTimer=0;
        this.bursting=false;
        this.projectiles=[];
        this.detectedPlayer=false;
        this.aimYaw=0;
        this.aimPitch=0;
        this._create();
    }
    _create() {
        this.mesh=new THREE.Group();
        // Base
        const baseGeo=new THREE.CylinderGeometry(5,6,4,8);
        const baseMat=new THREE.MeshStandardMaterial({color:0x333333,metalness:0.8,roughness:0.3});
        this.mesh.add(new THREE.Mesh(baseGeo,baseMat));
        // Barrel pivot
        this.barrel=new THREE.Group();
        const barrelGeo=new THREE.CylinderGeometry(1.2,1.5,12,6);
        const barrelMat=new THREE.MeshStandardMaterial({color:0x555555,metalness:0.9,roughness:0.2});
        const bMesh=new THREE.Mesh(barrelGeo,barrelMat);
        bMesh.rotation.x=Math.PI/2;
        bMesh.position.z=-6;
        this.barrel.add(bMesh);
        // Muzzle flash indicator
        const mGeo=new THREE.SphereGeometry(2,6,6);
        const mMat=new THREE.MeshStandardMaterial({color:0xff1744,emissive:0xff1744,emissiveIntensity:0,transparent:true,opacity:0});
        this.muzzleMesh=new THREE.Mesh(mGeo,mMat);
        this.muzzleMat=mMat;
        this.muzzleMesh.position.z=-12;
        this.barrel.add(this.muzzleMesh);
        this.barrel.position.y=4;
        this.mesh.add(this.barrel);
        // Detection light
        const lGeo=new THREE.SphereGeometry(1,6,6);
        const lMat=new THREE.MeshStandardMaterial({color:0xff1744,emissive:0xff1744,emissiveIntensity:1});
        this.detectLight=new THREE.Mesh(lGeo,lMat);
        this.detectLightMat=lMat;
        this.detectLight.position.y=6;
        this.mesh.add(this.detectLight);
        this.mesh.position.set(this.x,this.y,this.z);
        this.scene.add(this.mesh);
    }
    update(dt,player) {
        if(player&&player.alive) {
            const dist=distance3D(this.x,this.y,this.z,player.x,player.y,player.z);
            this.detectedPlayer = dist < CONFIG.TURRET_DETECT_RANGE;
            if(this.detectedPlayer) {
                // Aim at player
                const dx=player.x-this.x, dy=player.y-this.y, dz=player.z-this.z;
                const yaw=Math.atan2(dx,dz);
                const pitch=Math.atan2(dy,Math.sqrt(dx*dx+dz*dz));
                this.aimYaw=lerp(this.aimYaw,yaw,3*dt);
                this.aimPitch=lerp(this.aimPitch,clamp(pitch,-0.6,0.6),3*dt);
                if(this.barrel) {
                    this.barrel.rotation.y=this.aimYaw;
                    this.barrel.rotation.x=this.aimPitch;
                }
                // Firing
                if(!this.bursting) {
                    this.fireTimer-=dt;
                    if(this.fireTimer<=0) {
                        this.bursting=true;
                        this.burstCount=0;
                        this.burstTimer=0;
                    }
                }
                if(this.bursting) {
                    this.burstTimer-=dt;
                    if(this.burstTimer<=0) {
                        this.burstTimer=CONFIG.TURRET_BURST_DELAY;
                        this.burstCount++;
                        // Fire!
                        const fdx=player.x-this.x+randomRange(-15,15);
                        const fdy=player.y-this.y+randomRange(-10,10);
                        const fdz=player.z-this.z;
                        this.projectiles.push(new Projectile(
                            this.x,this.y+4,this.z,
                            fdx,fdy,fdz,
                            CONFIG.PROJECTILE_SPEED*1.2,
                            this.scene
                        ));
                        if(this.muzzleMat) { this.muzzleMat.emissiveIntensity=5; this.muzzleMat.opacity=1; }
                        if(this.burstCount>=CONFIG.TURRET_BURST) {
                            this.bursting=false;
                            this.fireTimer=CONFIG.TURRET_FIRE_RATE;
                        }
                    }
                }
            }
        }
        // Muzzle flash decay
        if(this.muzzleMat) {
            this.muzzleMat.emissiveIntensity=Math.max(0,this.muzzleMat.emissiveIntensity-dt*20);
            this.muzzleMat.opacity=Math.max(0,this.muzzleMat.opacity-dt*10);
        }
        // Detection light
        if(this.detectLightMat) {
            this.detectLightMat.emissiveIntensity=this.detectedPlayer?2+Math.sin(Date.now()*0.01):0.5;
        }
        // Update projectiles
        for(const p of this.projectiles) p.update(dt);
        this.projectiles=this.projectiles.filter(p=>p.active);
    }
    dispose() {
        for(const p of this.projectiles) p.dispose();
        this.projectiles=[];
        super.dispose();
    }
}

// --- Laser Barrier ---
class LaserBarrier extends Obstacle {
    constructor(x1,y1,z,x2,y2,scene) {
        super((x1+x2)/2,(y1+y2)/2,z,'laser',scene);
        this.x1=x1;this.y1=y1;this.x2=x2;this.y2=y2;
        this.timer=Math.random()*3;
        this.interval=randomRange(2,4);
        this.onDuration=randomRange(0.8,1.5);
        this.laserOn=false; this.laserTimer=0;
        this.width=distance(x1,y1,x2,y2);
        this._create();
    }
    _create() {
        this.mesh=new THREE.Group();
        const nGeo=new THREE.SphereGeometry(4,8,8);
        const nMat=new THREE.MeshStandardMaterial({color:0x444444,emissive:0xff1744,emissiveIntensity:0.3,metalness:0.8,roughness:0.3});
        this.n1Mat=nMat; this.n2Mat=nMat.clone();
        this.mesh.add(new THREE.Mesh(nGeo,this.n1Mat));
        this.mesh.children[0].position.set(this.x1,this.y1,this.z);
        const n2=new THREE.Mesh(nGeo,this.n2Mat);
        n2.position.set(this.x2,this.y2,this.z);
        this.mesh.add(n2);
        const dx=this.x2-this.x1,dy=this.y2-this.y1,len=Math.sqrt(dx*dx+dy*dy);
        const beamGeo=new THREE.CylinderGeometry(1.5,1.5,len,6);
        this.beamMat=new THREE.MeshStandardMaterial({color:0xff1744,emissive:0xff1744,emissiveIntensity:3,transparent:true,opacity:0});
        this.beamMesh=new THREE.Mesh(beamGeo,this.beamMat);
        this.beamMesh.position.set((this.x1+this.x2)/2,(this.y1+this.y2)/2,this.z);
        this.beamMesh.rotation.z=Math.atan2(dy,dx)+Math.PI/2;
        this.mesh.add(this.beamMesh);
        this.scene.add(this.mesh);
    }
    update(dt) {
        this.timer+=dt;
        if(!this.laserOn) {
            if(this.timer>=this.interval){this.laserOn=true;this.laserTimer=0;this.timer=0;}
        } else {
            this.laserTimer+=dt;
            if(this.laserTimer>=this.onDuration) this.laserOn=false;
        }
        if(this.beamMat) this.beamMat.opacity=this.laserOn?0.8:0;
        const warn=!this.laserOn&&this.timer>this.interval*0.7;
        const wi=warn?Math.sin(this.timer*15)*0.4+0.6:0.3;
        if(this.n1Mat) this.n1Mat.emissiveIntensity=this.laserOn?2:wi;
        if(this.n2Mat) this.n2Mat.emissiveIntensity=this.laserOn?2:wi;
    }
    checkCollision(player) {
        if(!this.laserOn) return false;
        const dx=this.x2-this.x1,dy=this.y2-this.y1,len2=dx*dx+dy*dy;
        if(len2===0) return false;
        let t=((player.x-this.x1)*dx+(player.y-this.y1)*dy)/len2;
        t=clamp(t,0,1);
        const d=Math.sqrt((player.x-(this.x1+t*dx))**2+(player.y-(this.y1+t*dy))**2);
        return d<player.radius+4&&Math.abs(player.z-this.z)<30;
    }
}

// --- Wind Zone ---
class WindZone extends Obstacle {
    constructor(x,y,z,dirX,dirY,scene) {
        super(x,y,z,'wind',scene);
        this.dirX=dirX||1;this.dirY=dirY||0;
        this.force=250;this.width=80;this.height=80;this.depth=40;
        this._create();
    }
    _create() {
        this.mesh=new THREE.Group();
        const zGeo=new THREE.BoxGeometry(this.width,this.height,this.depth);
        const zMat=new THREE.MeshStandardMaterial({color:0x00f0ff,emissive:0x00f0ff,emissiveIntensity:0.15,transparent:true,opacity:0.04,side:THREE.DoubleSide});
        this.mesh.add(new THREE.Mesh(zGeo,zMat));
        const aMat=new THREE.MeshStandardMaterial({color:0x00f0ff,emissive:0x00f0ff,emissiveIntensity:0.5,transparent:true,opacity:0.25});
        const arrow=new THREE.Mesh(new THREE.ConeGeometry(4,10,4),aMat);
        arrow.rotation.z=-Math.atan2(this.dirY,this.dirX)-Math.PI/2;
        this.mesh.add(arrow);
        this.mesh.position.set(this.x,this.y,this.z);
        this.scene.add(this.mesh);
    }
    applyForce(player,dt) {
        const dx=player.x-this.x,dy=player.y-this.y,dz=player.z-this.z;
        if(Math.abs(dx)<this.width/2+player.radius&&Math.abs(dy)<this.height/2+player.radius&&Math.abs(dz)<this.depth/2+20) {
            player.vx+=this.dirX*this.force*dt;
            player.vy+=this.dirY*this.force*dt;
            return true;
        }
        return false;
    }
}
