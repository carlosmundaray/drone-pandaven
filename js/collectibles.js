// ============================================
// DRONES PANDAVEN 3D — Collectibles (Optimized)
// ============================================

class Package {
    constructor(x,y,z,scene) {
        this.x=x;this.y=y;this.z=z;this.radius=12;this.active=true;this.collected=false;
        this.scene=scene;this.bobTimer=Math.random()*6.28;this.rotAngle=Math.random()*6.28;this.spawnAnim=0;
        this._create();
    }
    _create() {
        this.mesh=new THREE.Group();
        const boxGeo=new THREE.BoxGeometry(14,10,12);
        const boxMat=new THREE.MeshStandardMaterial({color:0x8B6914,emissive:0x8B6914,emissiveIntensity:0.1,metalness:0.2,roughness:0.6});
        this.mesh.add(new THREE.Mesh(boxGeo,boxMat));
        const tapeGeo=new THREE.BoxGeometry(14.5,2.5,12.5);
        const tapeMat=new THREE.MeshStandardMaterial({color:0xFFB800,emissive:0xFFB800,emissiveIntensity:0.5});
        const tape=new THREE.Mesh(tapeGeo,tapeMat);tape.position.y=1;this.mesh.add(tape);
        // Arrow above
        const arrowGeo=new THREE.ConeGeometry(3,8,4);
        const arrowMat=new THREE.MeshStandardMaterial({color:0xFFB800,emissive:0xFFB800,emissiveIntensity:1.5,transparent:true,opacity:0.7});
        this.arrow=new THREE.Mesh(arrowGeo,arrowMat);this.arrow.position.y=16;this.arrow.rotation.x=Math.PI;
        this.mesh.add(this.arrow);
        this.mesh.position.set(this.x,this.y,this.z);
        this.mesh.scale.set(0.01,0.01,0.01);
        this.scene.add(this.mesh);
    }
    update(dt) {
        this.bobTimer+=dt*2;this.rotAngle+=dt;
        if(this.spawnAnim<1)this.spawnAnim=Math.min(1,this.spawnAnim+dt*3);
        if(this.mesh&&this.active){
            const s=easeOutBack(this.spawnAnim);this.mesh.scale.set(s,s,s);
            this.mesh.position.y=this.y+Math.sin(this.bobTimer)*4;
            this.mesh.rotation.y=this.rotAngle;
            if(this.arrow)this.arrow.position.y=16+Math.sin(this.bobTimer*2)*2;
        }
    }
    checkCollection(player) {
        if(!this.active||this.collected||player.carryingPackage) return false;
        return distance3D(this.x,this.y,this.z,player.x,player.y,player.z)<this.radius+player.radius+10;
    }
    dispose() {
        if(this.mesh&&this.scene){this.scene.remove(this.mesh);
        this.mesh.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose();});}
    }
}

class DeliveryPad {
    constructor(x,y,z,scene) {
        this.x=x;this.y=y;this.z=z;this.radius=25;this.active=true;this.scene=scene;this.animTimer=0;
        this._create();
    }
    _create() {
        this.mesh=new THREE.Group();
        // Platform
        const padGeo=new THREE.CylinderGeometry(24,24,2,16);
        const padMat=new THREE.MeshStandardMaterial({color:0x1a2332,emissive:0x00ff88,emissiveIntensity:0.2,metalness:0.6,roughness:0.4});
        this.mesh.add(new THREE.Mesh(padGeo,padMat));
        // Ring
        const ringGeo=new THREE.TorusGeometry(24,1.2,6,20);
        const ringMat=new THREE.MeshStandardMaterial({color:0x00ff88,emissive:0x00ff88,emissiveIntensity:1.2});
        const ring=new THREE.Mesh(ringGeo,ringMat);ring.rotation.x=Math.PI/2;ring.position.y=2;
        this.mesh.add(ring);
        // H marker
        const hMat=new THREE.MeshStandardMaterial({color:0x00ff88,emissive:0x00ff88,emissiveIntensity:2});
        const b1=new THREE.Mesh(new THREE.BoxGeometry(2.5,0.5,14),hMat);b1.position.set(-4,2,0);this.mesh.add(b1);
        const b2=new THREE.Mesh(new THREE.BoxGeometry(2.5,0.5,14),hMat);b2.position.set(4,2,0);this.mesh.add(b2);
        const b3=new THREE.Mesh(new THREE.BoxGeometry(10,0.5,2.5),hMat);b3.position.y=2;this.mesh.add(b3);
        // Beam (simple cylinder, no light)
        const beamGeo=new THREE.CylinderGeometry(18,24,120,8,1,true);
        const beamMat=new THREE.MeshStandardMaterial({color:0x00ff88,emissive:0x00ff88,emissiveIntensity:0.2,transparent:true,opacity:0.04,side:THREE.DoubleSide});
        this.beam=new THREE.Mesh(beamGeo,beamMat);this.beamMat=beamMat;
        this.beam.position.y=60;this.mesh.add(this.beam);
        this.mesh.position.set(this.x,this.y,this.z);
        this.scene.add(this.mesh);
    }
    update(dt) {
        this.animTimer+=dt;
        if(this.beam)this.beam.rotation.y+=dt*0.5;
        if(this.beamMat)this.beamMat.opacity=0.03+Math.sin(this.animTimer*2)*0.015;
    }
    checkDelivery(player) {
        if(!this.active||!player.carryingPackage) return false;
        return distance3D(this.x,this.y,this.z,player.x,player.y,player.z)<this.radius+player.radius;
    }
    dispose() {
        if(this.mesh&&this.scene){this.scene.remove(this.mesh);
        this.mesh.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose();});}
    }
}

