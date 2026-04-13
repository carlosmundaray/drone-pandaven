// ============================================
// DRONES PANDAVEN 3D — Obstacles (Optimized)
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

// --- Building (uses canvas texture for windows) ---
class Building extends Obstacle {
    constructor(x,y,z,w,h,d,scene) {
        super(x,y,z,'building',scene);
        this.width=w; this.height=h; this.depth=d;
        this._create();
    }
    _create() {
        this.mesh = new THREE.Group();
        const bodyGeo = new THREE.BoxGeometry(this.width, this.height, this.depth);

        // Create window texture via canvas
        const texCanvas = document.createElement('canvas');
        texCanvas.width = 128; texCanvas.height = 256;
        const tctx = texCanvas.getContext('2d');
        // Building base color
        const baseColors = ['#0d1117','#161b22','#1a2332','#0f1923'];
        tctx.fillStyle = randomChoice(baseColors);
        tctx.fillRect(0,0,128,256);
        // Windows
        const winColors = ['#00f0ff','#ff2d78','#FFB800','#aa44ff','#39ff14'];
        const winColor = randomChoice(winColors);
        const rows = 12, cols = 5;
        for (let r=0;r<rows;r++) {
            for (let c=0;c<cols;c++) {
                if (Math.random()<0.35) continue;
                tctx.fillStyle = winColor;
                tctx.globalAlpha = randomRange(0.3, 0.9);
                tctx.fillRect(8+c*24, 8+r*20, 16, 12);
            }
        }
        tctx.globalAlpha = 1;
        // Neon sign on some buildings
        if (Math.random()<0.3) {
            tctx.fillStyle = randomChoice(winColors);
            tctx.globalAlpha = 0.9;
            tctx.fillRect(10, 100, 108, 14);
            tctx.globalAlpha = 1;
        }
        const texture = new THREE.CanvasTexture(texCanvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        const bodyMat = new THREE.MeshStandardMaterial({
            map: texture,
            metalness: 0.4,
            roughness: 0.6,
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = this.height / 2;
        this.mesh.add(body);

        // Rooftop antenna (simple)
        if (Math.random()<0.4) {
            const antennaGeo = new THREE.CylinderGeometry(0.5,0.5,25,4);
            const antMat = new THREE.MeshStandardMaterial({color:0x444444,metalness:0.8,roughness:0.3});
            const ant = new THREE.Mesh(antennaGeo, antMat);
            ant.position.y = this.height+12;
            this.mesh.add(ant);
            const tipGeo = new THREE.SphereGeometry(1.5,6,6);
            const tipMat = new THREE.MeshStandardMaterial({color:0xff1744,emissive:0xff1744,emissiveIntensity:2});
            this.tipMesh = new THREE.Mesh(tipGeo, tipMat);
            this.tipMesh.position.y = this.height+25;
            this.mesh.add(this.tipMesh);
        }

        this.mesh.position.set(this.x, this.y, this.z);
        this.scene.add(this.mesh);
    }
    update(dt) {
        if(this.tipMesh) {
            this.tipMesh.material.emissiveIntensity = Math.sin(Date.now()*0.003)>0?2:0.1;
        }
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
        this.mesh = new THREE.Group();
        const tGeo = new THREE.BoxGeometry(10,180,10);
        const tMat = new THREE.MeshStandardMaterial({color:0xFFB800,metalness:0.6,roughness:0.4});
        const tower = new THREE.Mesh(tGeo, tMat);
        tower.position.y=90;
        this.mesh.add(tower);
        const aGeo = new THREE.BoxGeometry(this.armLength,5,5);
        this.armMesh = new THREE.Mesh(aGeo, tMat);
        this.armMesh.position.set(this.armLength/2, 180, 0);
        this.mesh.add(this.armMesh);
        this.mesh.position.set(this.x,this.y,this.z);
        this.scene.add(this.mesh);
    }
    update(dt) {
        this.armAngle+=this.armSpeed*dt;
        if(this.armMesh) this.armMesh.rotation.y=this.armAngle;
    }
}

// --- Enemy Drone ---
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
        this._create();
    }
    _create() {
        this.mesh = new THREE.Group();
        const bGeo = new THREE.BoxGeometry(12,5,10);
        const bMat = new THREE.MeshStandardMaterial({color:0xff2d78,emissive:0xff2d78,emissiveIntensity:0.3,metalness:0.6,roughness:0.3});
        this.mesh.add(new THREE.Mesh(bGeo, bMat));
        // Single disc rotor for performance
        const rGeo = new THREE.CylinderGeometry(8,8,0.5,8);
        const rMat = new THREE.MeshStandardMaterial({color:0x333333,transparent:true,opacity:0.3});
        this.rotor = new THREE.Mesh(rGeo, rMat);
        this.rotor.position.y=4;
        this.mesh.add(this.rotor);
        // Eye
        const eGeo = new THREE.SphereGeometry(1.5,6,6);
        const eMat = new THREE.MeshStandardMaterial({color:0xff1744,emissive:0xff1744,emissiveIntensity:3});
        const eye = new THREE.Mesh(eGeo, eMat);
        eye.position.set(0,0,-6);
        this.mesh.add(eye);
        this.mesh.position.set(this.x,this.y,this.z);
        this.scene.add(this.mesh);
    }
    update(dt) {
        this.moveTimer+=dt;
        this.x=this.baseX+Math.sin(this.moveTimer*this.moveSpdX)*this.moveAmpX;
        this.y=this.baseY+Math.sin(this.moveTimer*this.moveSpdY)*this.moveAmpY;
        if(this.mesh){
            this.mesh.position.set(this.x,this.y,this.z);
            this.mesh.rotation.z=Math.sin(this.moveTimer*this.moveSpdX)*0.15;
        }
        if(this.rotor) this.rotor.rotation.y+=dt*50;
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
        this.mesh = new THREE.Group();
        const nGeo = new THREE.SphereGeometry(4,8,8);
        const nMat = new THREE.MeshStandardMaterial({color:0x444444,emissive:0xff1744,emissiveIntensity:0.3,metalness:0.8,roughness:0.3});
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
        if(!this.laserOn){
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
        this.mesh = new THREE.Group();
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
        if(Math.abs(dx)<this.width/2+player.radius&&Math.abs(dy)<this.height/2+player.radius&&Math.abs(dz)<this.depth/2+20){
            player.vx+=this.dirX*this.force*dt;
            player.vy+=this.dirY*this.force*dt;
            return true;
        }
        return false;
    }
}
