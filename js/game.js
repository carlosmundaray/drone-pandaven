// ============================================
// DRONES PANDAVEN 3D — Main Game Logic (FPS)
// ============================================
class Game {
    constructor(container) {
        this.container=container;

        // Renderer
        this.renderer=new THREE.WebGLRenderer({antialias:false,alpha:false});
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
        this.renderer.setSize(window.innerWidth,window.innerHeight);
        this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure=1.2;
        this.container.insertBefore(this.renderer.domElement,this.container.firstChild);

        // Scene — DAYTIME
        this.scene=new THREE.Scene();
        this.scene.background=new THREE.Color(0x87CEEB);
        this.scene.fog=new THREE.FogExp2(0xB8D8E8,0.00045);

        // HUD
        this.hudCanvas=document.getElementById('hudCanvas');
        this.hudCtx=this.hudCanvas.getContext('2d');

        // Systems
        this.camera=new Camera();
        this.scene.add(this.camera.rig);
        this.input=new InputHandler();
        this.audio=new AudioSystem();
        this.collision=new CollisionSystem();
        this.ui=new UI();
        this.particles=null;
        this.levelGen=null;
        this.player=null;

        // State
        this.state='menu';
        this.score=0;this.combo=0;this.comboTimer=0;this.maxCombo=0;
        this.coins=loadData('coins',0);this.coinsEarned=0;this.deliveries=0;
        this.rushMeter=0;this.rushActive=false;this.rushTimer=0;
        this.rushDuration=CONFIG.RUSH_DURATION;
        this.timeAlive=0;this.scrollSpeed=CONFIG.SCROLL_SPEED;
        this.timeScale=1;this.rushCount=0;this.difficulty=0;
        this.tempEffects=[];
        this.playerUpgrades=loadData('upgrades',{speed:0,battery:0,magnet:0,rush:0,boost:0});
        this.lastTime=0;

        // Rain timer
        this.rainTimer=0;

        // Projectile nearby sound cooldown
        this.nearbyProjCooldown=0;

        // Wind sound timer
        this.windSoundTimer=0;

        this._setupLights();
        this._createSky();
        this._onResize();
        window.addEventListener('resize',()=>this._onResize());
        this._setupMenuScene();

        // Pointer lock click handler
        this.renderer.domElement.addEventListener('click',()=>{
            if(this.state==='playing' && !this.input.pointerLocked) {
                this.input.requestPointerLock(this.renderer.domElement);
            }
        });
    }

    _setupLights() {
        // Bright daylight ambient
        this.scene.add(new THREE.AmbientLight(0xffffff,0.6));
        // Sky hemisphere: blue sky above, warm ground below
        this.scene.add(new THREE.HemisphereLight(0x87CEEB,0xC8B890,0.5));
        // Sun — warm directional
        const sun=new THREE.DirectionalLight(0xFFF5E0,1.2);
        sun.position.set(200,400,-100);
        this.scene.add(sun);
        // Fill light (opposite side)
        const fill=new THREE.DirectionalLight(0x8CC0E8,0.3);
        fill.position.set(-150,200,100);
        this.scene.add(fill);
    }

    _createSky() {
        // Sun disc
        const sunGeo=new THREE.SphereGeometry(40,16,16);
        const sunMat=new THREE.MeshBasicMaterial({color:0xFFF8E0});
        this.sunMesh=new THREE.Mesh(sunGeo,sunMat);
        this.sunMesh.position.set(400,600,-300);
        this.scene.add(this.sunMesh);

        // Sun glow
        const glowGeo=new THREE.SphereGeometry(80,16,16);
        const glowMat=new THREE.MeshBasicMaterial({color:0xFFEEBB,transparent:true,opacity:0.15});
        const glow=new THREE.Mesh(glowGeo,glowMat);
        glow.position.copy(this.sunMesh.position);
        this.scene.add(glow);

        // Clouds (simple white planes scattered in sky)
        const cloudMat=new THREE.MeshBasicMaterial({color:0xFFFFFF,transparent:true,opacity:0.7,side:THREE.DoubleSide});
        this.clouds=new THREE.Group();
        for(let i=0;i<30;i++) {
            const w=randomRange(80,250), h=randomRange(20,50);
            const cGeo=new THREE.PlaneGeometry(w,h);
            const cloud=new THREE.Mesh(cGeo,cloudMat.clone());
            cloud.material.opacity=randomRange(0.3,0.7);
            cloud.position.set(
                randomRange(-1500,1500),
                randomRange(350,600),
                randomRange(-2000,200)
            );
            cloud.rotation.x=-Math.PI/2;
            cloud.rotation.z=randomRange(-0.3,0.3);
            this.clouds.add(cloud);
        }
        this.scene.add(this.clouds);

        // No stars in daytime
        this.stars=null;
    }

