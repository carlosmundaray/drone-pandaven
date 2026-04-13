// ============================================
// DRONES PANDAVEN 3D — Procedural City (Optimized)
// ============================================
class LevelGenerator {
    constructor(scene) {
        this.scene=scene;
        this.chunks=[];
        this.chunkDepth=CONFIG.CHUNK_DEPTH;
        this.nextChunkZ=0;
        this.difficulty=0;
        this.chunksGenerated=0;
        this.groundSegments=[];
        this.cityW=CONFIG.CITY_WIDTH;
    }
    reset() {
        for(const c of this.chunks){
            for(const h of c.obstacles) if(h.dispose) h.dispose();
            for(const col of c.collectibles) if(col.dispose) col.dispose();
        }
        for(const s of this.groundSegments){
            if(s.mesh){
                this.scene.remove(s.mesh);
                s.mesh.traverse(ch=>{if(ch.geometry)ch.geometry.dispose();if(ch.material){if(Array.isArray(ch.material))ch.material.forEach(m=>m.dispose());else ch.material.dispose();}});
            }
        }
        this.chunks=[];this.groundSegments=[];this.nextChunkZ=0;this.difficulty=0;this.chunksGenerated=0;
    }
    setDifficulty(d){this.difficulty=clamp(d,0,1);}
    generateInitialChunks(dist){
        const n=Math.ceil(dist/this.chunkDepth)+2;
        for(let i=0;i<n;i++) this._genChunk();
    }
    update(playerZ,viewDist){
        while(this.nextChunkZ>playerZ-viewDist*1.5) this._genChunk();
        const removeZ=playerZ+this.chunkDepth*2;
        this.chunks=this.chunks.filter(c=>{
            if(c.z<removeZ){
                for(const h of c.obstacles) if(h.dispose) h.dispose();
                for(const col of c.collectibles) if(col.dispose) col.dispose();
                return false;
            }
            return true;
        });
        this.groundSegments=this.groundSegments.filter(s=>{
            if(s.z<removeZ){
                if(s.mesh){
                    this.scene.remove(s.mesh);
                    s.mesh.traverse(ch=>{if(ch.geometry)ch.geometry.dispose();if(ch.material){if(Array.isArray(ch.material))ch.material.forEach(m=>m.dispose());else ch.material.dispose();}});
                }
                return false;
            }
            return true;
        });
    }
    _genChunk(){
        const z=this.nextChunkZ;
        const chunk={z,obstacles:[],collectibles:[]};
        this._genGround(z);
        this._genBuildings(chunk);
        this._genObstacles(chunk);
        this._genCollectibles(chunk);
        this.chunks.push(chunk);
        this.nextChunkZ-=this.chunkDepth;
        this.chunksGenerated++;
    }

    _genGround(z){
        const group=new THREE.Group();
        // Road (single plane)
        const roadGeo=new THREE.PlaneGeometry(this.cityW*0.5, this.chunkDepth);
        const roadMat=new THREE.MeshStandardMaterial({color:0x1a1a24,metalness:0.3,roughness:0.8,side:THREE.DoubleSide});
        const road=new THREE.Mesh(roadGeo,roadMat);
        road.rotation.x=-Math.PI/2;
        road.position.set(0,0,z-this.chunkDepth/2);
        group.add(road);

        // Road markings (fewer - every 80 units)
        for(let i=0;i<this.chunkDepth;i+=80){
            const mGeo=new THREE.PlaneGeometry(3,16);
            const mMat=new THREE.MeshStandardMaterial({color:0xFFB800,emissive:0xFFB800,emissiveIntensity:0.3,side:THREE.DoubleSide});
            const mark=new THREE.Mesh(mGeo,mMat);
            mark.rotation.x=-Math.PI/2;
            mark.position.set(0,0.5,z-i);
            group.add(mark);
        }

        // Street lights (2 per chunk, emissive meshes only, NO PointLights)
        for(let i=100;i<this.chunkDepth;i+=350){
            [-1,1].forEach(side=>{
                const pGeo=new THREE.CylinderGeometry(0.8,0.8,50,4);
                const pMat=new THREE.MeshStandardMaterial({color:0x444444,metalness:0.7,roughness:0.4});
                const pole=new THREE.Mesh(pGeo,pMat);
                pole.position.set(side*(this.cityW*0.25-5),25,z-i);
                group.add(pole);
                const lColor=randomChoice([0x00f0ff,0xFFB800,0xff2d78]);
                const lGeo=new THREE.SphereGeometry(2.5,6,6);
                const lMat=new THREE.MeshStandardMaterial({color:lColor,emissive:lColor,emissiveIntensity:3});
                const lamp=new THREE.Mesh(lGeo,lMat);
                lamp.position.set(side*(this.cityW*0.25-5),52,z-i);
                group.add(lamp);
            });
        }
        this.scene.add(group);
        this.groundSegments.push({z,mesh:group});
    }

