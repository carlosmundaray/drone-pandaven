// ============================================
// DRONES PANDAVEN 3D — UI System (2D HUD Overlay)
// ============================================
class UI {
    constructor() {
        this.notifications=[];
        this.comboPopups=[];
        this.damageVignette=0;
        this.rushFlash=0;
        this.scanlineOffset=0;
        this.selectedMenuItem=0;
        this.menuItems=[];
        this.menuAnimTimer=0;
        this.selectedShopItem=0;
        this.shopItems=Object.keys(CONFIG.UPGRADES);
    }

    update(dt) {
        this.menuAnimTimer+=dt;
        this.scanlineOffset=(this.scanlineOffset+dt*50)%4;
        this.notifications=this.notifications.filter(n=>{n.timer+=dt;return n.timer<n.duration;});
        this.comboPopups=this.comboPopups.filter(p=>{p.timer+=dt;p.y-=dt*40;return p.timer<p.duration;});
        if(this.damageVignette>0) this.damageVignette-=dt*2;
        if(this.rushFlash>0) this.rushFlash-=dt*3;
    }

    renderMainMenu(ctx, w, h) {
        ctx.fillStyle='rgba(10,10,26,0.72)';
        ctx.fillRect(0,0,w,h);

        // Title
        const ty=h*0.18;
        ctx.save();
        ctx.font='bold 18px "Rajdhani", sans-serif';
        ctx.textAlign='center';
        ctx.fillStyle='#667788';
        ctx.fillText('🐼 DRONES', w/2, ty-10);

        ctx.shadowColor='#FFB800';
        ctx.shadowBlur=30;
        ctx.font='bold 64px "Orbitron", monospace';
        ctx.fillStyle='#FFB800';
        ctx.fillText('PANDAVEN', w/2, ty+45);
        ctx.shadowBlur=0;
        ctx.restore();

        ctx.font='600 16px "Rajdhani", sans-serif';
        ctx.fillStyle='#889';
        ctx.textAlign='center';
        ctx.fillText('EL JUEGO DE ENTREGAS RÁPIDAS', w/2, ty+72);

        this.menuItems=['JUGAR','MEJORAS','CÓMO JUGAR'];
        const startY=h*0.5;
        this.menuItems.forEach((item,i)=>{
            const y=startY+i*55;
            const sel=i===this.selectedMenuItem;
            const bounce=sel?Math.sin(this.menuAnimTimer*4)*3:0;
            if(sel){
                ctx.fillStyle=rgbaString(COLORS.DRONE_YELLOW,0.1);
                ctx.fillRect(w/2-140,y-18,280,36);
            }
            ctx.font=`${sel?'bold':'600'} ${sel?22:18}px "Rajdhani", sans-serif`;
            ctx.fillStyle=sel?COLORS.DRONE_YELLOW:COLORS.UI_DIM;
            ctx.textAlign='center';
            ctx.fillText(item, w/2, y+6+bounce);
            if(sel){
                ctx.font='16px "Rajdhani"';
                ctx.fillText('▸', w/2-120, y+6);
                ctx.fillText('◂', w/2+115, y+6);
            }
        });

        const hs=loadData('highscore',0);
        if(hs>0){
            ctx.font='bold 14px "Rajdhani", sans-serif';
            ctx.fillStyle=COLORS.GOLD;
            ctx.fillText(`RÉCORD: ${hs.toLocaleString()}`, w/2, h*0.84);
        }
        ctx.font='12px "Rajdhani", sans-serif';
        ctx.fillStyle='#445';
        ctx.fillText('WASD: Mover  •  ESPACIO: Boost  •  ESC: Pausa', w/2, h-30);
        ctx.font='10px "Rajdhani", sans-serif';
        ctx.fillStyle=rgbaString('#667788',0.4);
        ctx.fillText('DRONES PANDAVEN 3D — Entregas Rápidas', w/2, h-12);
        this._scanlines(ctx,w,h,0.03);
    }