    _setupMenuScene() {
        this.camera.setFPS(false);
        this.levelGen=new LevelGenerator(this.scene);
        this.particles=new ParticleSystem(this.scene);
        this.levelGen.generateInitialChunks(1500);
        this.camera.x=0;this.camera.y=180;this.camera.z=200;
    }

    _onResize() {
        const w=window.innerWidth,h=window.innerHeight;
        this.renderer.setSize(w,h);
        this.camera.resize(w,h);
        this.hudCanvas.width=w;this.hudCanvas.height=h;
    }

    start() {
        this.lastTime=performance.now();
        this._loop();
    }

    _loop() {
        const now=performance.now();
        let dt=Math.min((now-this.lastTime)/1000,0.05);
        this.lastTime=now;
        dt*=this.timeScale;
        this._update(dt);
        this._render();
        this.input.endFrame();
        requestAnimationFrame(()=>this._loop());
    }

    _update(dt) {
        this.ui.update(dt);
        switch(this.state){
            case 'menu':this._updateMenu(dt);break;
            case 'playing':this._updatePlaying(dt);break;
            case 'paused':this._updatePaused(dt);break;
            case 'gameover':this._updateGameOver(dt);break;
            case 'shop':this._updateShop(dt);break;
            case 'tutorial':this._updateTutorial(dt);break;
        }
        this.camera.update(dt, this.player?this.player.currentSpeed:0);
        if(this.particles) this.particles.update(dt);
    }

    _render() {
        this.renderer.render(this.scene,this.camera.cam);
        const ctx=this.hudCtx,w=this.hudCanvas.width,h=this.hudCanvas.height;
        ctx.clearRect(0,0,w,h);
        switch(this.state){
            case 'menu':this.ui.renderMainMenu(ctx,w,h);break;
            case 'playing':
                this.ui.renderCockpitHUD(ctx,w,h,{
                    score:this.score,
                    combo:this.combo,
                    comboTimer:this.comboTimer,
                    lives:this.player?this.player.lives:0,
                    maxLives:this.player?this.player.maxLives:CONFIG.DRONE_MAX_LIVES,
                    rushMeter:this.rushMeter,
                    rushMax:CONFIG.RUSH_MAX,
                    rushActive:this.rushActive,
                    coins:this.coins,
                    timeAlive:this.timeAlive,
                    deliveries:this.deliveries,
                    carryingPackage:this.player?this.player.carryingPackage:false,
                    speed:this.player?this.player.currentSpeed:0,
                    altitude:this.player?this.player.y:0,
                    barrelRollCD:this.player?this.player.barrelRollCooldown:0,
                    empShieldActive:this.player?this.player.empShieldActive:false,
                    empAvailable:this.rushMeter>=CONFIG.EMP_SHIELD_COST,
                    jammed:this.player?this.player.jammed:false,
                    jamIntensity:this.player?this.player.jamIntensity:0,
                    // Racing logic
                    gameMode: this.gameMode,
                    preRaceTimer: this.preRaceTimer,
                    racePosition: this.racePosition,
                    raceFinished: this.raceFinished,
                    playerGatesPassed: this.playerGatesPassed || 0,
                    totalGates: this.totalGates || 0,
                });
                break;
            case 'paused':this.ui.renderPauseMenu(ctx,w,h);break;
            case 'gameover':
                this.ui.renderGameOver(ctx,w,h,{
                    score:this.score,highScore:loadData('highscore',0),
                    isNewHigh:this.score>=loadData('highscore',0)&&this.score>0,
                    timeAlive:this.timeAlive,deliveries:this.deliveries,
                    maxCombo:this.maxCombo,coinsEarned:this.coinsEarned,rushCount:this.rushCount,
                });break;
            case 'shop':this.ui.renderShop(ctx,w,h,this.playerUpgrades,this.coins);break;
            case 'tutorial':this.ui.renderTutorial(ctx,w,h);break;
        }
    }

    _updateMenu(dt) {
        this.camera.z-=dt*40;
        this.camera.x=Math.sin(Date.now()*0.0003)*30;
        this.camera.y=140+Math.sin(Date.now()*0.0005)*20;
        this.camera.rig.position.set(this.camera.x,this.camera.y,this.camera.z);
        this.camera.cam.lookAt(this.camera.x,80,this.camera.z-400);
        this.levelGen.update(this.camera.z-200,1500);

        if(this.input.isKeyJustPressed('ArrowUp')||this.input.isKeyJustPressed('KeyW')){
            this.ui.selectedMenuItem=(this.ui.selectedMenuItem-1+this.ui.menuItems.length)%this.ui.menuItems.length;
            this.audio.playMenuSelect();
        }
        if(this.input.isKeyJustPressed('ArrowDown')||this.input.isKeyJustPressed('KeyS')){
            this.ui.selectedMenuItem=(this.ui.selectedMenuItem+1)%this.ui.menuItems.length;
            this.audio.playMenuSelect();
        }
        if(this.input.isConfirmPressed()){
            this.audio.init();this.audio.resume();this.audio.playMenuConfirm();
            switch(this.ui.selectedMenuItem){
                case 0:this._startGame('survival');break;
                case 1:this._startGame('racing');break;
                case 2:this.state='shop';this.ui.selectedShopItem=0;break;
                case 3:this.state='tutorial';break;
            }
        }
    }