class Coin {
    constructor(x,y,z,value,scene) {
        this.x=x;this.y=y;this.z=z;this.radius=5;this.value=value||1;this.active=true;
        this.scene=scene;this.rotAngle=Math.random()*6;this.spawnAnim=0;
        this._create();
    }
    _create() {
        this.mesh=new THREE.Group();
        const cGeo=new THREE.CylinderGeometry(4,4,1.2,10);
        const cMat=new THREE.MeshStandardMaterial({color:0xFFD700,emissive:0xFFD700,emissiveIntensity:0.6,metalness:0.9,roughness:0.2});
        this.coinMesh=new THREE.Mesh(cGeo,cMat);this.coinMesh.rotation.x=Math.PI/2;
        this.mesh.add(this.coinMesh);
        this.mesh.position.set(this.x,this.y,this.z);
        this.mesh.scale.set(0.01,0.01,0.01);
        this.scene.add(this.mesh);
    }
    update(dt) {
        this.rotAngle+=dt*3;
        if(this.spawnAnim<1)this.spawnAnim=Math.min(1,this.spawnAnim+dt*4);
        if(this.mesh&&this.active){
            const s=easeOutBack(this.spawnAnim);this.mesh.scale.set(s,s,s);
            if(this.coinMesh)this.coinMesh.rotation.z=this.rotAngle;
        }
    }
    checkCollection(player) {
        if(!this.active) return false;
        return distance3D(this.x,this.y,this.z,player.x,player.y,player.z)<this.radius+player.radius+player.magnetRange*0.4;
    }
    getMagnetPulled(player,dt) {
        if(!this.active) return;
        const d=distance3D(this.x,this.y,this.z,player.x,player.y,player.z);
        if(d<player.magnetRange&&d>player.radius){
            const pull=(1-d/player.magnetRange)*350*dt;
            const dx=player.x-this.x,dy=player.y-this.y,dz=player.z-this.z;
            const l=Math.sqrt(dx*dx+dy*dy+dz*dz)||1;
            this.x+=(dx/l)*pull;this.y+=(dy/l)*pull;this.z+=(dz/l)*pull;
            if(this.mesh)this.mesh.position.set(this.x,this.y,this.z);
        }
    }
    dispose() {
        if(this.mesh&&this.scene){this.scene.remove(this.mesh);
        this.mesh.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose();});}
    }
}

class PowerUp {
    constructor(x,y,z,type,scene) {
        this.x=x;this.y=y;this.z=z;this.radius=12;this.active=true;this.scene=scene;
        this.powerType=type||randomChoice(['shield','speed','magnet','timeslow']);
        this.timer=0;this.lifetime=12;this.bobTimer=Math.random()*6;this.rotAngle=0;this.spawnAnim=0;
        this.colorMap={shield:0x4488ff,speed:0xFFB800,magnet:0xaa44ff,timeslow:0x00f0ff};
        this._create();
    }
    _create() {
        this.mesh=new THREE.Group();
        const c=this.colorMap[this.powerType];
        const bGeo=new THREE.OctahedronGeometry(this.radius,0);
        const bMat=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.8,metalness:0.4,roughness:0.2,transparent:true,opacity:0.85});
        this.bodyMesh=new THREE.Mesh(bGeo,bMat);this.mesh.add(this.bodyMesh);
        const rGeo=new THREE.TorusGeometry(this.radius+3,0.8,6,16);
        const rMat=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.5,transparent:true,opacity:0.4});
        this.ringMesh=new THREE.Mesh(rGeo,rMat);this.mesh.add(this.ringMesh);
        this.mesh.position.set(this.x,this.y,this.z);
        this.mesh.scale.set(0.01,0.01,0.01);
        this.scene.add(this.mesh);
    }
    update(dt) {
        this.timer+=dt;this.bobTimer+=dt*2.5;this.rotAngle+=dt*2;
        if(this.spawnAnim<1)this.spawnAnim=Math.min(1,this.spawnAnim+dt*2);
        if(this.timer>this.lifetime){this.active=false;this.dispose();return;}
        if(this.mesh&&this.active){
            const s=easeOutElastic(Math.min(1,this.spawnAnim));this.mesh.scale.set(s,s,s);
            this.mesh.position.y=this.y+Math.sin(this.bobTimer)*5;
            if(this.timer>this.lifetime-3)this.mesh.visible=Math.sin(this.timer*10)>0;
            if(this.bodyMesh){this.bodyMesh.rotation.y=this.rotAngle;this.bodyMesh.rotation.x=this.rotAngle*0.5;}
            if(this.ringMesh){this.ringMesh.rotation.x=this.rotAngle*1.5;this.ringMesh.rotation.z=this.rotAngle;}
        }
    }
    checkCollection(player) {
        if(!this.active) return false;
        return distance3D(this.x,this.y,this.z,player.x,player.y,player.z)<this.radius+player.radius+5;
    }
    apply(player,game) {
        switch(this.powerType){
            case 'shield':player.invincible=true;player.invincibleTimer=5;break;
            case 'speed':game.addTemporaryEffect('speed',5,()=>{player.speed=CONFIG.DRONE_SPEED*(1+player.upgrades.speed*0.15)*1.5;},()=>{player.speed=CONFIG.DRONE_SPEED*(1+player.upgrades.speed*0.15);});break;
            case 'magnet':game.addTemporaryEffect('magnet',8,()=>{player.magnetRange=(60+player.upgrades.magnet*25)*3;},()=>{player.magnetRange=60+player.upgrades.magnet*25;});break;
            case 'timeslow':game.addTemporaryEffect('timeslow',4,()=>{game.timeScale=0.5;},()=>{game.timeScale=1;});break;
        }
    }
    dispose() {
        if(this.mesh&&this.scene){this.scene.remove(this.mesh);
        this.mesh.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose();});}
    }
}