    renderHUD(ctx, w, h, gs) {
        const {score,combo,comboTimer,lives,maxLives,rushMeter,rushMax,rushActive,coins,timeAlive,boostCooldown,boostCooldownMax,deliveries,carryingPackage}=gs;
        // Top bar
        const barG=ctx.createLinearGradient(0,0,0,44);
        barG.addColorStop(0,'rgba(10,10,26,0.9)'); barG.addColorStop(1,'rgba(10,10,26,0)');
        ctx.fillStyle=barG; ctx.fillRect(0,0,w,44);

        // Score
        ctx.font='bold 22px "Rajdhani", sans-serif';
        ctx.fillStyle=COLORS.UI_TEXT;
        ctx.textAlign='left';
        ctx.fillText(score.toLocaleString(), 15, 28);

        // Deliveries counter
        ctx.font='bold 14px "Rajdhani", sans-serif';
        ctx.fillStyle=COLORS.DELIVERY_GREEN;
        ctx.fillText(`📦 ${deliveries}`, 15, 12);

        // Combo
        if(combo>1){
            const ca=comboTimer>0.5?1:comboTimer*2;
            ctx.save(); ctx.globalAlpha=ca;
            ctx.font='bold 14px "Rajdhani", sans-serif';
            ctx.fillStyle=combo>=5?COLORS.RUSH_YELLOW:COLORS.NEON_CYAN;
            ctx.textAlign='left';
            ctx.fillText(`x${Math.min(combo,CONFIG.MAX_COMBO_MULT)} COMBO`, 180, 28);
            ctx.restore();
        }

        // Lives (battery icons)
        const lifeX=w/2-(maxLives*20)/2;
        for(let i=0;i<maxLives;i++){
            const lx=lifeX+i*22;
            ctx.fillStyle=i<lives?COLORS.DRONE_YELLOW:COLORS.UI_DIM;
            ctx.font='16px sans-serif';
            ctx.textAlign='center';
            ctx.fillText(i<lives?'🔋':'💀', lx+8, 22);
        }

        // Coins (top right)
        ctx.font='bold 14px "Rajdhani", sans-serif';
        ctx.fillStyle=COLORS.COIN_GOLD;
        ctx.textAlign='right';
        ctx.fillText(`🪙 ${coins}`, w-15, 18);
        // Time
        ctx.font='12px "Rajdhani", sans-serif';
        ctx.fillStyle=COLORS.UI_DIM;
        const mins=Math.floor(timeAlive/60), secs=Math.floor(timeAlive%60);
        ctx.fillText(`${mins}:${secs.toString().padStart(2,'0')}`, w-15, 34);

        // Carrying package indicator
        if(carryingPackage){
            ctx.save();
            const pulseA=Math.sin(this.menuAnimTimer*4)*0.15+0.85;
            ctx.globalAlpha=pulseA;
            ctx.fillStyle=COLORS.DELIVERY_GREEN;
            ctx.font='bold 16px "Rajdhani", sans-serif';
            ctx.textAlign='center';
            ctx.fillText('📦 PAQUETE RECOGIDO — BUSCA EL PAD ⬇', w/2, 60);
            ctx.restore();
        }

        // Rush meter (bottom center)
        const mW=280, mH=10, mX=(w-mW)/2, mY=h-28;
        ctx.fillStyle='rgba(10,10,26,0.8)';
        ctx.fillRect(mX-2,mY-2,mW+4,mH+4);
        ctx.strokeStyle=rushActive?COLORS.RUSH_ORANGE:'rgba(255,184,0,0.3)';
        ctx.lineWidth=1;
        ctx.strokeRect(mX-2,mY-2,mW+4,mH+4);
        const fillW=(rushMeter/rushMax)*mW;
        if(rushActive){
            const fa=Math.sin(this.menuAnimTimer*8)*0.3+0.7;
            ctx.fillStyle=rgbaString(COLORS.RUSH_ORANGE,fa);
        } else {
            const g=ctx.createLinearGradient(mX,0,mX+fillW,0);
            g.addColorStop(0,COLORS.DRONE_ACCENT); g.addColorStop(1,COLORS.DRONE_YELLOW);
            ctx.fillStyle=g;
        }
        ctx.fillRect(mX,mY,fillW,mH);
        ctx.font='10px "Rajdhani", sans-serif';
        ctx.fillStyle=rushActive?COLORS.RUSH_YELLOW:COLORS.UI_DIM;
        ctx.textAlign='center';
        ctx.fillText(rushActive?'⚡ RUSH MODE ⚡':'RUSH', w/2, mY-5);

        // Boost CD (bottom left)
        if(boostCooldown>0){
            const bp=1-(boostCooldown/boostCooldownMax);
            ctx.fillStyle=COLORS.UI_DIM; ctx.font='10px "Rajdhani"'; ctx.textAlign='left';
            ctx.fillText('BOOST', 15, h-22);
            ctx.fillStyle='#222'; ctx.fillRect(15,h-16,60,5);
            ctx.fillStyle=COLORS.NEON_CYAN; ctx.fillRect(15,h-16,60*bp,5);
        } else {
            ctx.fillStyle=COLORS.NEON_CYAN; ctx.font='10px "Rajdhani"'; ctx.textAlign='left';
            ctx.fillText('BOOST OK', 15, h-16);
        }

        // Damage vignette
        if(this.damageVignette>0){
            const vg=ctx.createRadialGradient(w/2,h/2,h*0.3,w/2,h/2,h*0.8);
            vg.addColorStop(0,'transparent');
            vg.addColorStop(1,rgbaString(COLORS.DANGER_RED,this.damageVignette*0.5));
            ctx.fillStyle=vg; ctx.fillRect(0,0,w,h);
        }

        // Rush border
        if(rushActive){
            const ba=Math.sin(this.menuAnimTimer*6)*0.15+0.2;
            ctx.save(); ctx.globalAlpha=ba;
            ctx.strokeStyle=COLORS.RUSH_ORANGE; ctx.lineWidth=4; ctx.strokeRect(0,0,w,h);
            ctx.restore();
        }

        // Popups
        this.comboPopups.forEach(p=>{
            const a=1-(p.timer/p.duration);
            ctx.save(); ctx.globalAlpha=a;
            ctx.font=`bold ${p.size}px "Rajdhani", sans-serif`;
            ctx.fillStyle=p.color; ctx.textAlign='center';
            ctx.fillText(p.text, p.screenX||w/2, p.screenY||p.y);
            ctx.restore();
        });
        this.notifications.forEach((n,i)=>{
            const a=n.timer<0.3?n.timer/0.3:n.timer>n.duration-0.5?(n.duration-n.timer)/0.5:1;
            ctx.save(); ctx.globalAlpha=a;
            ctx.font='bold 14px "Rajdhani", sans-serif';
            ctx.fillStyle=n.color||COLORS.UI_TEXT; ctx.textAlign='center';
            ctx.fillText(n.text, w/2, 80+i*28);
            ctx.restore();
        });
    }