    _startGame(mode) {
        if(this.player) this.player.dispose();
        // Dispose existing AI racers
        if(this.aiRacers) {
            for(const r of this.aiRacers) r.dispose();
        }
        this.levelGen.reset();
        if(this.particles) this.particles.clear();

        this.gameMode = mode || 'survival';
        this.score=0;this.combo=0;this.comboTimer=0;this.maxCombo=0;
        this.coinsEarned=0;this.deliveries=0;
        this.rushMeter=0;this.rushActive=false;this.rushTimer=0;
        this.timeAlive=0;this.scrollSpeed=CONFIG.SCROLL_SPEED;
        this.timeScale=1;this.difficulty=0;this.rushCount=0;this.tempEffects=[];

        // Racing variables
        if(this.gameMode === 'racing') {
            this.preRaceTimer = 3.5; // 3.. 2.. 1.. GO!
            this.raceFinished = false;
            this.racePosition = 1;
            this.playerGatesPassed = 0;
            this.totalGates = 0;
            this.levelGen.setRacingMode(true);
            this.aiRacers = [];
            
            // Create 4 AI Racers
            const racerColors = [0xff2222, 0x22ff22, 0x2222ff, 0xff22ff];
            const startPositions = [
                {x: -40, z: -40}, {x: -20, z: -80}, {x: 20, z: -80}, {x: 40, z: -40}
            ];
            for(let i=0; i<4; i++) {
                this.aiRacers.push(new AIRacer(
                    startPositions[i].x, 80, startPositions[i].z, racerColors[i], this.scene
                ));
            }
        } else {
            this.preRaceTimer = 0;
            this.levelGen.setRacingMode(false);
            this.aiRacers = [];
        }

        this.player=new Player(0,80,0,this.scene);
        this.player.upgrades={...this.playerUpgrades};
        this.player.applyUpgrades();
        this.rushDuration=CONFIG.RUSH_DURATION+this.playerUpgrades.rush*2;

        // Switch to chase camera
        this.camera.setFPS(true);
        this.camera.yaw=0; // Face forward (-Z direction)
        this.camera.pitch=-0.05;

        this.levelGen.generateInitialChunks(1800);
        this.audio.startMusic();
        this.audio.startEngine();
        this.state='playing';
        this.ui.selectedMenuItem=0;

        // Request pointer lock
        this.input.requestPointerLock(this.renderer.domElement);
    }

