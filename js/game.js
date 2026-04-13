// ============================================
// DRONES PANDAVEN 3D — Main Game Logic (Optimized)
// ============================================
class Game {
    constructor(container) {
        this.container=container;

        // Renderer
        this.renderer=new THREE.WebGLRenderer({antialias:false,alpha:false});
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
        this.renderer.setSize(window.innerWidth,window.innerHeight);
        this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure=1.1;
        this.container.insertBefore(this.renderer.domElement,this.container.firstChild);

        // Scene
        this.scene=new THREE.Scene();
        this.scene.background=new THREE.Color(0x050810);
        this.scene.fog=new THREE.FogExp2(0x050810,0.0008);

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

        this._setupLights();
        this._createSky();
        this._onResize();
        window.addEventListener('resize',()=>this._onResize());
        this._setupMenuScene();
    }

    _setupLights() {
        this.scene.add(new THREE.AmbientLight(0x1a1a30,0.5));
        this.scene.add(new THREE.HemisphereLight(0x0a0a2e,0x0d1117,0.4));
        const dir=new THREE.DirectionalLight(0x4466aa,0.4);
        dir.position.set(100,300,-200);
        this.scene.add(dir);
    }

    _createSky() {
        // Stars only (no sky sphere needed with fog)
        const geo=new THREE.BufferGeometry();
        const pos=new Float32Array(300*3);
        for(let i=0;i<300;i++){
            const theta=Math.random()*Math.PI*2;
            const phi=Math.random()*Math.PI*0.4;
            const r=1500;
            pos[i*3]=r*Math.sin(phi)*Math.cos(theta);
            pos[i*3+1]=r*Math.cos(phi)+200;
            pos[i*3+2]=r*Math.sin(phi)*Math.sin(theta);
        }
        geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
        this.stars=new THREE.Points(geo,new THREE.PointsMaterial({color:0xffffff,size:1.5,sizeAttenuation:true}));
        this.scene.add(this.stars);
    }

    _setupMenuScene() {
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
        this.camera.update(dt);
        if(this.particles)this.particles.update(dt);
    }