    renderPauseMenu(ctx,w,h){
        ctx.fillStyle='rgba(10,10,26,0.85)'; ctx.fillRect(0,0,w,h);
        ctx.font='bold 36px "Orbitron", monospace'; ctx.fillStyle=COLORS.DRONE_YELLOW;
        ctx.textAlign='center'; ctx.fillText('PAUSA', w/2, h*0.35);
        const items=['CONTINUAR','REINICIAR','MENÚ PRINCIPAL'];
        items.forEach((item,i)=>{
            const y=h*0.5+i*50; const sel=i===this.selectedMenuItem;
            if(sel){ ctx.fillStyle=rgbaString(COLORS.DRONE_YELLOW,0.08); ctx.fillRect(w/2-120,y-16,240,32); }
            ctx.font=`${sel?'bold':'600'} 18px "Rajdhani", sans-serif`;
            ctx.fillStyle=sel?COLORS.DRONE_YELLOW:COLORS.UI_DIM;
            ctx.fillText(item, w/2, y+6);
        });
        this._scanlines(ctx,w,h,0.02);
    }

    renderGameOver(ctx,w,h,stats){
        ctx.fillStyle='rgba(10,10,26,0.9)'; ctx.fillRect(0,0,w,h);
        ctx.save(); ctx.shadowColor=COLORS.DANGER_RED; ctx.shadowBlur=20;
        ctx.font='bold 38px "Orbitron", monospace'; ctx.fillStyle=COLORS.DANGER_RED;
        ctx.textAlign='center'; ctx.fillText('DRONE PERDIDO', w/2, h*0.18);
        ctx.restore();

        const pW=360, pH=260, pX=(w-pW)/2, pY=h*0.24;
        ctx.fillStyle=COLORS.UI_PANEL; ctx.fillRect(pX,pY,pW,pH);
        ctx.strokeStyle=COLORS.UI_PANEL_BORDER; ctx.lineWidth=1; ctx.strokeRect(pX,pY,pW,pH);
        const lines=[
            {l:'PUNTUACIÓN',v:stats.score.toLocaleString(),c:COLORS.UI_TEXT},
            {l:'RÉCORD',v:stats.highScore.toLocaleString(),c:stats.isNewHigh?COLORS.GOLD:COLORS.UI_DIM},
            {l:'TIEMPO',v:`${Math.floor(stats.timeAlive/60)}:${Math.floor(stats.timeAlive%60).toString().padStart(2,'0')}`,c:COLORS.UI_TEXT},
            {l:'ENTREGAS',v:stats.deliveries.toString(),c:COLORS.DELIVERY_GREEN},
            {l:'COMBO MÁX',v:`x${stats.maxCombo}`,c:COLORS.RUSH_YELLOW},
            {l:'MONEDAS',v:stats.coinsEarned.toString(),c:COLORS.COIN_GOLD},
            {l:'RUSH ACTIVACIONES',v:stats.rushCount.toString(),c:COLORS.RUSH_ORANGE},
        ];
        lines.forEach((s,i)=>{
            const sy=pY+28+i*33;
            ctx.font='12px "Rajdhani", sans-serif'; ctx.fillStyle=COLORS.UI_DIM; ctx.textAlign='left';
            ctx.fillText(s.l, pX+18, sy);
            ctx.font='bold 15px "Rajdhani", sans-serif'; ctx.fillStyle=s.c; ctx.textAlign='right';
            ctx.fillText(s.v, pX+pW-18, sy);
        });
        if(stats.isNewHigh){
            ctx.font='bold 14px "Rajdhani"'; ctx.fillStyle=COLORS.GOLD; ctx.textAlign='center';
            ctx.globalAlpha=Math.sin(this.menuAnimTimer*4)*0.3+0.7;
            ctx.fillText('★ NUEVO RÉCORD ★', w/2, pY-10);
            ctx.globalAlpha=1;
        }
        const btns=['JUGAR DE NUEVO','MEJORAS','MENÚ PRINCIPAL'];
        btns.forEach((item,i)=>{
            const y=pY+pH+35+i*45; const sel=i===this.selectedMenuItem;
            if(sel){ ctx.fillStyle=rgbaString(COLORS.DRONE_YELLOW,0.08); ctx.fillRect(w/2-120,y-16,240,32); }
            ctx.font=`${sel?'bold':'600'} 18px "Rajdhani", sans-serif`;
            ctx.fillStyle=sel?COLORS.DRONE_YELLOW:COLORS.UI_DIM;
            ctx.textAlign='center'; ctx.fillText(item, w/2, y+6);
        });
        this._scanlines(ctx,w,h,0.02);
    }