    _updatePlaying(dt) {
        // Pause
        if(this.input.isPausePressed()){
            this.state='paused';this.ui.selectedMenuItem=0;
            this.audio.stopMusic();this.audio.stopEngine();
            this.input.exitPointerLock();
            return;
        }

        this.timeAlive+=dt;
        this.difficulty=Math.min(1,this.timeAlive/(CONFIG.DIFFICULTY_INCREASE_INTERVAL*10));
        this.levelGen.setDifficulty(this.difficulty);

        // Racing countdown logic
        if(this.gameMode === 'racing' && this.preRaceTimer > 0) {
            this.preRaceTimer -= dt;
            if(this.preRaceTimer <= 0) {
                this.audio.playPickup(); // "GO!" sound
                this.ui.addNotification('¡GO!', COLORS.DELIVERY_GREEN, 1.5, 40);
            }
        }

        // Auto-scroll speed
        let tgtSpd=lerp(CONFIG.SCROLL_SPEED,CONFIG.MAX_SCROLL_SPEED,this.difficulty);
        if(this.gameMode === 'racing' && this.preRaceTimer > 0) tgtSpd = 0;
        this.scrollSpeed=lerp(this.scrollSpeed,tgtSpd*(this.rushActive?CONFIG.RUSH_SPEED_MULT:1),2*dt);

        if(this.player&&this.player.alive) {
            // Mouse look
            const md=this.input.getMouseDelta();
            this.camera.applyMouseDelta(md.x, md.y);

            // Forward movement
            if (this.preRaceTimer <= 0) {
                this.player.z -= this.scrollSpeed*dt;
            }

            // Player update
            const bounds={left:-CONFIG.CITY_WIDTH*0.22,right:CONFIG.CITY_WIDTH*0.22,bottom:15,top:CONFIG.CITY_HEIGHT*0.7};
            // Only allow lateral/vertical movement if not waiting for race to start
            this.player.update((this.preRaceTimer > 0 ? 0 : dt), this.input, bounds, this.camera);

            // EMP Shield activation
            if(this.input.isEMPPressed() && !this.player.empShieldActive) {
                const newRush = this.player.activateEMP(this.rushMeter);
                if(newRush !== this.rushMeter) {
                    this.rushMeter = newRush;
                    this.audio.playEMPActivate();
                    this.particles.emit(this.player.x, this.player.y, this.player.z, 'emp_burst', 20);
                    this.camera.shake(3,0.2);
                    this.ui.addNotification('🛡 ESCUDO EMP ACTIVADO',COLORS.EMP_CYAN,1.5);
                }
            }

            // SHOOTING — left click
            if(this.input.mouse.clicked || this.input.mouse.buttons[0]) {
                this.player.shoot(this.camera);
                this.audio.playTurretFire(); // reuse turret sound for player shots
                this.camera.shake(1.5, 0.05);
            }

            // Barrel roll audio
            if(this.input.isBarrelRollLeft() || this.input.isBarrelRollRight()) {
                if(this.player.barrelRolling) {
                    this.audio.playBarrelRoll();
                }
            }

            // Engine particles
            if(Math.random()<dt*20) {
                this.particles.emit(this.player.x, this.player.y-5, this.player.z+8, 'thruster', 1);
            }
            if(this.player.isBoosting && Math.random()<dt*40) {
                this.particles.emit(this.player.x, this.player.y, this.player.z+10, 'boost', 2);
            }
            if(this.rushActive && Math.random()<dt*15) {
                this.particles.emit(
                    this.player.x+randomRange(-8,8),
                    this.player.y+randomRange(-4,4),
                    this.player.z, 'rush', 1
                );
            }

            // Daytime ambiance — no rain, just occasional sparkles in sunlight
            this.rainTimer+=dt;
            if(this.rainTimer>0.3) {
                this.rainTimer=0;
                // Sun glint particles
                if(Math.random()<0.3) {
                    this.particles.emit(
                        this.player.x+randomRange(-100,100),
                        this.player.y+randomRange(30,80),
                        this.player.z+randomRange(-50,-20), 'neon', 1
                    );
                }
            }

            // Wind sound at high speed
            this.windSoundTimer-=dt;
            if(this.player.currentSpeed > 150 && this.windSoundTimer <= 0) {
                this.audio.playWind(this.player.currentSpeed/CONFIG.DRONE_SPEED);
                this.windSoundTimer = 0.5;
            }

            // Camera follow
            this.camera.follow(this.player.x, this.player.y, this.player.z, dt, this.player.vx);
            this.camera.setBoostFOV(this.player.isBoosting);

            // Update engine sound
            this.audio.updateEngine(this.player.currentSpeed, this.player.isBoosting);

            // Level generation
            this.levelGen.update(this.player.z, 1800);

            // Get all entities
            const obstacles = this.levelGen.getAllObstacles();
            const collectibles = this.levelGen.getAllCollectibles();

            // --- Update obstacles (pass player for AI) ---
            for(const o of obstacles) {
                if(o.update.length > 1) o.update(dt, this.player);
                else o.update(dt);
            }
            for(const c of collectibles) c.update(dt);

            // --- Racing Logic ---
            if(this.gameMode === 'racing') {
                // Collect all race gates from obstacles
                const raceGates = obstacles.filter(o => o.type === 'race_gate');

                // Update AI Racers — pass gates for pathfinding
                for(const racer of this.aiRacers) {
                    racer.update((this.preRaceTimer > 0 ? 0 : dt), raceGates);
                }

                // Player gate checkpoint check
                for(const gate of raceGates) {
                    if(!gate.passed && gate.checkPass(this.player.x, this.player.y, this.player.z, this.player.z + this.scrollSpeed * dt)) {
                        this.playerGatesPassed = (this.playerGatesPassed || 0) + 1;
                        this.score += 100;
                        this.audio.playPickup();
                        this.particles.emit(gate.x, gate.y, gate.z, 'neon', 15);
                        this.camera.shake(2, 0.1);
                        this.ui.addNotification(`✓ GATE ${this.playerGatesPassed}`, '#00ffaa', 1.0);
                    }
                }

                // Calculate Position based on gates passed + Z progress
                let allRacers = [
                    { isPlayer: true, gates: this.playerGatesPassed || 0, z: this.player.z },
                    ...this.aiRacers.map(r => ({ isPlayer: false, gates: r.gatesPassed, z: r.z }))
                ];
                allRacers.sort((a,b) => {
                    if(b.gates !== a.gates) return b.gates - a.gates; // more gates = better
                    return a.z - b.z; // lower Z = further ahead
                });
                this.racePosition = allRacers.findIndex(r => r.isPlayer) + 1;
                this.totalGates = this.levelGen.raceGateCounter || 0;

                // Check Finish Line crossing (-15000 Z)
                if(this.player.z <= -15000 && !this.raceFinished) {
                    this.raceFinished = true;
                    this.ui.addNotification(
                        this.racePosition === 1 ? '🏆 ¡VICTORIA!' : `POSICIÓN ${this.racePosition}°`,
                        this.racePosition === 1 ? '#FFD700' : '#ff4444', 4.0
                    );
                    setTimeout(() => {
                        this.state = 'gameover';
                    }, 4000);
                }
            }

            // Reset jammer
            this.player.jammed = false;

            // --- Collisions: obstacles ---
            for(const o of obstacles) {
                if(o.type==='building') {
                    if(this.collision.sphereBox(this.player.x,this.player.y,this.player.z,this.player.radius,
                        o.x,o.y+o.height/2,o.z,o.width,o.height,o.depth))
                        this._playerHit();
                } else if(o.type==='enemy_drone') {
                    if(this.collision.spheresIntersect(this.player.x,this.player.y,this.player.z,this.player.radius,
                        o.x,o.y,o.z,10))
                        this._playerHit();
                } else if(o.type==='kamikaze') {
                    if(this.collision.spheresIntersect(this.player.x,this.player.y,this.player.z,this.player.radius,
                        o.x,o.y,o.z,8)) {
                        this._playerHit();
                        o.active=false;
                        this.particles.emit(o.x,o.y,o.z,'explosion',20);
                        o.dispose();
                    }
                } else if(o.type==='crane') {
                    if(this.collision.sphereBox(this.player.x,this.player.y,this.player.z,this.player.radius,
                        o.x,90,o.z,12,180,12))
                        this._playerHit();
                } else if(o.type==='laser'&&o.checkCollision) {
                    if(o.checkCollision(this.player)) this._playerHit();
                } else if(o.type==='wind'&&o.applyForce) {
                    o.applyForce(this.player,dt);
                }
                // Jammer (handled in its update)

                // --- Projectile collisions from enemies ---
                if(o.projectiles) {
                    for(const p of o.projectiles) {
                        if(!p.active) continue;

                        // Projectile trail particles
                        if(Math.random()<dt*30) {
                            this.particles.emit(p.x,p.y,p.z,'projectile_trail',1);
                        }

                        // Near-miss sound
                        const distToPlayer = distance3D(p.x,p.y,p.z,this.player.x,this.player.y,this.player.z);
                        if(distToPlayer < 40 && this.nearbyProjCooldown <= 0) {
                            this.audio.playProjectileNearby();
                            this.nearbyProjCooldown = 0.5;
                        }

                        // Shield hit
                        if(this.player.empShieldActive) {
                            if(this.collision.projectileHitsShield(p, this.player)) {
                                p.active=false;
                                this.particles.emit(p.x,p.y,p.z,'shield_hit',8);
                                this.audio.playShieldHit();
                                p.dispose();
                                continue;
                            }
                        }

                        // Player hit
                        if(this.collision.projectileHitsPlayer(p, this.player)) {
                            p.active=false;
                            p.dispose();
                            this._playerHit();
                        }
                    }
                }
            }

            this.nearbyProjCooldown -= dt;

            // --- Player projectiles vs enemies ---
            for(const pp of this.player.projectiles) {
                if(!pp.active) continue;
                // Trail particles
                if(Math.random()<dt*25) {
                    this.particles.emit(pp.x,pp.y,pp.z,'projectile_trail',1);
                }
                for(const o of obstacles) {
                    if(o.type==='enemy_drone' || o.type==='kamikaze' || o.type==='turret' || o.type==='jammer') {
                        const eRadius = o.type==='turret' ? 8 : 10;
                        if(this.collision.spheresIntersect(pp.x,pp.y,pp.z,pp.radius, o.x,o.y,o.z,eRadius)) {
                            pp.active=false; pp.dispose();
                            this.particles.emit(o.x,o.y,o.z,'explosion',15);
                            this.audio.playDamage();
                            this._addScore(100);
                            this.ui.addNotification('💥 ¡ENEMIGO DESTRUIDO!',COLORS.DANGER_RED,1);
                            // Remove enemy
                            if(o.dispose) o.dispose();
                            o.active=false;
                            break;
                        }
                    }
                    // Hit buildings (just destroy projectile)
                    if(o.type==='building') {
                        if(this.collision.sphereBox(pp.x,pp.y,pp.z,pp.radius,
                            o.x,o.y+o.height/2,o.z,o.width,o.height,o.depth)) {
                            pp.active=false; pp.dispose();
                            this.particles.emit(pp.x,pp.y,pp.z,'sparks',5);
                            break;
                        }
                    }
                }
            }

            // --- Collectibles ---
            for(const c of collectibles) {
                if(c instanceof Package) {
                    if(c.checkCollection(this.player)) {
                        c.active=false;c.collected=true;c.dispose();
                        this.player.carryingPackage=true;
                        this.audio.playPickup();
                        this.particles.emit(c.x,c.y,c.z,'pickup',10);
                        this.rushMeter=Math.min(CONFIG.RUSH_MAX,this.rushMeter+CONFIG.RUSH_GAIN_PER_PACKAGE);
                        this._addScore(CONFIG.PACKAGE_SCORE);
                        this.ui.addNotification('📦 ¡PAQUETE RECOGIDO!',COLORS.DRONE_YELLOW,1.5);
                    }
                } else if(c instanceof DeliveryPad) {
                    if(c.checkDelivery(this.player)) {
                        this.player.carryingPackage=false;this.deliveries++;
                        this.audio.playDelivery();
                        this.particles.emit(c.x,c.y+10,c.z,'delivery',20);
                        this.rushMeter=Math.min(CONFIG.RUSH_MAX,this.rushMeter+CONFIG.RUSH_GAIN_PER_DELIVERY);
                        this._addScore(CONFIG.DELIVERY_SCORE*(1+this.deliveries*0.1));
                        this._addCombo();this.camera.shake(4,0.2);
                        this.ui.addNotification(`🎯 ¡ENTREGA #${this.deliveries}!`,COLORS.DELIVERY_GREEN,2);
                    }
                } else if(c instanceof Coin) {
                    c.getMagnetPulled(this.player,dt);
                    if(c.checkCollection(this.player)) {
                        c.active=false;c.dispose();
                        this.coins++;this.coinsEarned++;
                        this.audio.playCoin();
                        this.particles.emit(c.x,c.y,c.z,'coin',3);
                        this._addScore(CONFIG.COIN_SCORE);
                    }
                } else if(c instanceof PowerUp) {
                    if(c.checkCollection(this.player)) {
                        c.active=false;c.apply(this.player,this);
                        this.audio.playPickup();
                        this.particles.emit(c.x,c.y,c.z,'pickup',10);
                        const names={shield:'🛡 ESCUDO',speed:'⚡ VELOCIDAD',magnet:'🧲 IMÁN',timeslow:'⏳ CÁMARA LENTA'};
                        this.ui.addNotification(names[c.powerType]||'POWER UP',COLORS.NEON_CYAN,2);
                        c.dispose();
                    }
                }
            }

            // --- Rush mode ---
            if(!this.rushActive&&this.rushMeter>=CONFIG.RUSH_MAX) {
                this.rushActive=true;this.rushTimer=0;this.rushCount++;
                this.audio.playRushActivate();
                this.camera.setZoom(1.5);
                this.camera.shake(5,0.3);
                this.ui.addNotification('⚡ ¡RUSH MODE! ⚡',COLORS.RUSH_ORANGE,2);
                this.audio.setMusicTempo(1.3);
            }
            if(this.rushActive) {
                this.rushTimer+=dt;
                this.rushMeter=CONFIG.RUSH_MAX*(1-this.rushTimer/this.rushDuration);
                if(this.rushTimer>=this.rushDuration) {
                    this.rushActive=false;this.rushMeter=0;
                    this.camera.setZoom(1);
                    this.audio.playRushEnd();this.audio.setMusicTempo(1);
                }
            }

            // Combo decay
            if(this.combo>0){this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=0;}

            // Temp effects
            this.tempEffects=this.tempEffects.filter(e=>{
                e.timer+=dt;
                if(e.timer>=e.duration){e.onEnd();return false;}
                return true;
            });

            // Passive score
            this.score+=dt*5*(this.rushActive?CONFIG.RUSH_SCORE_MULT:1);

            // --- Update minimap & threats ---
            this._updateMinimapAndThreats(obstacles, collectibles);
        }

        // Clouds + sun follow player
        if(this.clouds && this.player) this.clouds.position.z=this.player.z;
        if(this.sunMesh && this.player) this.sunMesh.position.z=this.player.z-300;

        // Compass
        this.ui.setCompassYaw(this.camera.yaw);
    }