    _render() {
        this.renderer.render(this.scene,this.camera.cam);
        const ctx=this.hudCtx,w=this.hudCanvas.width,h=this.hudCanvas.height;
        ctx.clearRect(0,0,w,h);
        switch(this.state){
            case 'menu':this.ui.renderMainMenu(ctx,w,h);break;
            case 'playing':
                this.ui.renderHUD(ctx,w,h,{
                    score:this.score,combo:this.combo,comboTimer:this.comboTimer,
                    lives:this.player?this.player.lives:0,
                    maxLives:this.player?this.player.maxLives:CONFIG.DRONE_MAX_LIVES,
                    rushMeter:this.rushMeter,rushMax:CONFIG.RUSH_MAX,rushActive:this.rushActive,
                    coins:this.coins,timeAlive:this.timeAlive,
                    boostCooldown:this.player?this.player.boostCooldown:0,
                    boostCooldownMax:this.player?this.player.boostCooldownMax:CONFIG.DRONE_BOOST_COOLDOWN,
                    deliveries:this.deliveries,
                    carryingPackage:this.player?this.player.carryingPackage:false,
                });break;
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
                case 0:this._startGame();break;
                case 1:this.state='shop';this.ui.selectedShopItem=0;break;
                case 2:this.state='tutorial';break;
            }
        }
    }

    _startGame() {
        if(this.player)this.player.dispose();
        this.levelGen.reset();
        if(this.particles)this.particles.clear();
        this.score=0;this.combo=0;this.comboTimer=0;this.maxCombo=0;
        this.coinsEarned=0;this.deliveries=0;
        this.rushMeter=0;this.rushActive=false;this.rushTimer=0;
        this.timeAlive=0;this.scrollSpeed=CONFIG.SCROLL_SPEED;
        this.timeScale=1;this.difficulty=0;this.rushCount=0;this.tempEffects=[];
        this.player=new Player(0,80,0,this.scene);
        this.player.upgrades={...this.playerUpgrades};
        this.player.applyUpgrades();
        this.rushDuration=CONFIG.RUSH_DURATION+this.playerUpgrades.rush*2;
        this.levelGen.generateInitialChunks(1800);
        this.audio.startMusic();
        this.state='playing';this.ui.selectedMenuItem=0;
    }

    _updatePlaying(dt) {
        if(this.input.isPausePressed()){this.state='paused';this.ui.selectedMenuItem=0;this.audio.stopMusic();return;}
        this.timeAlive+=dt;
        this.difficulty=Math.min(1,this.timeAlive/(CONFIG.DIFFICULTY_INCREASE_INTERVAL*10));
        this.levelGen.setDifficulty(this.difficulty);
        const tgtSpd=lerp(CONFIG.SCROLL_SPEED,CONFIG.MAX_SCROLL_SPEED,this.difficulty);
        this.scrollSpeed=lerp(this.scrollSpeed,tgtSpd*(this.rushActive?CONFIG.RUSH_SPEED_MULT:1),2*dt);

        if(this.player&&this.player.alive){
            this.player.z-=this.scrollSpeed*dt;
            const bounds={left:-CONFIG.CITY_WIDTH*0.22,right:CONFIG.CITY_WIDTH*0.22,bottom:15,top:CONFIG.CITY_HEIGHT*0.7};
            this.player.update(dt,this.input,bounds);

            if(Math.random()<dt*25)this.particles.emit(this.player.x,this.player.y-5,this.player.z+8,'thruster',1);
            if(this.player.isBoosting&&Math.random()<dt*40)this.particles.emit(this.player.x,this.player.y,this.player.z+10,'boost',2);
            if(this.rushActive&&Math.random()<dt*15)this.particles.emit(this.player.x+randomRange(-8,8),this.player.y+randomRange(-4,4),this.player.z,'rush',1);

            this.camera.follow(this.player.x,this.player.y,this.player.z,dt);
            this.levelGen.update(this.player.z,1800);

            const obstacles=this.levelGen.getAllObstacles();
            const collectibles=this.levelGen.getAllCollectibles();

            for(const o of obstacles) o.update(dt);

            for(const c of collectibles) c.update(dt);

            // Collisions (obstacles)
            for(const o of obstacles){
                if(o.type==='building'){
                    if(this.collision.sphereBox(this.player.x,this.player.y,this.player.z,this.player.radius,o.x,o.y+o.height/2,o.z,o.width,o.height,o.depth))
                        this._playerHit();
                } else if(o.type==='enemy_drone'){
                    if(this.collision.spheresIntersect(this.player.x,this.player.y,this.player.z,this.player.radius,o.x,o.y,o.z,10))
                        this._playerHit();
                } else if(o.type==='crane'){
                    if(this.collision.sphereBox(this.player.x,this.player.y,this.player.z,this.player.radius,o.x,90,o.z,12,180,12))
                        this._playerHit();
                } else if(o.type==='laser'&&o.checkCollision){
                    if(o.checkCollision(this.player)) this._playerHit();
                } else if(o.type==='wind'&&o.applyForce){
                    o.applyForce(this.player,dt);
                }
            }

            // Collectibles
            for(const c of collectibles){
                if(c instanceof Package){
                    if(c.checkCollection(this.player)){
                        c.active=false;c.collected=true;c.dispose();
                        this.player.carryingPackage=true;
                        this.audio.playPickup();
                        this.particles.emit(c.x,c.y,c.z,'pickup',10);
                        this.rushMeter=Math.min(CONFIG.RUSH_MAX,this.rushMeter+CONFIG.RUSH_GAIN_PER_PACKAGE);
                        this._addScore(CONFIG.PACKAGE_SCORE);
                        this.ui.addNotification('📦 ¡PAQUETE RECOGIDO!',COLORS.DRONE_YELLOW,1.5);
                    }
                } else if(c instanceof DeliveryPad){
                    if(c.checkDelivery(this.player)){
                        this.player.carryingPackage=false;this.deliveries++;
                        this.audio.playDelivery();
                        this.particles.emit(c.x,c.y+10,c.z,'delivery',20);
                        this.rushMeter=Math.min(CONFIG.RUSH_MAX,this.rushMeter+CONFIG.RUSH_GAIN_PER_DELIVERY);
                        this._addScore(CONFIG.DELIVERY_SCORE*(1+this.deliveries*0.1));
                        this._addCombo();this.camera.shake(4,0.2);
                        this.ui.addNotification(`🎯 ¡ENTREGA #${this.deliveries}!`,COLORS.DELIVERY_GREEN,2);
                    }
                } else if(c instanceof Coin){
                    c.getMagnetPulled(this.player,dt);
                    if(c.checkCollection(this.player)){
                        c.active=false;c.dispose();
                        this.coins++;this.coinsEarned++;
                        this.audio.playCoin();
                        this.particles.emit(c.x,c.y,c.z,'coin',3);
                        this._addScore(CONFIG.COIN_SCORE);
                    }
                } else if(c instanceof PowerUp){
                    if(c.checkCollection(this.player)){
                        c.active=false;c.apply(this.player,this);
                        this.audio.playPickup();
                        this.particles.emit(c.x,c.y,c.z,'pickup',10);
                        const names={shield:'🛡 ESCUDO',speed:'⚡ VELOCIDAD',magnet:'🧲 IMÁN',timeslow:'⏳ CÁMARA LENTA'};
                        this.ui.addNotification(names[c.powerType]||'POWER UP',COLORS.NEON_CYAN,2);
                        c.dispose();
                    }
                }
            }

            // Rush mode
            if(!this.rushActive&&this.rushMeter>=CONFIG.RUSH_MAX){
                this.rushActive=true;this.rushTimer=0;this.rushCount++;
                this.audio.playRushActivate();this.camera.setZoom(1.5);this.camera.shake(5,0.3);
                this.ui.addNotification('⚡ ¡RUSH MODE! ⚡',COLORS.RUSH_ORANGE,2);
                this.audio.setMusicTempo(1.3);
            }
            if(this.rushActive){
                this.rushTimer+=dt;
                this.rushMeter=CONFIG.RUSH_MAX*(1-this.rushTimer/this.rushDuration);
                if(this.rushTimer>=this.rushDuration){
                    this.rushActive=false;this.rushMeter=0;this.camera.setZoom(1);
                    this.audio.playRushEnd();this.audio.setMusicTempo(1);
                }
            }
            if(this.combo>0){this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=0;}
            this.tempEffects=this.tempEffects.filter(e=>{e.timer+=dt;if(e.timer>=e.duration){e.onEnd();return false;}return true;});
            this.score+=dt*5*(this.rushActive?CONFIG.RUSH_SCORE_MULT:1);
        }
        if(this.stars)this.stars.position.z=this.player?this.player.z:0;
    }

    _playerHit() {
        if(!this.player||!this.player.alive)return;
        const died=this.player.takeDamage(this.particles,this.audio);
        this.camera.shake(8,0.3);this.ui.triggerDamageVignette();this.combo=0;
        if(died)this._gameOver();
    }

    _addScore(amount) {
        const mult=this.rushActive?CONFIG.RUSH_SCORE_MULT:1;
        const cm=Math.min(this.combo,CONFIG.MAX_COMBO_MULT);
        this.score+=Math.floor(amount*mult*Math.max(1,cm));
    }

    _addCombo() {
        this.combo++;this.comboTimer=CONFIG.COMBO_TIMEOUT;
        if(this.combo>this.maxCombo)this.maxCombo=this.combo;
        this.audio.playCombo(this.combo);
        if(this.combo>=3) this.ui.addComboPopup(0,0,`x${this.combo} COMBO!`,this.combo>=5?COLORS.RUSH_YELLOW:COLORS.NEON_CYAN,18+this.combo*2);
    }

    addTemporaryEffect(name,duration,onStart,onEnd) {
        this.tempEffects=this.tempEffects.filter(e=>{if(e.name===name){e.onEnd();return false;}return true;});
        onStart();
        this.tempEffects.push({name,duration,timer:0,onEnd});
    }

    _gameOver() {
        this.state='gameover';this.ui.selectedMenuItem=0;
        this.audio.stopMusic();this.audio.playGameOver();
        this.score=Math.floor(this.score);
        const prev=loadData('highscore',0);
        if(this.score>prev)saveData('highscore',this.score);
        saveData('coins',this.coins);
        for(const e of this.tempEffects)e.onEnd();
        this.tempEffects=[];this.timeScale=1;
    }

    _updatePaused(dt) {
        if(this.input.isPausePressed()){this.state='playing';this.audio.startMusic();return;}
        if(this.input.isKeyJustPressed('ArrowUp')||this.input.isKeyJustPressed('KeyW')){this.ui.selectedMenuItem=(this.ui.selectedMenuItem-1+3)%3;this.audio.playMenuSelect();}
        if(this.input.isKeyJustPressed('ArrowDown')||this.input.isKeyJustPressed('KeyS')){this.ui.selectedMenuItem=(this.ui.selectedMenuItem+1)%3;this.audio.playMenuSelect();}
        if(this.input.isConfirmPressed()){
            this.audio.playMenuConfirm();
            switch(this.ui.selectedMenuItem){case 0:this.state='playing';this.audio.startMusic();break;case 1:this._startGame();break;case 2:this._goToMenu();break;}
        }
    }

    _updateGameOver(dt) {
        if(this.player){this.camera.z-=dt*15;this.camera.rig.position.z=this.camera.z;}
        if(this.input.isKeyJustPressed('ArrowUp')||this.input.isKeyJustPressed('KeyW')){this.ui.selectedMenuItem=(this.ui.selectedMenuItem-1+3)%3;this.audio.playMenuSelect();}
        if(this.input.isKeyJustPressed('ArrowDown')||this.input.isKeyJustPressed('KeyS')){this.ui.selectedMenuItem=(this.ui.selectedMenuItem+1)%3;this.audio.playMenuSelect();}
        if(this.input.isConfirmPressed()){
            this.audio.playMenuConfirm();
            switch(this.ui.selectedMenuItem){case 0:this._startGame();break;case 1:this.state='shop';this.ui.selectedShopItem=0;break;case 2:this._goToMenu();break;}
        }
    }

    _updateShop(dt) {
        const items=this.ui.shopItems;
        if(this.input.isKeyJustPressed('ArrowUp')||this.input.isKeyJustPressed('KeyW')){this.ui.selectedShopItem=(this.ui.selectedShopItem-1+items.length)%items.length;this.audio.playMenuSelect();}
        if(this.input.isKeyJustPressed('ArrowDown')||this.input.isKeyJustPressed('KeyS')){this.ui.selectedShopItem=(this.ui.selectedShopItem+1)%items.length;this.audio.playMenuSelect();}
        if(this.input.isKeyJustPressed('Enter')||this.input.isKeyJustPressed('Space')){
            const key=items[this.ui.selectedShopItem],upg=CONFIG.UPGRADES[key],lv=this.playerUpgrades[key]||0,cost=upg.baseCost*(lv+1);
            if(lv<upg.maxLevel&&this.coins>=cost){
                this.coins-=cost;this.playerUpgrades[key]=lv+1;
                saveData('coins',this.coins);saveData('upgrades',this.playerUpgrades);
                this.audio.playMenuConfirm();
                this.ui.addNotification(`✅ ${upg.name} nivel ${lv+1}`,COLORS.DELIVERY_GREEN,2);
            } else this.audio.playDamage();
        }
        if(this.input.isPausePressed()){this.state=this.player&&!this.player.alive?'gameover':'menu';this.ui.selectedMenuItem=0;}
    }

    _updateTutorial(dt) {
        if(Object.keys(this.input.keysJustPressed).length>0||this.input.mouse.clicked){this.state='menu';this.ui.selectedMenuItem=0;}
    }

    _goToMenu() {
        if(this.player){this.player.dispose();this.player=null;}
        this.levelGen.reset();this.particles.clear();this.audio.stopMusic();
        this.state='menu';this.ui.selectedMenuItem=0;
        this._setupMenuScene();
    }
}