    renderShop(ctx,w,h,upg,coins){
        ctx.fillStyle='rgba(10,10,26,0.88)'; ctx.fillRect(0,0,w,h);
        ctx.font='bold 28px "Orbitron", monospace'; ctx.fillStyle=COLORS.DRONE_YELLOW;
        ctx.textAlign='center'; ctx.fillText('MEJORAS', w/2, 48);
        ctx.font='bold 16px "Rajdhani"'; ctx.fillStyle=COLORS.COIN_GOLD;
        ctx.fillText(`🪙 MONEDAS: ${coins}`, w/2, 76);
        const iH=68, sY=100, iW=460, iX=(w-iW)/2;
        this.shopItems.forEach((key,i)=>{
            const u=CONFIG.UPGRADES[key], lv=upg[key]||0;
            const cost=u.baseCost*(lv+1), maxed=lv>=u.maxLevel, afford=coins>=cost&&!maxed;
            const sel=i===this.selectedShopItem, y=sY+i*(iH+6);
            ctx.fillStyle=sel?rgbaString(COLORS.DRONE_YELLOW,0.06):COLORS.UI_PANEL;
            ctx.fillRect(iX,y,iW,iH);
            ctx.strokeStyle=sel?COLORS.DRONE_YELLOW:COLORS.UI_PANEL_BORDER;
            ctx.lineWidth=1; ctx.strokeRect(iX,y,iW,iH);
            ctx.font='bold 16px "Rajdhani"'; ctx.fillStyle=sel?COLORS.DRONE_YELLOW:COLORS.UI_TEXT;
            ctx.textAlign='left'; ctx.fillText(u.name, iX+15, y+24);
            ctx.font='12px "Rajdhani"'; ctx.fillStyle=COLORS.UI_DIM;
            ctx.fillText(u.description, iX+15, y+44);
            for(let l=0;l<u.maxLevel;l++){
                ctx.fillStyle=l<lv?COLORS.DRONE_YELLOW:'#222';
                ctx.fillRect(iX+15+l*18, y+52, 12, 4);
            }
            ctx.textAlign='right';
            if(maxed){ ctx.font='bold 14px "Rajdhani"'; ctx.fillStyle=COLORS.GOLD; ctx.fillText('MÁXIMO',iX+iW-15,y+35); }
            else{ ctx.font='14px "Rajdhani"'; ctx.fillStyle=afford?COLORS.COIN_GOLD:COLORS.DANGER_RED; ctx.fillText(`🪙 ${cost}`,iX+iW-15,y+35); }
        });
        ctx.font='12px "Rajdhani"'; ctx.fillStyle=COLORS.UI_DIM; ctx.textAlign='center';
        ctx.fillText('ESC: Volver  •  ENTER: Comprar', w/2, h-22);
        this._scanlines(ctx,w,h,0.02);
    }