    _updateMinimapAndThreats(obstacles, collectibles) {
        const mmEntities = [];
        const threats = [];
        const px=this.player.x, py=this.player.y, pz=this.player.z;

        for(const c of collectibles) {
            const rx=c.x-px, rz=c.z-pz;
            if(c instanceof Package && c.active) {
                mmEntities.push({rx,rz,type:'package',color:COLORS.DRONE_YELLOW});
            } else if(c instanceof DeliveryPad && c.active) {
                mmEntities.push({rx,rz,type:'pad',color:COLORS.DELIVERY_GREEN});
            } else if(c instanceof Coin && c.active) {
                mmEntities.push({rx,rz,type:'coin',color:COLORS.COIN_GOLD});
            }
        }

        for(const o of obstacles) {
            const rx=o.x-px, rz=o.z-pz;
            const dist=Math.sqrt(rx*rx+rz*rz);

            if(o.type==='enemy_drone'||o.type==='kamikaze'||o.type==='turret') {
                mmEntities.push({rx,rz,type:'enemy',color:COLORS.DANGER_RED});

                // Threat direction indicator
                if(dist < 300) {
                    const angle = Math.atan2(rx, rz) - this.camera.yaw;
                    threats.push({angle,distance:dist,type:'enemy'});
                }
            }
            if(o.type==='jammer' && o.jamActive) {
                mmEntities.push({rx,rz,type:'enemy',color:COLORS.NEON_PURPLE});
            }

            // Projectile threats
            if(o.projectiles) {
                for(const p of o.projectiles) {
                    if(!p.active) continue;
                    const prx=p.x-px, prz=p.z-pz;
                    const pdist=Math.sqrt(prx*prx+prz*prz);
                    if(pdist < 200) {
                        const angle = Math.atan2(prx,prz) - this.camera.yaw;
                        threats.push({angle,distance:pdist,type:'projectile'});
                    }
                }
            }
        }

        this.ui.setMinimapEntities(mmEntities);
        this.ui.setThreats(threats);

        // --- Delivery waypoint ---
        let nearestPad = null, nearestPadDist = Infinity;
        let nearestPkg = null, nearestPkgDist = Infinity;
        for(const c of collectibles) {
            if(c instanceof DeliveryPad && c.active) {
                const d = distance3D(px,py,pz, c.x,c.y,c.z);
                if(d < nearestPadDist) { nearestPadDist=d; nearestPad=c; }
            }
            if(c instanceof Package && c.active && !c.collected) {
                const d = distance3D(px,py,pz, c.x,c.y,c.z);
                if(d < nearestPkgDist) { nearestPkgDist=d; nearestPkg=c; }
            }
        }

        // Set waypoint: if carrying package, point to delivery pad; else point to nearest package
        if(this.player.carryingPackage && nearestPad) {
            const rx=nearestPad.x-px, rz=nearestPad.z-pz;
            const angle = Math.atan2(rx, rz) - this.camera.yaw;
            this.ui.setWaypoint({
                angle, distance: nearestPadDist,
                label: '🏁 ENTREGA', color: COLORS.DELIVERY_GREEN,
                wx: nearestPad.x, wy: nearestPad.y, wz: nearestPad.z
            });
        } else if(nearestPkg) {
            const rx=nearestPkg.x-px, rz=nearestPkg.z-pz;
            const angle = Math.atan2(rx, rz) - this.camera.yaw;
            this.ui.setWaypoint({
                angle, distance: nearestPkgDist,
                label: '📦 PAQUETE', color: COLORS.DRONE_YELLOW,
                wx: nearestPkg.x, wy: nearestPkg.y, wz: nearestPkg.z
            });
        } else {
            this.ui.setWaypoint(null);
        }
    }