    _genBuildings(chunk){
        const num=randomInt(3,6);
        for(let i=0;i<num;i++){
            const side=randomChoice([-1,1]);
            const w=randomRange(40,90);
            const h=randomRange(60,250);
            const d=randomRange(40,70);
            const bx=side*(this.cityW*0.25+50+randomRange(0,60));
            const bz=chunk.z-randomRange(30,this.chunkDepth-30);
            chunk.obstacles.push(new Building(bx,0,bz,w,h,d,this.scene));
        }
    }

    _genObstacles(chunk){
        const density=lerp(CONFIG.BASE_OBSTACLE_DENSITY,CONFIG.MAX_OBSTACLE_DENSITY,this.difficulty);
        // Enemy drones
        const numE=Math.floor(density*2)+1;
        for(let i=0;i<numE;i++){
            chunk.obstacles.push(new EnemyDrone(
                randomRange(-this.cityW*0.18,this.cityW*0.18),
                randomRange(30,CONFIG.CITY_HEIGHT*0.6),
                chunk.z-randomRange(50,this.chunkDepth-50),
                this.scene
            ));
        }
        // Crane
        if(Math.random()<0.2+density*0.2){
            const side=randomChoice([-1,1]);
            chunk.obstacles.push(new Crane(side*(this.cityW*0.25+randomRange(0,20)),0,chunk.z-randomRange(100,this.chunkDepth-100),this.scene));
        }
        // Laser
        if(density>0.35&&Math.random()<density*0.4){
            const lx1=randomRange(-this.cityW*0.12,-10);
            const lx2=randomRange(10,this.cityW*0.12);
            const ly=randomRange(30,CONFIG.CITY_HEIGHT*0.5);
            chunk.obstacles.push(new LaserBarrier(lx1,ly,chunk.z-randomRange(100,this.chunkDepth-100),lx2,ly+randomRange(-15,15),this.scene));
        }
        // Wind
        if(Math.random()<0.2){
            chunk.obstacles.push(new WindZone(
                randomRange(-this.cityW*0.12,this.cityW*0.12),
                randomRange(30,CONFIG.CITY_HEIGHT*0.4),
                chunk.z-randomRange(60,this.chunkDepth-60),
                randomChoice([-1,1]),0,this.scene
            ));
        }
    }

    _genCollectibles(chunk){
        // Packages (1 per chunk)
        const px=randomRange(-this.cityW*0.18,this.cityW*0.18);
        const py=randomRange(40,CONFIG.CITY_HEIGHT*0.45);
        const pz=chunk.z-randomRange(50,this.chunkDepth-50);
        chunk.collectibles.push(new Package(px,py,pz,this.scene));

        // Delivery pad (1 per chunk)
        const padX=randomRange(-this.cityW*0.12,this.cityW*0.12);
        chunk.collectibles.push(new DeliveryPad(padX,2,chunk.z-randomRange(200,this.chunkDepth-100),this.scene));

        // Coins (4-8, in a line)
        const nCoins=randomInt(4,8);
        const startX=randomRange(-this.cityW*0.15,this.cityW*0.15);
        const startY=randomRange(30,100);
        const startZ=chunk.z-randomRange(20,80);
        for(let i=0;i<nCoins;i++){
            chunk.collectibles.push(new Coin(startX+randomRange(-10,10),startY+randomRange(-5,5),startZ-i*35,randomInt(1,2),this.scene));
        }

        // Power-ups (rare)
        if(Math.random()<0.1&&this.chunksGenerated>2){
            chunk.collectibles.push(new PowerUp(
                randomRange(-this.cityW*0.12,this.cityW*0.12),
                randomRange(50,CONFIG.CITY_HEIGHT*0.4),
                chunk.z-randomRange(80,this.chunkDepth-80),
                undefined,this.scene
            ));
        }
    }

    getAllObstacles(){const a=[];for(const c of this.chunks)a.push(...c.obstacles);return a;}
    getAllCollectibles(){const a=[];for(const c of this.chunks)a.push(...c.collectibles.filter(x=>x.active));return a;}
}