    renderTutorial(ctx,w,h){
        ctx.fillStyle='rgba(10,10,26,0.92)'; ctx.fillRect(0,0,w,h);
        ctx.font='bold 28px "Orbitron", monospace'; ctx.fillStyle=COLORS.DRONE_YELLOW;
        ctx.textAlign='center'; ctx.fillText('CÓMO JUGAR', w/2, 55);
        const instr=[
            {icon:'🎮', text:'WASD o Flechas para mover el drone'},
            {icon:'💨', text:'ESPACIO para boost rápido (tiene cooldown)'},
            {icon:'📦', text:'Vuela sobre los paquetes para recogerlos'},
            {icon:'🏁', text:'Lleva el paquete al pad de entrega (H verde)'},
            {icon:'⚡', text:'Las entregas llenan el medidor de Rush Mode'},
            {icon:'🔥', text:'Rush Mode: 3x puntos pero todo más rápido'},
            {icon:'🪙', text:'Recoge monedas para comprar mejoras'},
            {icon:'⚠', text:'Esquiva edificios, drones enemigos y láseres'},
        ];
        instr.forEach((inst,i)=>{
            const y=110+i*46;
            ctx.font='20px sans-serif'; ctx.textAlign='center'; ctx.fillText(inst.icon, w/2-230, y+5);
            ctx.font='14px "Rajdhani", sans-serif'; ctx.fillStyle=COLORS.UI_TEXT;
            ctx.textAlign='left'; ctx.fillText(inst.text, w/2-200, y+5);
            ctx.textAlign='center';
        });
        ctx.font='bold 14px "Rajdhani"'; ctx.fillStyle=COLORS.DRONE_YELLOW;
        ctx.fillText('Presiona cualquier tecla para volver', w/2, h-36);
        this._scanlines(ctx,w,h,0.02);
    }

    addNotification(text, color=COLORS.UI_TEXT, duration=2) {
        this.notifications.push({text,color,duration,timer:0});
    }
    addComboPopup(x,y,text,color=COLORS.DRONE_YELLOW,size=18) {
        this.comboPopups.push({x,y,text,color,size,duration:0.8,timer:0,screenX:null,screenY:null});
    }
    triggerDamageVignette() { this.damageVignette=1; }
    triggerRushFlash() { this.rushFlash=1; }
    _scanlines(ctx,w,h,a) {
        ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='#000';
        for(let y=this.scanlineOffset;y<h;y+=4) ctx.fillRect(0,y,w,1);
        ctx.restore();
    }
}