    _playerHit() {
        if(!this.player||!this.player.alive) return;
        const died=this.player.takeDamage(this.particles,this.audio);
        this.camera.shake(10,0.3);
        this.camera.triggerGlitch(1);
        this.ui.triggerDamageVignette();
        this.ui.triggerHUDGlitch(1);
        this.combo=0;
        if(died) this._gameOver();
    }

    _addScore(amount) {
        const mult=this.rushActive?CONFIG.RUSH_SCORE_MULT:1;
        const cm=Math.min(this.combo,CONFIG.MAX_COMBO_MULT);
        this.score+=Math.floor(amount*mult*Math.max(1,cm));
    }

    _addCombo() {
        this.combo++;this.comboTimer=CONFIG.COMBO_TIMEOUT;
        if(this.combo>this.maxCombo) this.maxCombo=this.combo;
        this.audio.playCombo(this.combo);
        if(this.combo>=3) {
            this.ui.addComboPopup(0,0,`x${this.combo} COMBO!`,
                this.combo>=5?COLORS.RUSH_YELLOW:COLORS.NEON_CYAN, 18+this.combo*2);
        }
    }

    addTemporaryEffect(name,duration,onStart,onEnd) {
        this.tempEffects=this.tempEffects.filter(e=>{
            if(e.name===name){e.onEnd();return false;}
            return true;
        });
        onStart();
        this.tempEffects.push({name,duration,timer:0,onEnd});
    }

