// ============================================
// DRONES PANDAVEN 3D — Procedural City (FPS Enhanced)
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
        this.decorations=[];
    }

    reset() {
        for(const c of this.chunks) {
            for(const h of c.obstacles) if(h.dispose) h.dispose();
            for(const col of c.collectibles) if(col.dispose) col.dispose();
        }
        for(const s of this.groundSegments) {
            if(s.mesh) {
                this.scene.remove(s.mesh);
                s.mesh.traverse(ch=>{
                    if(ch.geometry) ch.geometry.dispose();
                    if(ch.material) {
                        if(Array.isArray(ch.material)) ch.material.forEach(m=>m.dispose());
                        else ch.material.dispose();
                    }
                });
            }
        }
        for(const d of this.decorations) {
            if(d.mesh) {
                this.scene.remove(d.mesh);
                d.mesh.traverse(ch=>{
                    if(ch.geometry) ch.geometry.dispose();
                    if(ch.material) {
                        if(Array.isArray(ch.material)) ch.material.forEach(m=>m.dispose());
                        else ch.material.dispose();
                    }
                });
            }
        }
        this.chunks=[]; this.groundSegments=[]; this.decorations=[];
        this.nextChunkZ=0; this.difficulty=0; this.chunksGenerated=0;
        this.racingMode=false;
        this.finishLineGenerated=false;
        this.raceGateCounter=0;
    }

    setRacingMode(enabled) { this.racingMode = enabled; }
    setDifficulty(d) { this.difficulty=clamp(d,0,1); }

    generateInitialChunks(dist) {
        const n=Math.ceil(dist/this.chunkDepth)+2;
        for(let i=0;i<n;i++) this._genChunk();
    }

    update(playerZ, viewDist) {
        while(this.nextChunkZ > playerZ - viewDist*1.5) this._genChunk();
        const removeZ = playerZ + this.chunkDepth*2;
        this.chunks = this.chunks.filter(c => {
            if(c.z > removeZ) {
                for(const h of c.obstacles) if(h.dispose) h.dispose();
                for(const col of c.collectibles) if(col.dispose) col.dispose();
                return false;
            }
            return true;
        });
        this.groundSegments = this.groundSegments.filter(s => {
            if(s.z > removeZ) {
                if(s.mesh) {
                    this.scene.remove(s.mesh);
                    s.mesh.traverse(ch=>{
                        if(ch.geometry) ch.geometry.dispose();
                        if(ch.material) {
                            if(Array.isArray(ch.material)) ch.material.forEach(m=>m.dispose());
                            else ch.material.dispose();
                        }
                    });
                }
                return false;
            }
            return true;
        });
        this.decorations = this.decorations.filter(d => {
            if(d.z > removeZ) {
                if(d.mesh) {
                    this.scene.remove(d.mesh);
                    d.mesh.traverse(ch=>{
                        if(ch.geometry) ch.geometry.dispose();
                        if(ch.material) {
                            if(Array.isArray(ch.material)) ch.material.forEach(m=>m.dispose());
                            else ch.material.dispose();
                        }
                    });
                }
                return false;
            }
            return true;
        });
    }

    _genChunk() {
        if(this.racingMode && this.nextChunkZ <= -15000) {
            if(!this.finishLineGenerated) {
                this._genFinishLineChunk(this.nextChunkZ);
                this.finishLineGenerated = true;
            }
            return;
        }

        const z = this.nextChunkZ;
        const chunk = { z, obstacles:[], collectibles:[] };

        if(this.racingMode) {
            this._genRaceGround(z);
            this._genRaceGates(chunk, z);
            this._genRaceCollectibles(chunk);
        } else {
            this._genGround(z);
            this._genBuildings(chunk);
            this._genObstacles(chunk);
            this._genCollectibles(chunk);
            this._genDecorations(z);
        }

        this.chunks.push(chunk);
        this.nextChunkZ -= this.chunkDepth;
        this.chunksGenerated++;
    }

    // ====== FPV RACING TERRAIN ======
    _genRaceGround(z) {
        const group = new THREE.Group();

        // Wide grass field
        const fieldGeo = new THREE.PlaneGeometry(800, this.chunkDepth);
        const fieldMat = new THREE.MeshStandardMaterial({
            color: 0x3a7a2a, metalness: 0, roughness: 1, side: THREE.DoubleSide
        });
        const field = new THREE.Mesh(fieldGeo, fieldMat);
        field.rotation.x = -Math.PI/2;
        field.position.set(0, 0, z - this.chunkDepth/2);
        group.add(field);

        // Darker grass patches for visual variety
        for(let i=0; i<6; i++) {
            const patchW = randomRange(60, 200);
            const patchD = randomRange(60, 200);
            const patchGeo = new THREE.PlaneGeometry(patchW, patchD);
            const greens = [0x2d6b1f, 0x458a33, 0x357a28, 0x4a9538];
            const patchMat = new THREE.MeshStandardMaterial({
                color: randomChoice(greens), metalness: 0, roughness: 1, side: THREE.DoubleSide
            });
            const patch = new THREE.Mesh(patchGeo, patchMat);
            patch.rotation.x = -Math.PI/2;
            patch.position.set(randomRange(-300, 300), 0.1, z - randomRange(0, this.chunkDepth));
            group.add(patch);
        }

        // Scattered rocks/props
        for(let i=0; i<4; i++) {
            const rx = randomRange(-350, 350);
            const rz = z - randomRange(50, this.chunkDepth - 50);
            // Only place props away from the flight path
            if(Math.abs(rx) > 100) {
                const rockGeo = new THREE.DodecahedronGeometry(randomRange(3, 12), 0);
                const rockMat = new THREE.MeshStandardMaterial({
                    color: randomChoice([0x888888, 0x777766, 0x999988]),
                    metalness: 0.2, roughness: 0.9
                });
                const rock = new THREE.Mesh(rockGeo, rockMat);
                rock.position.set(rx, randomRange(1, 5), rz);
                rock.rotation.set(Math.random(), Math.random(), Math.random());
                group.add(rock);
            }
        }

        // Scattered low trees (away from flight corridor)
        for(let i=0; i<3; i++) {
            const tx = randomChoice([-1,1]) * randomRange(150, 350);
            const tz = z - randomRange(100, this.chunkDepth - 100);
            const treeG = new THREE.Group();
            const trunkH = randomRange(8, 16);
            const trunkGeo = new THREE.CylinderGeometry(1, 1.5, trunkH, 5);
            const trunkMat = new THREE.MeshStandardMaterial({color: 0x664422, roughness: 0.9});
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = trunkH/2;
            treeG.add(trunk);
            const canopyR = randomRange(5, 10);
            const canopyGeo = new THREE.SphereGeometry(canopyR, 6, 5);
            const canopyMat = new THREE.MeshStandardMaterial({
                color: randomChoice([0x2d6b1f, 0x3d8c2e, 0x4ea83a]), roughness: 0.8
            });
            const canopy = new THREE.Mesh(canopyGeo, canopyMat);
            canopy.position.y = trunkH + canopyR * 0.4;
            canopy.scale.y = 0.65;
            treeG.add(canopy);
            treeG.position.set(tx, 0, tz);
            group.add(treeG);
        }

        // Ground grid lines (subtle runway markings)
        for(let i=0; i < this.chunkDepth; i+=100) {
            const lineGeo = new THREE.PlaneGeometry(300, 1);
            const lineMat = new THREE.MeshBasicMaterial({
                color: 0xffffff, transparent: true, opacity: 0.06, side: THREE.DoubleSide
            });
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI/2;
            line.position.set(0, 0.15, z - i);
            group.add(line);
        }

        this.scene.add(group);
        this.groundSegments.push({ z, mesh: group });
    }

    _genRaceGates(chunk, z) {
        // Place 2-3 gates per chunk at varying positions and altitudes
        const numGates = randomInt(2, 3);
        const spacing = this.chunkDepth / (numGates + 1);

        for(let i=0; i<numGates; i++) {
            const gateZ = z - spacing * (i + 1);
            const gateX = randomRange(-60, 60);
            const gateY = randomRange(20, 80);
            const rot = randomRange(-0.3, 0.3); // slight angle variation

            const gate = new RaceGate(gateX, gateY, gateZ, rot, this.raceGateCounter || 0, this.scene);
            chunk.obstacles.push(gate);

            this.raceGateCounter = (this.raceGateCounter || 0) + 1;
        }
    }

    _genRaceCollectibles(chunk) {
        // Coins along the flight path between gates
        const nCoins = randomInt(3, 6);
        const startX = randomRange(-40, 40);
        const startY = randomRange(25, 70);
        const startZ = chunk.z - randomRange(20, 80);
        for(let i=0; i<nCoins; i++) {
            chunk.collectibles.push(new Coin(
                startX + randomRange(-15, 15),
                startY + randomRange(-8, 8),
                startZ - i * 40,
                randomInt(1, 2), this.scene
            ));
        }

        // Occasional power-up
        if(Math.random() < 0.25) {
            chunk.collectibles.push(new PowerUp(
                randomRange(-50, 50),
                randomRange(30, 80),
                chunk.z - randomRange(100, this.chunkDepth - 100),
                randomChoice(['speed', 'shield']),
                this.scene
            ));
        }
    }

    _genFinishLineChunk(z) {
        const chunk = { z, obstacles:[], collectibles:[] };
        
        // Use racing ground if in racing mode
        if(this.racingMode) {
            this._genRaceGround(z);
        } else {
            this._genGround(z);
        }
        
        // Massive Finish Gate
        const archGroup = new THREE.Group();
        const gz = z - this.chunkDepth/2;
        
        // Neon gateway arch (huge torus)
        const gateGeo = new THREE.TorusGeometry(50, 3, 8, 24);
        const gateMat = new THREE.MeshStandardMaterial({
            color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 2.5,
            metalness: 0.9, roughness: 0.1
        });
        const gate = new THREE.Mesh(gateGeo, gateMat);
        gate.position.set(0, 55, gz);
        archGroup.add(gate);

        // Support pillars
        const pillarMat = new THREE.MeshStandardMaterial({
            color: 0x222222, metalness: 0.8, roughness: 0.2
        });
        [-55, 55].forEach(side => {
            const pGeo = new THREE.CylinderGeometry(3, 4, 110);
            const p = new THREE.Mesh(pGeo, pillarMat);
            p.position.set(side, 55, gz);
            archGroup.add(p);
            
            // LED strip on pillar
            const ledGeo = new THREE.CylinderGeometry(1, 1, 108);
            const ledMat = new THREE.MeshBasicMaterial({
                color: 0xff4400, transparent: true, opacity: 0.7
            });
            const led = new THREE.Mesh(ledGeo, ledMat);
            led.position.set(side + (side > 0 ? 3 : -3), 55, gz);
            archGroup.add(led);
        });

        // Checkerboard banner
        const bannerGeo = new THREE.BoxGeometry(110, 18, 3);
        const bannerMat = new THREE.MeshStandardMaterial({
            color: 0xffffff, metalness: 0.3, roughness: 0.5
        });
        const banner = new THREE.Mesh(bannerGeo, bannerMat);
        banner.position.set(0, 108, gz);
        archGroup.add(banner);

        // FINISH text area (dark background)
        const textBg = new THREE.Mesh(
            new THREE.BoxGeometry(80, 12, 4),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        textBg.position.set(0, 108, gz + 2);
        archGroup.add(textBg);

        this.scene.add(archGroup);
        this.decorations.push({ z, mesh: archGroup });
        
        this.chunks.push(chunk);
    }

    _genGround(z) {
        const group = new THREE.Group();

        // Road — gray asphalt
        const roadGeo = new THREE.PlaneGeometry(this.cityW*0.5, this.chunkDepth);
        const roadMat = new THREE.MeshStandardMaterial({color:0x555560,metalness:0.1,roughness:0.9,side:THREE.DoubleSide});
        const road = new THREE.Mesh(roadGeo, roadMat);
        road.rotation.x = -Math.PI/2;
        road.position.set(0, 0, z-this.chunkDepth/2);
        group.add(road);

        // Sidewalks
        [-1,1].forEach(side => {
            const swGeo = new THREE.BoxGeometry(20, 1.5, this.chunkDepth);
            const swMat = new THREE.MeshStandardMaterial({color:0xB8B0A4,metalness:0.1,roughness:0.95});
            const sw = new THREE.Mesh(swGeo, swMat);
            sw.position.set(side*(this.cityW*0.25+10), 0.75, z-this.chunkDepth/2);
            group.add(sw);
        });

        // Road markings
        for(let i=0;i<this.chunkDepth;i+=60) {
            const mGeo = new THREE.PlaneGeometry(3,16);
            const mMat = new THREE.MeshStandardMaterial({color:0xEEDD44,emissive:0x000000,emissiveIntensity:0,side:THREE.DoubleSide});
            const mark = new THREE.Mesh(mGeo, mMat);
            mark.rotation.x = -Math.PI/2;
            mark.position.set(0, 0.5, z-i);
            group.add(mark);
        }

        // Lane dividers
        [-1,1].forEach(side => {
            for(let i=0;i<this.chunkDepth;i+=40) {
                const dGeo = new THREE.PlaneGeometry(1.5, 10);
                const dMat = new THREE.MeshStandardMaterial({color:0xCCCC99,emissive:0x000000,emissiveIntensity:0,side:THREE.DoubleSide});
                const div = new THREE.Mesh(dGeo, dMat);
                div.rotation.x = -Math.PI/2;
                div.position.set(side*40, 0.3, z-i);
                group.add(div);
            }
        });

        // Street lights
        for(let i=80;i<this.chunkDepth;i+=250) {
            [-1,1].forEach(side => {
                const pGeo = new THREE.CylinderGeometry(0.8,0.8,50,4);
                const pMat = new THREE.MeshStandardMaterial({color:0x444444,metalness:0.7,roughness:0.4});
                const pole = new THREE.Mesh(pGeo, pMat);
                pole.position.set(side*(this.cityW*0.25-5), 25, z-i);
                group.add(pole);

                // Arm
                const armGeo = new THREE.BoxGeometry(12,1.5,1.5);
                const arm = new THREE.Mesh(armGeo, pMat);
                arm.position.set(side*(this.cityW*0.25-5)-side*6, 50, z-i);
                group.add(arm);

                const lColor = 0x888888;
                const lGeo = new THREE.SphereGeometry(2, 6, 6);
                const lMat = new THREE.MeshStandardMaterial({color:lColor,metalness:0.5,roughness:0.4});
                const lamp = new THREE.Mesh(lGeo, lMat);
                lamp.position.set(side*(this.cityW*0.25-5)-side*12, 50, z-i);
                group.add(lamp);
            });
        }

        // Grass strips along sidewalks
        [-1,1].forEach(side => {
            const grassGeo = new THREE.PlaneGeometry(40, this.chunkDepth);
            const grassMat = new THREE.MeshStandardMaterial({color:0x5AA832,metalness:0,roughness:1,side:THREE.DoubleSide});
            const grass = new THREE.Mesh(grassGeo, grassMat);
            grass.rotation.x = -Math.PI/2;
            grass.position.set(side*(this.cityW*0.25+30), 0.2, z-this.chunkDepth/2);
            group.add(grass);
        });

        // Trees along sidewalks
        for(let i=60;i<this.chunkDepth;i+=randomRange(80,180)) {
            [-1,1].forEach(side => {
                if(Math.random()>0.6) return;
                const treeGroup = new THREE.Group();
                const trunkH = randomRange(12,22);
                const trunkGeo = new THREE.CylinderGeometry(1.2, 1.8, trunkH, 6);
                const trunkMat = new THREE.MeshStandardMaterial({color:0x664422,metalness:0.1,roughness:0.9});
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                trunk.position.y = trunkH/2;
                treeGroup.add(trunk);
                // Canopy
                const canopyR = randomRange(6,12);
                const canopyGeo = new THREE.SphereGeometry(canopyR, 8, 6);
                const greens = [0x3D8C2E,0x4EA83A,0x2E7A22,0x5BB848,0x448833];
                const canopyMat = new THREE.MeshStandardMaterial({color:randomChoice(greens),metalness:0,roughness:0.8});
                const canopy = new THREE.Mesh(canopyGeo, canopyMat);
                canopy.position.y = trunkH + canopyR*0.5;
                canopy.scale.y = 0.7;
                treeGroup.add(canopy);
                treeGroup.position.set(side*(this.cityW*0.25+25+randomRange(0,15)), 0, z-i);
                group.add(treeGroup);
            });
        }

        this.scene.add(group);
        this.groundSegments.push({ z, mesh:group });
    }

    _genBuildings(chunk) {
        const num = randomInt(5,10);
        for(let i=0;i<num;i++) {
            const side = randomChoice([-1,1]);
            const w = randomRange(30,70);
            const h = randomRange(40,200);
            const d = randomRange(30,60);
            // Buildings right next to the sidewalks
            const bx = side*(60+randomRange(10,50));
            const bz = chunk.z - randomRange(20, this.chunkDepth-20);
            chunk.obstacles.push(new Building(bx,0,bz,w,h,d,this.scene));
        }
        // Background buildings (farther)
        for(let i=0;i<4;i++) {
            const side = randomChoice([-1,1]);
            const w = randomRange(50,100);
            const h = randomRange(80,300);
            const d = randomRange(40,70);
            const bx = side*(120+randomRange(0,80));
            const bz = chunk.z - randomRange(30, this.chunkDepth-30);
            chunk.obstacles.push(new Building(bx,0,bz,w,h,d,this.scene));
        }
    }

    _genObstacles(chunk) {
        const density = lerp(CONFIG.BASE_OBSTACLE_DENSITY, CONFIG.MAX_OBSTACLE_DENSITY, this.difficulty);

        // Enemy patrol drones
        const numE = Math.floor(density*2)+1;
        for(let i=0;i<numE;i++) {
            chunk.obstacles.push(new EnemyDrone(
                randomRange(-this.cityW*0.18,this.cityW*0.18),
                randomRange(30,CONFIG.CITY_HEIGHT*0.6),
                chunk.z-randomRange(50,this.chunkDepth-50),
                this.scene
            ));
        }

        // Kamikaze drones (appear after some difficulty)
        if(density > 0.4 && Math.random() < density*0.5) {
            chunk.obstacles.push(new KamikazeDrone(
                randomRange(-this.cityW*0.15,this.cityW*0.15),
                randomRange(50,CONFIG.CITY_HEIGHT*0.5),
                chunk.z-randomRange(100,this.chunkDepth-100),
                this.scene
            ));
        }

        // Jammer drone (rare)
        if(density > 0.3 && Math.random() < 0.15) {
            chunk.obstacles.push(new JammerDrone(
                randomRange(-this.cityW*0.12,this.cityW*0.12),
                randomRange(60,CONFIG.CITY_HEIGHT*0.4),
                chunk.z-randomRange(100,this.chunkDepth-100),
                this.scene
            ));
        }

        // Turrets on buildings
        if(density > 0.25 && Math.random() < 0.2+density*0.3) {
            const side = randomChoice([-1,1]);
            const bh = randomRange(60,180);
            chunk.obstacles.push(new Turret(
                side*(this.cityW*0.25+50+randomRange(0,30)),
                bh,
                chunk.z-randomRange(100,this.chunkDepth-100),
                this.scene
            ));
        }

        // Crane
        if(Math.random() < 0.15+density*0.15) {
            const side = randomChoice([-1,1]);
            chunk.obstacles.push(new Crane(
                side*(this.cityW*0.25+randomRange(0,20)),0,
                chunk.z-randomRange(100,this.chunkDepth-100),
                this.scene
            ));
        }

        // Laser
        if(density > 0.35 && Math.random() < density*0.3) {
            const lx1=randomRange(-this.cityW*0.12,-10);
            const lx2=randomRange(10,this.cityW*0.12);
            const ly=randomRange(30,CONFIG.CITY_HEIGHT*0.5);
            chunk.obstacles.push(new LaserBarrier(
                lx1,ly,chunk.z-randomRange(100,this.chunkDepth-100),
                lx2,ly+randomRange(-15,15),this.scene
            ));
        }

        // Wind
        if(Math.random() < 0.2) {
            chunk.obstacles.push(new WindZone(
                randomRange(-this.cityW*0.12,this.cityW*0.12),
                randomRange(30,CONFIG.CITY_HEIGHT*0.4),
                chunk.z-randomRange(60,this.chunkDepth-60),
                randomChoice([-1,1]),0,this.scene
            ));
        }
    }

    _genCollectibles(chunk) {
        if(this.racingMode) {
            // In racing mode: Drones already "have" packages. We only generate Item Boxes (PowerUps) and Coins.
            // Item boxes
            const numItems = randomInt(2, 4);
            for(let i=0; i<numItems; i++) {
                chunk.collectibles.push(new PowerUp(
                    randomRange(-this.cityW*0.15, this.cityW*0.15),
                    randomRange(50, CONFIG.CITY_HEIGHT*0.3),
                    chunk.z-randomRange(20, this.chunkDepth-20),
                    undefined, this.scene
                ));
            }

            // Coins
            const nCoins=randomInt(4,10);
            const startX=randomRange(-this.cityW*0.15,this.cityW*0.15);
            const startY=randomRange(30,100);
            const startZ=chunk.z-randomRange(20,80);
            for(let i=0;i<nCoins;i++) {
                chunk.collectibles.push(new Coin(startX+randomRange(-10,10),startY+randomRange(-5,5),startZ-i*35,randomInt(1,2),this.scene));
            }
            return;
        }

        // --- SURVIVAL MODE BELOW ---
        // Packages (1-2 per chunk)
        const numPkg = Math.random() < 0.3 ? 2 : 1;
        for(let p=0;p<numPkg;p++) {
            const px=randomRange(-this.cityW*0.18,this.cityW*0.18);
            const py=randomRange(40,CONFIG.CITY_HEIGHT*0.45);
            const pz=chunk.z-randomRange(50,this.chunkDepth-50);
            chunk.collectibles.push(new Package(px,py,pz,this.scene));
        }

        // Delivery pad
        const padX=randomRange(-this.cityW*0.12,this.cityW*0.12);
        chunk.collectibles.push(new DeliveryPad(padX,2,chunk.z-randomRange(200,this.chunkDepth-100),this.scene));

        // Coins
        const nCoins=randomInt(4,8);
        const startX=randomRange(-this.cityW*0.15,this.cityW*0.15);
        const startY=randomRange(30,100);
        const startZ=chunk.z-randomRange(20,80);
        for(let i=0;i<nCoins;i++) {
            chunk.collectibles.push(new Coin(startX+randomRange(-10,10),startY+randomRange(-5,5),startZ-i*35,randomInt(1,2),this.scene));
        }

        // Power-ups
        if(Math.random() < 0.1 && this.chunksGenerated > 2) {
            chunk.collectibles.push(new PowerUp(
                randomRange(-this.cityW*0.12,this.cityW*0.12),
                randomRange(50,CONFIG.CITY_HEIGHT*0.4),
                chunk.z-randomRange(80,this.chunkDepth-80),
                undefined, this.scene
            ));
        }
    }

    _genDecorations(z) {
        const group = new THREE.Group();

        // Holographic ads on buildings
        if(Math.random() < 0.5) {
            const side = randomChoice([-1,1]);
            const adH = randomRange(20,40);
            const adW = randomRange(15,30);
            const adY = randomRange(40,120);
            const adZ = z - randomRange(50,this.chunkDepth-50);
            const adX = side*(this.cityW*0.25+20);

            const adGeo = new THREE.PlaneGeometry(adW, adH);
            const adColors = [0xCC4444, 0x4488CC, 0xDDAA22, 0x44AA44, 0xDD6622];
            const adColor = randomChoice(adColors);
            const adMat = new THREE.MeshStandardMaterial({
                color:adColor, emissive:0x000000, emissiveIntensity:0,
                transparent:false, opacity:1, side:THREE.DoubleSide
            });
            const ad = new THREE.Mesh(adGeo, adMat);
            ad.position.set(adX, adY, adZ);
            ad.rotation.y = side * Math.PI/2;
            group.add(ad);

            // Ad frame
            const frameGeo = new THREE.EdgesGeometry(adGeo);
            const frameMat = new THREE.LineBasicMaterial({color:adColor,transparent:true,opacity:0.8});
            const frame = new THREE.LineSegments(frameGeo, frameMat);
            frame.position.copy(ad.position);
            frame.rotation.copy(ad.rotation);
            group.add(frame);
        }

        // NPC drone (decorative)
        if(Math.random() < 0.3) {
            const npcGroup = new THREE.Group();
            const bGeo = new THREE.BoxGeometry(8,3,6);
            const bMat = new THREE.MeshStandardMaterial({color:0xEEEEEE,metalness:0.4,roughness:0.4});
            npcGroup.add(new THREE.Mesh(bGeo,bMat));
            const rGeo = new THREE.CylinderGeometry(5,5,0.3,6);
            const rMat = new THREE.MeshStandardMaterial({color:0x333,transparent:true,opacity:0.2});
            const rotor = new THREE.Mesh(rGeo,rMat);
            rotor.position.y=2.5;
            npcGroup.add(rotor);
            const ledGeo = new THREE.SphereGeometry(0.8,4,4);
            const ledMat = new THREE.MeshStandardMaterial({color:0x00cc66,emissive:0x00cc66,emissiveIntensity:1});
            const led = new THREE.Mesh(ledGeo,ledMat);
            led.position.set(0,0,-4);
            npcGroup.add(led);

            npcGroup.position.set(
                randomRange(-this.cityW*0.3,this.cityW*0.3),
                randomRange(80,200),
                z-randomRange(100,this.chunkDepth-100)
            );
            group.add(npcGroup);
        }

        // Ground vehicles (simple boxes)
        for(let i=0;i<randomInt(1,3);i++) {
            const lane = randomChoice([-1,1]) * randomRange(20,60);
            const carGeo = new THREE.BoxGeometry(randomRange(6,10),4,randomRange(12,20));
            const carColors = [0xEEEEEE,0x333333,0xCC3333,0x3366AA,0xAAAAAA,0x886633];
            const carMat = new THREE.MeshStandardMaterial({color:randomChoice(carColors),metalness:0.4,roughness:0.5});
            const car = new THREE.Mesh(carGeo,carMat);
            car.position.set(lane, 2, z-randomRange(30,this.chunkDepth-30));
            group.add(car);

            // Car lights
            const lightGeo = new THREE.SphereGeometry(0.5,4,4);
            [-1,1].forEach(s => {
                const tailColor = s === -1 ? 0xff1744 : 0xffaa00;
                const tailMat = new THREE.MeshStandardMaterial({color:tailColor,emissive:tailColor,emissiveIntensity:2});
                const tail = new THREE.Mesh(lightGeo,tailMat);
                tail.position.set(s*3, 2.5, z-randomRange(30,this.chunkDepth-30)+8);
                group.add(tail);
            });
        }

        if(group.children.length > 0) {
            this.scene.add(group);
            this.decorations.push({ z, mesh:group });
        }
    }

    getAllObstacles() {
        const a=[];
        for(const c of this.chunks) a.push(...c.obstacles);
        return a;
    }
    getAllCollectibles() {
        const a=[];
        for(const c of this.chunks) a.push(...c.collectibles.filter(x=>x.active));
        return a;
    }
}