    _gameOver() {
        this.state='gameover';this.ui.selectedMenuItem=0;
        this.audio.stopMusic();this.audio.stopEngine();this.audio.playGameOver();
        this.input.exitPointerLock();
        this.score=Math.floor(this.score);
        const prev=loadData('highscore',0);
        if(this.score>prev) saveData('highscore',this.score);
        saveData('coins',this.coins);
        for(const e of this.tempEffects) e.onEnd();
        this.tempEffects=[];this.timeScale=1;
    }

    _updatePaused(dt) {
        if(this.input.isPausePressed()){
            this.state='playing';
            this.audio.startMusic();this.audio.startEngine();
            this.input.requestPointerLock(this.renderer.domElement);
            return;
        }
        if(this.input.isKeyJustPressed('ArrowUp')||this.input.isKeyJustPressed('KeyW')){
            this.ui.selectedMenuItem=(this.ui.selectedMenuItem-1+3)%3;this.audio.playMenuSelect();
        }
        if(this.input.isKeyJustPressed('ArrowDown')||this.input.isKeyJustPressed('KeyS')){
            this.ui.selectedMenuItem=(this.ui.selectedMenuItem+1)%3;this.audio.playMenuSelect();
        }
        if(this.input.isConfirmPressed()){
            this.audio.playMenuConfirm();
            switch(this.ui.selectedMenuItem){
                case 0:
                    this.state='playing';this.audio.startMusic();this.audio.startEngine();
                    this.input.requestPointerLock(this.renderer.domElement);
                    break;
                case 1:this._startGame();break;
                case 2:this._goToMenu();break;
            }
        }
    }

    _updateGameOver(dt) {
        // Slow camera drift
        if(this.player) {
            this.camera.y += dt * 20;
            this.camera.rig.position.y = this.camera.y;
            this.camera.cam.rotation.z += dt * 0.1;
        }
        if(this.input.isKeyJustPressed('ArrowUp')||this.input.isKeyJustPressed('KeyW')){
            this.ui.selectedMenuItem=(this.ui.selectedMenuItem-1+3)%3;this.audio.playMenuSelect();
        }
        if(this.input.isKeyJustPressed('ArrowDown')||this.input.isKeyJustPressed('KeyS')){
            this.ui.selectedMenuItem=(this.ui.selectedMenuItem+1)%3;this.audio.playMenuSelect();
        }
        if(this.input.isConfirmPressed()){
            this.audio.playMenuConfirm();
            switch(this.ui.selectedMenuItem){
                case 0:this._startGame();break;
                case 1:this.state='shop';this.ui.selectedShopItem=0;break;
                case 2:this._goToMenu();break;
            }
        }
    }

    _updateShop(dt) {
        const items=this.ui.shopItems;
        if(this.input.isKeyJustPressed('ArrowUp')||this.input.isKeyJustPressed('KeyW')){
            this.ui.selectedShopItem=(this.ui.selectedShopItem-1+items.length)%items.length;
            this.audio.playMenuSelect();
        }
        if(this.input.isKeyJustPressed('ArrowDown')||this.input.isKeyJustPressed('KeyS')){
            this.ui.selectedShopItem=(this.ui.selectedShopItem+1)%items.length;
            this.audio.playMenuSelect();
        }
        if(this.input.isKeyJustPressed('Enter')||this.input.isKeyJustPressed('Space')){
            const key=items[this.ui.selectedShopItem];
            const upg=CONFIG.UPGRADES[key];
            const lv=this.playerUpgrades[key]||0;
            const cost=upg.baseCost*(lv+1);
            if(lv<upg.maxLevel&&this.coins>=cost){
                this.coins-=cost;this.playerUpgrades[key]=lv+1;
                saveData('coins',this.coins);saveData('upgrades',this.playerUpgrades);
                this.audio.playMenuConfirm();
                this.ui.addNotification(`✅ ${upg.name} nivel ${lv+1}`,COLORS.DELIVERY_GREEN,2);
            } else this.audio.playDamage();
        }
        if(this.input.isPausePressed()){
            this.state=this.player&&!this.player.alive?'gameover':'menu';
            this.ui.selectedMenuItem=0;
        }
    }

    _updateTutorial(dt) {
        if(Object.keys(this.input.keysJustPressed).length>0||this.input.mouse.clicked){
            this.state='menu';this.ui.selectedMenuItem=0;
        }
    }

    _goToMenu() {
        if(this.player){this.player.dispose();this.player=null;}
        this.levelGen.reset();this.particles.clear();
        this.audio.stopMusic();this.audio.stopEngine();
        this.input.exitPointerLock();
        this.camera.setFPS(false);
        this.state='menu';this.ui.selectedMenuItem=0;
        this._setupMenuScene();
    }
}
