// ============================================
// DRONES PANDAVEN 3D — UI System (FPS Cockpit HUD)
// ============================================

// Track World Definitions
const RACE_WORLDS = [
    {
        id: 'campo', name: '🌿 CAMPO VERDE',
        desc: 'Pradera abierta con árboles y rocas',
        groundColor: 0x3a7a2a, patchColors: [0x2d6b1f, 0x458a33, 0x357a28, 0x4a9538],
        gateColor: 0x00ffaa, skyColor: 0x88ccff,
        treeColors: [0x2d6b1f, 0x3d8c2e, 0x4ea83a],
        rockColors: [0x888888, 0x777766, 0x999988],
        fogColor: 0x88ccff, fogDensity: 0.0008,
        ambientColor: 0x445566, sunColor: 0xffffff
    },
    {
        id: 'desierto', name: '🏜️ DESIERTO ROJO',
        desc: 'Arena ardiente con cactus y cañones',
        groundColor: 0xc4923a, patchColors: [0xb5842f, 0xd4a24a, 0xaa7525, 0xc89838],
        gateColor: 0xff6600, skyColor: 0xffaa55,
        treeColors: [0x4a7a2a, 0x5a8a3a], // cacti
        rockColors: [0xaa5533, 0xcc6644, 0x884422],
        fogColor: 0xffcc88, fogDensity: 0.0005,
        ambientColor: 0x664433, sunColor: 0xffddaa
    },
    {
        id: 'neon', name: '🌃 NOCHE NEON',
        desc: 'Ciudad cyberpunk iluminada con neón',
        groundColor: 0x111122, patchColors: [0x0a0a1a, 0x151530, 0x0d0d25, 0x1a1a35],
        gateColor: 0xff00ff, skyColor: 0x050510,
        treeColors: [0x333355, 0x444466],
        rockColors: [0x333344, 0x444455, 0x222233],
        fogColor: 0x0a0a20, fogDensity: 0.001,
        ambientColor: 0x221133, sunColor: 0x6644aa
    },
    {
        id: 'nevado', name: '❄️ MONTAÑA NEVADA',
        desc: 'Cumbres heladas con pinos y nieve',
        groundColor: 0xddddee, patchColors: [0xccccdd, 0xeeeeff, 0xbbbbcc, 0xd5d5e5],
        gateColor: 0x00ccff, skyColor: 0xaabbcc,
        treeColors: [0x1a4a2a, 0x2a5a3a, 0x0d3d1d],
        rockColors: [0x999999, 0xaaaaaa, 0x888899],
        fogColor: 0xccccdd, fogDensity: 0.001,
        ambientColor: 0x556677, sunColor: 0xddeeff
    },
    {
        id: 'volcanico', name: '🌋 VOLCÁNICO',
        desc: 'Tierra de lava con rocas de obsidiana',
        groundColor: 0x1a1010, patchColors: [0x221515, 0x331818, 0x0f0808, 0x2a1212],
        gateColor: 0xff3300, skyColor: 0x220808,
        treeColors: [0x222222, 0x333333],
        rockColors: [0x111111, 0x1a1a1a, 0x0a0a0a],
        fogColor: 0x331100, fogDensity: 0.0012,
        ambientColor: 0x441100, sunColor: 0xff4400
    }
];

class UI {
    constructor() {
        this.notifications=[];
        this.comboPopups=[];
        this.damageVignette=0;
        this.rushFlash=0;
        this.scanlineOffset=0;
        this.selectedMenuItem=0;
        this.menuItems=[t('menu_survival'),t('menu_racing'),t('menu_upgrades'),t('menu_tutorial'),t('menu_settings')];
        this.menuAnimTimer=0;
        this.selectedShopItem=0;
        this.shopItems=Object.keys(CONFIG.UPGRADES);
        // FPS HUD
        this.threats=[];
        this.hudGlitch=0;
        this.hudGlitchIntensity=0;
        this.compassYaw=0;
        // Minimap entities
        this.minimapEntities=[];
        // Waypoint
        this.waypoint=null;
        // Track select
        this.selectedTrack=0;
        // Settings
        this.selectedSettingsItem=0;
        this.settingsWaitingKey=false;
        this.settingsItems=this._buildSettingsItems();
    }

    getTrackWorlds() { return RACE_WORLDS; }

    update(dt) {
        this.menuAnimTimer+=dt;
        this.scanlineOffset=(this.scanlineOffset+dt*50)%4;
        this.notifications=this.notifications.filter(n=>{n.timer+=dt;return n.timer<n.duration;});
        this.comboPopups=this.comboPopups.filter(p=>{p.timer+=dt;p.y-=dt*40;return p.timer<p.duration;});
        if(this.damageVignette>0) this.damageVignette-=dt*2;
        if(this.rushFlash>0) this.rushFlash-=dt*3;
        if(this.hudGlitch>0) this.hudGlitch-=dt*3;
    }

    setThreats(threats) { this.threats=threats; }
    setMinimapEntities(entities) { this.minimapEntities=entities; }
    setCompassYaw(yaw) { this.compassYaw=yaw; }
    triggerHUDGlitch(intensity) { this.hudGlitch=1; this.hudGlitchIntensity=intensity||0.5; }

    // =========================================
    // COCKPIT HUD (First Person Playing)
    // =========================================
    renderCockpitHUD(ctx, w, h, gs) {
        const {score,combo,comboTimer,lives,maxLives,rushMeter,rushMax,rushActive,
               coins,timeAlive,deliveries,carryingPackage,speed,altitude,
               barrelRollCD,empShieldActive,empAvailable,jammed,jamIntensity,
               gameMode,preRaceTimer,racePosition,raceFinished,
               playerGatesPassed,totalGates} = gs;

        // Jammer distortion
        if(jammed && jamIntensity > 0) {
            ctx.save();
            const jitter = jamIntensity * 8;
            ctx.translate(randomRange(-jitter,jitter), randomRange(-jitter,jitter));
        }

        // HUD Glitch effect
        if(this.hudGlitch > 0) {
            ctx.save();
            ctx.translate(randomRange(-3,3)*this.hudGlitchIntensity, randomRange(-3,3)*this.hudGlitchIntensity);
        }

        // --- CROSSHAIR ---
        this._renderCrosshair(ctx, w, h, rushActive);

        // --- COMPASS (top) ---
        this._renderCompass(ctx, w, h);

        // --- TOP BAR ---
        const barG=ctx.createLinearGradient(0,0,0,50);
        barG.addColorStop(0,'rgba(5,8,16,0.7)');
        barG.addColorStop(1,'rgba(5,8,16,0)');
        ctx.fillStyle=barG; ctx.fillRect(0,0,w,50);

        // Score (top left)
        ctx.font='bold 24px "Rajdhani", sans-serif';
        ctx.fillStyle=COLORS.UI_TEXT;
        ctx.textAlign='left';
        ctx.fillText(Math.floor(score).toLocaleString(), 20, 32);

        // Deliveries
        ctx.font='bold 13px "Rajdhani", sans-serif';
        ctx.fillStyle=COLORS.DELIVERY_GREEN;
        ctx.fillText(`📦 ${deliveries} ${t('hud_deliveries')}`, 20, 14);

        // Combo
        if(combo>1) {
            const ca=comboTimer>0.5?1:comboTimer*2;
            ctx.save(); ctx.globalAlpha=ca;
            ctx.font='bold 16px "Rajdhani", sans-serif';
            ctx.fillStyle=combo>=5?COLORS.RUSH_YELLOW:COLORS.NEON_CYAN;
            ctx.textAlign='left';
            ctx.fillText(`x${Math.min(combo,CONFIG.MAX_COMBO_MULT)} COMBO`, 200, 32);
            ctx.restore();
        }

        // Coins + Time (top right)
        ctx.font='bold 14px "Rajdhani", sans-serif';
        ctx.fillStyle=COLORS.COIN_GOLD;
        ctx.textAlign='right';
        ctx.fillText(`🪙 ${coins}`, w-20, 18);
        ctx.font='12px "Rajdhani", sans-serif';
        ctx.fillStyle=COLORS.UI_DIM;
        const mins=Math.floor(timeAlive/60), secs=Math.floor(timeAlive%60);
        ctx.fillText(`${mins}:${secs.toString().padStart(2,'0')}`, w-20, 36);

        // --- LEFT PANEL (Speed, Altitude, Battery) ---
        this._renderLeftPanel(ctx, w, h, speed, altitude, lives, maxLives);

        // --- PACKAGE STATUS ---
        if(carryingPackage) {
            ctx.save();
            const pulseA=Math.sin(this.menuAnimTimer*4)*0.15+0.85;
            ctx.globalAlpha=pulseA;
            ctx.fillStyle='rgba(0,255,136,0.1)';
            ctx.fillRect(w/2-180,54,360,28);
            ctx.strokeStyle=COLORS.DELIVERY_GREEN;
            ctx.lineWidth=1;
            ctx.strokeRect(w/2-180,54,360,28);
            ctx.fillStyle=COLORS.DELIVERY_GREEN;
            ctx.font='bold 14px "Rajdhani", sans-serif';
            ctx.textAlign='center';
            ctx.fillText(t('hud_package_hint'), w/2, 73);
            ctx.restore();
        }

        // --- RUSH METER (bottom arc) ---
        this._renderRushMeter(ctx, w, h, rushMeter, rushMax, rushActive);

        // --- EMP SHIELD INDICATOR ---
        this._renderEMPIndicator(ctx, w, h, empShieldActive, empAvailable);

        // --- BARREL ROLL CD ---
        if(barrelRollCD > 0) {
            const bp=1-(barrelRollCD/CONFIG.BARREL_ROLL_COOLDOWN);
            ctx.fillStyle=COLORS.UI_DIM; ctx.font='10px "Rajdhani"'; ctx.textAlign='left';
            ctx.fillText(t('hud_barrel_roll'), 20, h-55);
            ctx.fillStyle='#222'; ctx.fillRect(20,h-48,60,4);
            ctx.fillStyle=COLORS.NEON_CYAN; ctx.fillRect(20,h-48,60*bp,4);
        } else {
            ctx.fillStyle=COLORS.NEON_CYAN; ctx.font='10px "Rajdhani"'; ctx.textAlign='left';
            ctx.fillText(t('hud_barrel_roll_hint'), 20, h-48);
        }

        // --- RACING HUD (FPV Style) ---
        if(gameMode === 'racing') {

            // === SPEED LINES EFFECT ===
            if(speed > 100 && preRaceTimer <= 0) {
                ctx.save();
                const intensity = clamp((speed - 100) / 200, 0, 1);
                ctx.globalAlpha = intensity * 0.3;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                const numLines = Math.floor(intensity * 16);
                for(let i=0; i<numLines; i++) {
                    const angle = randomRange(0, Math.PI*2);
                    const dist = randomRange(h*0.15, h*0.45);
                    const len = randomRange(20, 60) * intensity;
                    const sx = w/2 + Math.cos(angle) * dist;
                    const sy = h/2 + Math.sin(angle) * dist * 0.6;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len * 0.6);
                    ctx.stroke();
                }
                ctx.restore();
            }

            // === FPV VIGNETTE (circular darkness at edges) ===
            ctx.save();
            const vig = ctx.createRadialGradient(w/2, h/2, h*0.28, w/2, h/2, h*0.65);
            vig.addColorStop(0, 'transparent');
            vig.addColorStop(1, 'rgba(0,0,0,0.45)');
            ctx.fillStyle = vig;
            ctx.fillRect(0,0,w,h);
            ctx.restore();

            // === POSITION (top right, large) ===
            ctx.save();
            const posColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#aaaaaa', '#888888'];
            ctx.font='italic bold 52px "Rajdhani", sans-serif';
            ctx.fillStyle = posColors[Math.min(racePosition-1, 4)];
            ctx.textAlign='right';
            const suffix = racePosition===1?t('race_suffix_1'):racePosition===2?t('race_suffix_2'):racePosition===3?t('race_suffix_3'):t('race_suffix_other');
            ctx.fillText(`${racePosition}${suffix}`, w-25, 85);
            ctx.font='18px "Rajdhani", sans-serif';
            ctx.fillStyle='#aaaaaa';
            ctx.fillText(`/ 5 ${t('race_pilots')}`, w-25, 108);
            ctx.restore();

            // === GATE COUNTER (top center) ===
            ctx.save();
            ctx.font='bold 16px "Rajdhani", sans-serif';
            ctx.fillStyle='#00ffaa';
            ctx.textAlign='center';
            ctx.fillText(`⬡ ${t('race_gates')}: ${playerGatesPassed}`, w/2, 85);
            // Gate progress bar
            const barW = 200, barH = 6;
            const barX = w/2 - barW/2, barY = 92;
            ctx.fillStyle='rgba(0,255,170,0.15)';
            ctx.fillRect(barX, barY, barW, barH);
            const progress = totalGates > 0 ? playerGatesPassed / totalGates : 0;
            const grd = ctx.createLinearGradient(barX, 0, barX + barW, 0);
            grd.addColorStop(0, '#00ffaa');
            grd.addColorStop(1, '#00ff55');
            ctx.fillStyle = grd;
            ctx.fillRect(barX, barY, barW * progress, barH);
            ctx.restore();

            // === RACE TIMER (below gate counter) ===
            ctx.save();
            ctx.font='bold 22px "Rajdhani", sans-serif';
            ctx.fillStyle='#ffffff';
            ctx.textAlign='center';
            const rMins = Math.floor(timeAlive/60);
            const rSecs = Math.floor(timeAlive%60);
            const rMs = Math.floor((timeAlive%1)*100);
            ctx.fillText(`${rMins}:${rSecs.toString().padStart(2,'0')}.${rMs.toString().padStart(2,'0')}`, w/2, 118);
            ctx.restore();

            // === COUNTDOWN OVERLAY ===
            if(preRaceTimer > 0) {
                ctx.save();
                ctx.fillStyle='rgba(0,0,0,0.6)';
                ctx.fillRect(0,0,w,h);
                const tick = Math.ceil(preRaceTimer);
                const scale = 1 + (preRaceTimer % 1) * 0.3;
                ctx.font=`bold ${Math.floor(140*scale)}px "Orbitron", monospace`;
                ctx.textAlign='center';
                ctx.textBaseline='middle';
                // Glow
                ctx.shadowColor = tick <= 1 ? '#00ff00' : '#FFB800';
                ctx.shadowBlur = 40;
                ctx.fillStyle = tick <= 1 ? '#00ff00' : '#FFB800';
                ctx.fillText(tick <= 0 ? 'GO!' : tick, w/2, h/2);
                ctx.shadowBlur = 0;
                ctx.restore();
            }

            // === FINISH OVERLAY ===
            if(raceFinished) {
                ctx.save();
                ctx.fillStyle='rgba(0,0,0,0.55)';
                ctx.fillRect(0,0,w,h);

                // Trophy / position
                ctx.font='bold 70px "Rajdhani", sans-serif';
                ctx.textAlign='center';
                ctx.textBaseline='middle';
                ctx.shadowColor = racePosition === 1 ? '#FFD700' : '#00ffaa';
                ctx.shadowBlur = 30;
                ctx.fillStyle = racePosition === 1 ? '#FFD700' : '#ffffff';
                ctx.fillText(racePosition === 1 ? t('race_victory') : t('race_finish'), w/2, h/2 - 40);
                ctx.shadowBlur = 0;

                ctx.font='bold 32px "Rajdhani", sans-serif';
                ctx.fillStyle = posColors[Math.min(racePosition-1, 4)];
                ctx.fillText(`${t('race_final_pos')}: ${racePosition}° ${t('race_of')} 5`, w/2, h/2 + 30);

                ctx.font='18px "Rajdhani", sans-serif';
                ctx.fillStyle='#aaaaaa';
                ctx.fillText(`${t('race_gates')}: ${playerGatesPassed} | ${t('go_time')}: ${rMins||0}:${(rSecs||0).toString().padStart(2,'0')}`, w/2, h/2 + 70);
                ctx.restore();
            }
        }

        // --- MINIMAP ---
        this._renderMinimap(ctx, w, h);

        // --- THREAT INDICATORS ---
        this._renderThreats(ctx, w, h);

        // --- DAMAGE VIGNETTE ---
        if(this.damageVignette>0) {
            const vg=ctx.createRadialGradient(w/2,h/2,h*0.2,w/2,h/2,h*0.7);
            vg.addColorStop(0,'transparent');
            vg.addColorStop(1,rgbaString(COLORS.DANGER_RED,this.damageVignette*0.6));
            ctx.fillStyle=vg; ctx.fillRect(0,0,w,h);
        }

        // --- RUSH BORDER ---
        if(rushActive) {
            const ba=Math.sin(this.menuAnimTimer*6)*0.15+0.2;
            ctx.save(); ctx.globalAlpha=ba;
            ctx.strokeStyle=COLORS.RUSH_ORANGE; ctx.lineWidth=3;
            ctx.strokeRect(0,0,w,h);
            ctx.restore();
        }

        // --- EMP SHIELD SCREEN EFFECT ---
        if(empShieldActive) {
            const sa=Math.sin(this.menuAnimTimer*8)*0.03+0.05;
            ctx.fillStyle=rgbaString(COLORS.EMP_CYAN,sa);
            ctx.fillRect(0,0,w,h);
        }

        // --- Popups & Notifications ---
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
            ctx.fillText(n.text, w/2, 100+i*28);
            ctx.restore();
        });

        // --- WAYPOINT ARROW ---
        this._renderWaypoint(ctx, w, h);

        // --- THREAT INDICATORS ---
        if(this.threats && this.threats.length > 0) {
            for(const t of this.threats) {
                const edgeR = Math.min(w,h)*0.42;
                const tx = w/2 + Math.sin(t.angle)*edgeR;
                const ty = h/2 - Math.cos(t.angle)*edgeR*0.5;
                const alpha = clamp(1 - t.distance/300, 0.2, 0.9);
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = t.type==='projectile' ? COLORS.RUSH_ORANGE : COLORS.DANGER_RED;
                ctx.translate(tx, ty);
                ctx.rotate(-t.angle + Math.PI);
                ctx.beginPath();
                ctx.moveTo(0, -8); ctx.lineTo(-5, 5); ctx.lineTo(5, 5);
                ctx.closePath(); ctx.fill();
                ctx.restore();
            }
        }

        // --- SCANLINES ---
        this._scanlines(ctx,w,h,0.015);

        // Restore jammer
        if(jammed && jamIntensity > 0) ctx.restore();
        if(this.hudGlitch > 0) ctx.restore();
    }

    _renderCrosshair(ctx, w, h, rushActive) {
        const cx=w/2, cy=h/2;
        const color=rushActive?COLORS.RUSH_ORANGE:COLORS.COCKPIT_HUD;
        ctx.strokeStyle=color;
        ctx.lineWidth=1.5;
        ctx.globalAlpha=0.7;
        // Center dot
        ctx.beginPath(); ctx.arc(cx,cy,2,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
        // Cross lines
        const gap=8, len=16;
        ctx.beginPath();
        ctx.moveTo(cx-gap-len,cy); ctx.lineTo(cx-gap,cy);
        ctx.moveTo(cx+gap,cy); ctx.lineTo(cx+gap+len,cy);
        ctx.moveTo(cx,cy-gap-len); ctx.lineTo(cx,cy-gap);
        ctx.moveTo(cx,cy+gap); ctx.lineTo(cx,cy+gap+len);
        ctx.stroke();
        // Corner brackets
        const bs=28;
        ctx.strokeStyle='rgba(0,180,220,0.3)';
        ctx.beginPath();
        ctx.moveTo(cx-bs,cy-bs+8); ctx.lineTo(cx-bs,cy-bs); ctx.lineTo(cx-bs+8,cy-bs);
        ctx.moveTo(cx+bs-8,cy-bs); ctx.lineTo(cx+bs,cy-bs); ctx.lineTo(cx+bs,cy-bs+8);
        ctx.moveTo(cx+bs,cy+bs-8); ctx.lineTo(cx+bs,cy+bs); ctx.lineTo(cx+bs-8,cy+bs);
        ctx.moveTo(cx-bs+8,cy+bs); ctx.lineTo(cx-bs,cy+bs); ctx.lineTo(cx-bs,cy+bs-8);
        ctx.stroke();
        ctx.globalAlpha=1;
    }

    _renderCompass(ctx, w, h) {
        const cx=w/2, cy=28, cw=300;
        ctx.save();
        ctx.fillStyle='rgba(5,8,16,0.5)';
        ctx.fillRect(cx-cw/2, 2, cw, 20);
        ctx.strokeStyle=COLORS.COCKPIT_HUD_DIM;
        ctx.lineWidth=0.5;
        ctx.strokeRect(cx-cw/2, 2, cw, 20);

        const dirs=['N','NE','E','SE','S','SW','W','NW'];
        const yawDeg = ((this.compassYaw * 180 / Math.PI) % 360 + 360) % 360;

        ctx.beginPath();
        ctx.rect(cx-cw/2+1, 3, cw-2, 18);
        ctx.clip();

        ctx.font='bold 10px "Rajdhani", sans-serif';
        ctx.textAlign='center';
        for(let d=0;d<360;d+=45) {
            const diff = ((d - yawDeg + 180 + 360) % 360) - 180;
            const px = cx + diff * (cw/180);
            if(px > cx-cw/2 && px < cx+cw/2) {
                const dirIdx=d/45;
                ctx.fillStyle=d===0?COLORS.DANGER_RED:COLORS.COCKPIT_HUD;
                ctx.fillText(dirs[dirIdx], px, 16);
            }
        }
        // Tick marks
        for(let d=0;d<360;d+=15) {
            const diff = ((d - yawDeg + 180 + 360) % 360) - 180;
            const px = cx + diff * (cw/180);
            if(px > cx-cw/2 && px < cx+cw/2) {
                ctx.fillStyle=COLORS.COCKPIT_HUD_DIM;
                ctx.fillRect(px, d%45===0?6:10, 1, d%45===0?8:4);
            }
        }
        ctx.restore();
        // Center indicator
        ctx.fillStyle=COLORS.COCKPIT_HUD;
        ctx.beginPath();
        ctx.moveTo(cx-4,2); ctx.lineTo(cx+4,2); ctx.lineTo(cx,7); ctx.closePath();
        ctx.fill();
    }

    _renderLeftPanel(ctx, w, h, speed, altitude, lives, maxLives) {
        const px=15, py=h*0.35;
        const panelW=130, panelH=130;

        // Panel background
        ctx.fillStyle='rgba(5,8,16,0.5)';
        ctx.fillRect(px, py, panelW, panelH);
        ctx.strokeStyle=COLORS.COCKPIT_HUD_DIM;
        ctx.lineWidth=0.5;
        ctx.strokeRect(px, py, panelW, panelH);

        // Speed
        ctx.font='9px "Rajdhani", sans-serif';
        ctx.fillStyle=COLORS.COCKPIT_HUD_DIM;
        ctx.textAlign='left';
        ctx.fillText(t('hud_vel'), px+8, py+16);
        ctx.font='bold 20px "Rajdhani", sans-serif';
        ctx.fillStyle=COLORS.COCKPIT_HUD;
        ctx.fillText(Math.floor(speed||0), px+8, py+38);
        ctx.font='9px "Rajdhani"';
        ctx.fillStyle=COLORS.COCKPIT_HUD_DIM;
        ctx.fillText('km/h', px+65, py+38);

        // Altitude
        ctx.font='9px "Rajdhani", sans-serif';
        ctx.fillStyle=COLORS.COCKPIT_HUD_DIM;
        ctx.fillText(t('hud_alt'), px+8, py+56);
        ctx.font='bold 16px "Rajdhani", sans-serif';
        ctx.fillStyle=COLORS.COCKPIT_HUD;
        ctx.fillText(Math.floor(altitude||0)+'m', px+8, py+74);

        // Battery (lives) — auto-fit bars to panel width
        ctx.font='9px "Rajdhani", sans-serif';
        ctx.fillStyle=COLORS.COCKPIT_HUD_DIM;
        ctx.fillText(t('hud_battery'), px+8, py+92);
        const maxBarW = panelW - 20;
        const gap = 2;
        const barW = Math.min(18, (maxBarW - gap*(maxLives-1)) / maxLives);
        const step = barW + gap;
        for(let i=0;i<maxLives;i++) {
            const bx=px+8+i*step;
            ctx.fillStyle=i<lives?COLORS.DRONE_YELLOW:'#222';
            ctx.fillRect(bx, py+98, barW, 8);
            ctx.strokeStyle=i<lives?COLORS.DRONE_ACCENT:'#333';
            ctx.lineWidth=0.5;
            ctx.strokeRect(bx, py+98, barW, 8);
        }
    }

    _renderRushMeter(ctx, w, h, rushMeter, rushMax, rushActive) {
        const cx=w/2, cy=h-35;
        const mW=250, mH=8;
        const mX=cx-mW/2, mY=cy;

        ctx.fillStyle='rgba(5,8,16,0.6)';
        ctx.fillRect(mX-2,mY-2,mW+4,mH+4);
        ctx.strokeStyle=rushActive?COLORS.RUSH_ORANGE:COLORS.COCKPIT_HUD_DIM;
        ctx.lineWidth=0.5;
        ctx.strokeRect(mX-2,mY-2,mW+4,mH+4);

        const fillW=(rushMeter/rushMax)*mW;
        if(rushActive) {
            const fa=Math.sin(this.menuAnimTimer*8)*0.3+0.7;
            ctx.fillStyle=rgbaString(COLORS.RUSH_ORANGE,fa);
        } else {
            const g=ctx.createLinearGradient(mX,0,mX+fillW,0);
            g.addColorStop(0,COLORS.DRONE_ACCENT); g.addColorStop(1,COLORS.DRONE_YELLOW);
            ctx.fillStyle=g;
        }
        ctx.fillRect(mX,mY,fillW,mH);

        ctx.font='9px "Rajdhani", sans-serif';
        ctx.fillStyle=rushActive?COLORS.RUSH_YELLOW:COLORS.COCKPIT_HUD_DIM;
        ctx.textAlign='center';
        ctx.fillText(rushActive?t('hud_rush_mode'):t('hud_rush'), cx, mY-5);
    }

    _renderEMPIndicator(ctx, w, h, active, available) {
        const px=w-130, py=h-80;
        ctx.font='10px "Rajdhani", sans-serif';
        ctx.textAlign='left';
        if(active) {
            ctx.fillStyle=COLORS.EMP_CYAN;
            ctx.fillText(t('hud_shield_active'), px, py);
            // Pulsing bar
            const ba=Math.sin(this.menuAnimTimer*6)*0.3+0.7;
            ctx.fillStyle=rgbaString(COLORS.EMP_CYAN,ba);
            ctx.fillRect(px,py+4,80,3);
        } else if(available) {
            ctx.fillStyle=COLORS.COCKPIT_HUD;
            ctx.fillText(t('hud_shield_ready'), px, py);
        } else {
            ctx.fillStyle=COLORS.UI_DIM;
            ctx.fillText(t('hud_shield_no_rush'), px, py);
        }
    }

    _renderMinimap(ctx, w, h) {
        const size=120, margin=15;
        const mx=w-size-margin, my=h-size-margin-30;

        // Background
        ctx.fillStyle=COLORS.MINIMAP_BG;
        ctx.fillRect(mx, my, size, size);
        ctx.strokeStyle=COLORS.COCKPIT_HUD_DIM;
        ctx.lineWidth=0.5;
        ctx.strokeRect(mx, my, size, size);

        // Label
        ctx.font='8px "Rajdhani"';
        ctx.fillStyle=COLORS.COCKPIT_HUD_DIM;
        ctx.textAlign='left';
        ctx.fillText(t('hud_radar'), mx+4, my+10);

        const centerX=mx+size/2, centerY=my+size/2;
        const scale=0.08;

        // Draw entities
        ctx.save();
        ctx.beginPath();
        ctx.rect(mx+1, my+1, size-2, size-2);
        ctx.clip();

        for(const e of this.minimapEntities) {
            const ex=centerX+e.rx*scale;
            const ey=centerY+e.rz*scale;
            if(ex<mx||ex>mx+size||ey<my||ey>my+size) continue;

            ctx.fillStyle=e.color;
            if(e.type==='package') {
                ctx.fillRect(ex-2,ey-2,4,4);
            } else if(e.type==='pad') {
                ctx.beginPath(); ctx.arc(ex,ey,3,0,Math.PI*2); ctx.fill();
            } else if(e.type==='enemy') {
                const pulse=Math.sin(this.menuAnimTimer*6)*0.3+0.7;
                ctx.globalAlpha=pulse;
                ctx.beginPath(); ctx.arc(ex,ey,3,0,Math.PI*2); ctx.fill();
                ctx.globalAlpha=1;
            } else if(e.type==='coin') {
                ctx.fillRect(ex-1,ey-1,2,2);
            }
        }

        // Player (center triangle)
        ctx.fillStyle=COLORS.DRONE_YELLOW;
        ctx.beginPath();
        const cs=5;
        ctx.moveTo(centerX,centerY-cs);
        ctx.lineTo(centerX-cs*0.7,centerY+cs*0.5);
        ctx.lineTo(centerX+cs*0.7,centerY+cs*0.5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    _renderThreats(ctx, w, h) {
        const cx=w/2, cy=h/2;
        for(const t of this.threats) {
            // t = {angle, distance, type}
            const a=t.angle;
            const edge=Math.min(w,h)*0.4;
            const tx=cx+Math.sin(a)*edge;
            const ty=cy-Math.cos(a)*edge;

            ctx.save();
            ctx.translate(tx,ty);
            ctx.rotate(-a+Math.PI);

            const pulse=Math.sin(this.menuAnimTimer*8)*0.3+0.7;
            ctx.globalAlpha=pulse*(t.type==='projectile'?0.9:0.6);

            ctx.fillStyle=t.type==='projectile'?COLORS.DANGER_RED:COLORS.RUSH_ORANGE;
            ctx.beginPath();
            ctx.moveTo(0,-10);
            ctx.lineTo(-5,5);
            ctx.lineTo(5,5);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }

    // =========================================
    // MENU SCREENS (same as before)
    // =========================================
    renderMainMenu(ctx, w, h) {
        ctx.fillStyle='rgba(10,10,26,0.72)';
        ctx.fillRect(0,0,w,h);
        const mobile = w < 600;
        const ty=h*0.18;
        ctx.save();
        ctx.font=`bold ${mobile?14:18}px "Rajdhani", sans-serif`;
        ctx.textAlign='center';
        ctx.fillStyle='#667788';
        ctx.fillText('🐼 DRONES', w/2, ty-10);
        ctx.shadowColor='#FFB800';
        ctx.shadowBlur=30;
        ctx.font=`bold ${mobile?36:64}px "Orbitron", monospace`;
        ctx.fillStyle='#FFB800';
        ctx.fillText('PANDAVEN', w/2, ty+45);
        ctx.shadowBlur=0;
        ctx.restore();
        ctx.font=`600 ${mobile?12:16}px "Rajdhani", sans-serif`;
        ctx.fillStyle='#889';
        ctx.textAlign='center';
        ctx.fillText(t('menu_subtitle'), w/2, ty+72);

        this.menuItems=[t('menu_survival'),t('menu_racing'),t('menu_upgrades'),t('menu_tutorial'),t('menu_settings')];
        const itemSpacing = mobile ? 40 : 55;
        const startY = mobile ? h*0.42 : h*0.5;
        this.menuItems.forEach((item,i)=>{
            const y=startY+i*itemSpacing;
            const sel=i===this.selectedMenuItem;
            const bounce=sel?Math.sin(this.menuAnimTimer*4)*3:0;
            const btnW = Math.min(280, w-40);
            if(sel){ ctx.fillStyle=rgbaString(COLORS.DRONE_YELLOW,0.1); ctx.fillRect(w/2-btnW/2,y-18,btnW,36); }
            ctx.font=`${sel?'bold':'600'} ${sel?(mobile?18:22):(mobile?15:18)}px "Rajdhani", sans-serif`;
            ctx.fillStyle=sel?COLORS.DRONE_YELLOW:COLORS.UI_DIM;
            ctx.textAlign='center';
            ctx.fillText(item, w/2, y+6+bounce);
            if(sel){ ctx.font=`${mobile?13:16}px "Rajdhani"`; ctx.fillText('▸', w/2-btnW/2+10, y+6); ctx.fillText('◂', w/2+btnW/2-10, y+6); }
        });
        const hs=loadData('highscore',0);
        if(hs>0){ 
            ctx.save();
            ctx.textAlign='right';
            ctx.font='bold 17px "Rajdhani", sans-serif'; 
            ctx.fillStyle=COLORS.GOLD; 
            ctx.fillText(`${t('menu_record')}: ${hs.toLocaleString()}`, w - 20, 30); 
            ctx.restore();
        }
        ctx.font=`${mobile?10:12}px "Rajdhani", sans-serif`; ctx.fillStyle='#445';
        ctx.fillText(t('menu_controls'), w/2, h-30);
        ctx.font=`${mobile?8:10}px "Rajdhani", sans-serif`; ctx.fillStyle=rgbaString('#667788',0.4);
        ctx.fillText(t('menu_footer'), w/2, h-12);
        this._scanlines(ctx,w,h,0.03);
    }

    renderTrackSelect(ctx, w, h) {
        ctx.fillStyle='rgba(5,5,18,0.82)';
        ctx.fillRect(0,0,w,h);

        // Title
        const mobile = w < 600;
        ctx.save();
        ctx.font=`bold ${mobile?24:36}px "Orbitron", monospace`;
        ctx.textAlign='center';
        ctx.shadowColor='#FFB800';
        ctx.shadowBlur=20;
        ctx.fillStyle='#FFB800';
        ctx.fillText(t('race_select_title'), w/2, h*0.12);
        ctx.shadowBlur=0;
        ctx.restore();

        ctx.font=`${mobile?11:14}px "Rajdhani", sans-serif`;
        ctx.fillStyle='#667788';
        ctx.textAlign='center';
        ctx.fillText(t('race_select_subtitle'), w/2, h*0.12 + 30);

        const tracks = RACE_WORLDS;
        const cardW = Math.min(340, w-40), cardH = mobile?48:56;
        const startY = h * 0.25;
        const spacing = mobile?56:68;

        tracks.forEach((track, i) => {
            const y = startY + i * spacing;
            const sel = i === this.selectedTrack;
            const cx = w/2;

            // Card background
            ctx.save();
            if(sel) {
                // Glowing selected card
                const grd = ctx.createLinearGradient(cx - cardW/2, y, cx + cardW/2, y);
                const hexColor = '#' + track.gateColor.toString(16).padStart(6, '0');
                grd.addColorStop(0, 'rgba(255,255,255,0.03)');
                grd.addColorStop(0.3, hexToRGBA(hexColor, 0.15));
                grd.addColorStop(1, 'rgba(255,255,255,0.03)');
                ctx.fillStyle = grd;
                ctx.fillRect(cx - cardW/2, y - cardH/2, cardW, cardH);

                // Border glow
                ctx.strokeStyle = hexColor;
                ctx.lineWidth = 2;
                ctx.shadowColor = hexColor;
                ctx.shadowBlur = 15;
                ctx.strokeRect(cx - cardW/2, y - cardH/2, cardW, cardH);
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = 'rgba(20,20,40,0.5)';
                ctx.fillRect(cx - cardW/2, y - cardH/2, cardW, cardH);
                ctx.strokeStyle = 'rgba(100,100,130,0.2)';
                ctx.lineWidth = 1;
                ctx.strokeRect(cx - cardW/2, y - cardH/2, cardW, cardH);
            }

            // Color bar on left
            const barColor = '#' + track.gateColor.toString(16).padStart(6, '0');
            ctx.fillStyle = barColor;
            ctx.fillRect(cx - cardW/2, y - cardH/2, 5, cardH);

            // Ground color preview square
            ctx.fillStyle = '#' + track.groundColor.toString(16).padStart(6, '0');
            ctx.fillRect(cx - cardW/2 + 14, y - 18, 36, 36);
            // Mini gate circle inside
            ctx.strokeStyle = barColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx - cardW/2 + 32, y, 10, 0, Math.PI*2);
            ctx.stroke();

            // Track name
            ctx.textAlign = 'left';
            ctx.font = `${sel ? 'bold' : '600'} ${sel ? 20 : 17}px "Rajdhani", sans-serif`;
            ctx.fillStyle = sel ? '#ffffff' : '#99aabb';
            ctx.fillText(t('world_'+track.id), cx - cardW/2 + 60, y + 2);

            // Description
            ctx.font = '12px "Rajdhani", sans-serif';
            ctx.fillStyle = sel ? '#aabbcc' : '#556677';
            ctx.fillText(t('world_'+track.id+'_desc'), cx - cardW/2 + 60, y + 18);

            // Selection arrows
            if(sel) {
                ctx.font = '18px "Rajdhani"';
                ctx.fillStyle = barColor;
                ctx.textAlign = 'right';
                ctx.fillText('▸', cx + cardW/2 - 12, y + 5);
                ctx.textAlign = 'left';
                ctx.fillText('◂', cx - cardW/2 + 7, y + 5);
            }

            ctx.restore();
        });

        // Bottom hints
        ctx.font = '13px "Rajdhani", sans-serif';
        ctx.fillStyle = '#556677';
        ctx.textAlign = 'center';
        ctx.fillText(t('race_controls_hint'), w/2, h - 30);

        this._scanlines(ctx, w, h, 0.02);
    }

    renderPauseMenu(ctx,w,h) {
        ctx.fillStyle='rgba(10,10,26,0.85)'; ctx.fillRect(0,0,w,h);
        ctx.font='bold 36px "Orbitron", monospace'; ctx.fillStyle=COLORS.DRONE_YELLOW;
        ctx.textAlign='center'; ctx.fillText(t('pause_title'), w/2, h*0.35);
        const items=[t('pause_continue'),t('pause_restart'),t('pause_menu')];
        items.forEach((item,i)=>{
            const y=h*0.5+i*50; const sel=i===this.selectedMenuItem;
            if(sel){ ctx.fillStyle=rgbaString(COLORS.DRONE_YELLOW,0.08); ctx.fillRect(w/2-120,y-16,240,32); }
            ctx.font=`${sel?'bold':'600'} 18px "Rajdhani", sans-serif`;
            ctx.fillStyle=sel?COLORS.DRONE_YELLOW:COLORS.UI_DIM;
            ctx.fillText(item, w/2, y+6);
        });
        this._scanlines(ctx,w,h,0.02);
    }

    renderGameOver(ctx,w,h,stats) {
        ctx.fillStyle='rgba(10,10,26,0.9)'; ctx.fillRect(0,0,w,h);
        const mobile = w < 600;
        ctx.save(); ctx.shadowColor=COLORS.DANGER_RED; ctx.shadowBlur=20;
        ctx.font=`bold ${mobile?26:38}px "Orbitron", monospace`; ctx.fillStyle=COLORS.DANGER_RED;
        ctx.textAlign='center'; ctx.fillText(t('go_title'), w/2, h*0.18);
        ctx.restore();
        const pW=Math.min(360,w-30), pH=260, pX=(w-pW)/2, pY=h*0.24;
        ctx.fillStyle=COLORS.UI_PANEL; ctx.fillRect(pX,pY,pW,pH);
        ctx.strokeStyle=COLORS.UI_PANEL_BORDER; ctx.lineWidth=1; ctx.strokeRect(pX,pY,pW,pH);
        const lines=[
            {l:t('go_score'),v:stats.score.toLocaleString(),c:COLORS.UI_TEXT},
            {l:t('go_record'),v:stats.highScore.toLocaleString(),c:stats.isNewHigh?COLORS.GOLD:COLORS.UI_DIM},
            {l:t('go_time'),v:`${Math.floor(stats.timeAlive/60)}:${Math.floor(stats.timeAlive%60).toString().padStart(2,'0')}`,c:COLORS.UI_TEXT},
            {l:t('go_deliveries'),v:stats.deliveries.toString(),c:COLORS.DELIVERY_GREEN},
            {l:t('go_max_combo'),v:`x${stats.maxCombo}`,c:COLORS.RUSH_YELLOW},
            {l:t('go_coins'),v:stats.coinsEarned.toString(),c:COLORS.COIN_GOLD},
            {l:t('go_rush_activations'),v:stats.rushCount.toString(),c:COLORS.RUSH_ORANGE},
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
            ctx.fillText(t('go_new_record'), w/2, pY-10);
            ctx.globalAlpha=1;
        }
        const btns=[t('go_play_again'),t('go_upgrades'),t('go_main_menu')];
        btns.forEach((item,i)=>{
            const y=pY+pH+35+i*45; const sel=i===this.selectedMenuItem;
            if(sel){ ctx.fillStyle=rgbaString(COLORS.DRONE_YELLOW,0.08); ctx.fillRect(w/2-120,y-16,240,32); }
            ctx.font=`${sel?'bold':'600'} 18px "Rajdhani", sans-serif`;
            ctx.fillStyle=sel?COLORS.DRONE_YELLOW:COLORS.UI_DIM;
            ctx.textAlign='center'; ctx.fillText(item, w/2, y+6);
        });
        this._scanlines(ctx,w,h,0.02);
    }

    renderShop(ctx,w,h,upg,coins) {
        ctx.fillStyle='rgba(10,10,26,0.88)'; ctx.fillRect(0,0,w,h);
        const mobile = w < 600;
        ctx.font=`bold ${mobile?22:28}px "Orbitron", monospace`; ctx.fillStyle=COLORS.DRONE_YELLOW;
        ctx.textAlign='center'; ctx.fillText(t('shop_title'), w/2, 48);
        ctx.font=`bold ${mobile?13:16}px "Rajdhani"`; ctx.fillStyle=COLORS.COIN_GOLD;
        ctx.fillText(`🪙 ${t('shop_coins')}: ${coins}`, w/2, 76);
        const iH=mobile?60:68, sY=100, iW=Math.min(460,w-30), iX=(w-iW)/2;
        this.shopItems.forEach((key,i)=>{
            const u=CONFIG.UPGRADES[key], lv=upg[key]||0;
            const cost=u.baseCost*(lv+1), maxed=lv>=u.maxLevel, afford=coins>=cost&&!maxed;
            const sel=i===this.selectedShopItem, y=sY+i*(iH+6);
            ctx.fillStyle=sel?rgbaString(COLORS.DRONE_YELLOW,0.06):COLORS.UI_PANEL;
            ctx.fillRect(iX,y,iW,iH);
            ctx.strokeStyle=sel?COLORS.DRONE_YELLOW:COLORS.UI_PANEL_BORDER;
            ctx.lineWidth=1; ctx.strokeRect(iX,y,iW,iH);
            ctx.font='bold 16px "Rajdhani"'; ctx.fillStyle=sel?COLORS.DRONE_YELLOW:COLORS.UI_TEXT;
            ctx.textAlign='left'; ctx.fillText(t('upg_'+key), iX+15, y+24);
            ctx.font='12px "Rajdhani"'; ctx.fillStyle=COLORS.UI_DIM;
            ctx.fillText(t('upg_'+key+'_desc'), iX+15, y+44);
            for(let l=0;l<u.maxLevel;l++){
                ctx.fillStyle=l<lv?COLORS.DRONE_YELLOW:'#222';
                ctx.fillRect(iX+15+l*18, y+52, 12, 4);
            }
            ctx.textAlign='right';
            if(maxed){ ctx.font='bold 14px "Rajdhani"'; ctx.fillStyle=COLORS.GOLD; ctx.fillText(t('shop_max'),iX+iW-15,y+35); }
            else{ ctx.font='14px "Rajdhani"'; ctx.fillStyle=afford?COLORS.COIN_GOLD:COLORS.DANGER_RED; ctx.fillText(`🪙 ${cost}`,iX+iW-15,y+35); }
        });
        ctx.font='12px "Rajdhani"'; ctx.fillStyle=COLORS.UI_DIM; ctx.textAlign='center';
        ctx.fillText(t('shop_hint'), w/2, h-22);
        this._scanlines(ctx,w,h,0.02);
    }

    renderTutorial(ctx,w,h) {
        ctx.fillStyle='rgba(10,10,26,0.92)'; ctx.fillRect(0,0,w,h);
        const mobile = w < 600;
        ctx.font=`bold ${mobile?20:28}px "Orbitron", monospace`; ctx.fillStyle=COLORS.DRONE_YELLOW;
        ctx.textAlign='center'; ctx.fillText(t('tut_title'), w/2, mobile?40:55);
        const instr=[
            {icon:'🎮', text:t('tut_move')},
            {icon:'🖱️', text:t('tut_look')},
            {icon:'⬆️', text:t('tut_updown')},
            {icon:'🌀', text:t('tut_roll')},
            {icon:'🛡', text:t('tut_shield')},
            {icon:'📦', text:t('tut_pickup')},
            {icon:'🏁', text:t('tut_deliver')},
            {icon:'⚡', text:t('tut_rush')},
            {icon:'🔥', text:t('tut_rush_mode')},
            {icon:'⚠', text:t('tut_danger')},
        ];
        const rowH = mobile ? 32 : 40;
        const topY = mobile ? 65 : 100;
        const iconX = mobile ? 25 : w/2-240;
        const textX = mobile ? 50 : w/2-210;
        const maxTextW = mobile ? w-60 : w;
        instr.forEach((inst,i)=>{
            const y=topY+i*rowH;
            ctx.font=`${mobile?14:18}px sans-serif`; ctx.textAlign='center'; ctx.fillText(inst.icon, iconX, y+5);
            ctx.font=`${mobile?11:13}px "Rajdhani", sans-serif`; ctx.fillStyle=COLORS.UI_TEXT;
            ctx.textAlign='left'; ctx.fillText(inst.text, textX, y+5, maxTextW);
            ctx.textAlign='center';
        });
        ctx.font=`bold ${mobile?12:14}px "Rajdhani"`; ctx.fillStyle=COLORS.DRONE_YELLOW;
        ctx.fillText(t('tut_back'), w/2, h-36);
        this._scanlines(ctx,w,h,0.02);
    }

    // Legacy compatibility
    renderHUD(ctx,w,h,gs) { this.renderCockpitHUD(ctx,w,h,gs); }

    addNotification(text, color=COLORS.UI_TEXT, duration=2) {
        this.notifications.push({text,color,duration,timer:0});
    }
    addComboPopup(x,y,text,color=COLORS.DRONE_YELLOW,size=18) {
        this.comboPopups.push({x,y,text,color,size,duration:0.8,timer:0,screenX:null,screenY:null});
    }
    triggerDamageVignette() { this.damageVignette=1; }
    triggerRushFlash() { this.rushFlash=1; }
    triggerHUDGlitch(intensity) { this.hudGlitch=0.3; this.hudGlitchIntensity=intensity||1; }
    setMinimapEntities(entities) { this.minimapEntities=entities; }
    setThreats(threats) { this.threats=threats; }
    setWaypoint(wp) { this.waypoint=wp; }
    setCompassYaw(yaw) { this.compassYaw=yaw; }

    _renderWaypoint(ctx, w, h) {
        if(!this.waypoint) return;
        const wp = this.waypoint;
        const cx=w/2, cy=h/2;

        // Calculate screen position from angle
        const angle = wp.angle;
        const edgeRadius = Math.min(w,h)*0.38;

        // Arrow on screen edge
        const ax = cx + Math.sin(angle) * edgeRadius;
        const ay = cy - Math.cos(angle) * edgeRadius * 0.6;

        // Pulsing
        const pulse = 0.7 + Math.sin(Date.now()*0.005) * 0.3;

        ctx.save();
        ctx.globalAlpha = pulse;

        // Arrow triangle
        ctx.translate(ax, ay);
        ctx.rotate(-angle + Math.PI);
        ctx.fillStyle = wp.color;
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(-10, 10);
        ctx.lineTo(10, 10);
        ctx.closePath();
        ctx.fill();

        // Outer glow
        ctx.strokeStyle = wp.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setTransform(1,0,0,1,0,0);

        // Distance label
        const distText = Math.floor(wp.distance) + 'm';
        ctx.font = 'bold 13px "Rajdhani", sans-serif';
        ctx.fillStyle = wp.color;
        ctx.textAlign = 'center';
        ctx.fillText(wp.label, ax, ay + 22);
        ctx.fillText(distText, ax, ay + 36);

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    _scanlines(ctx,w,h,a) {
        ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='#000';
        for(let y=this.scanlineOffset;y<h;y+=4) ctx.fillRect(0,y,w,1);
        ctx.restore();
    }

    // =========================================
    // SETTINGS MENU
    // =========================================
    _buildSettingsItems() {
        return [
            // Audio section
            {type:'header', label:'settings_audio'},
            {type:'slider', key:'master_vol', label:'settings_master_vol', configKey:'MASTER_VOLUME', min:0, max:1, step:0.05},
            {type:'slider', key:'sfx_vol', label:'settings_sfx_vol', configKey:'SFX_VOLUME', min:0, max:1, step:0.05},
            {type:'slider', key:'music_vol', label:'settings_music_vol', configKey:'MUSIC_VOLUME', min:0, max:1, step:0.05},
            // Controls section
            {type:'header', label:'settings_controls'},
            {type:'slider', key:'sensitivity', label:'settings_sensitivity', configKey:'MOUSE_SENSITIVITY', min:0.0005, max:0.005, step:0.0002},
            {type:'keybind', key:'move_up', label:'settings_move_up', action:'moveUp'},
            {type:'keybind', key:'move_down', label:'settings_move_down', action:'moveDown'},
            {type:'keybind', key:'move_left', label:'settings_move_left', action:'moveLeft'},
            {type:'keybind', key:'move_right', label:'settings_move_right', action:'moveRight'},
            {type:'keybind', key:'fly_up', label:'settings_fly_up', action:'flyUp'},
            {type:'keybind', key:'fly_down', label:'settings_fly_down', action:'flyDown'},
            {type:'keybind', key:'shield', label:'settings_shield', action:'shield'},
            {type:'keybind', key:'pause_key', label:'settings_pause', action:'pause'},
            // Language & Reset
            {type:'header', label:'settings_language'},
            {type:'action', key:'language', label:'settings_language', action:'toggleLang'},
            {type:'action', key:'reset', label:'settings_reset', action:'reset'},
        ];
    }

    getSelectableSettingsItems() {
        return this.settingsItems.filter(i=>i.type!=='header');
    }

    renderSettings(ctx, w, h, keyBindings, audioSettings) {
        ctx.fillStyle='rgba(5,5,18,0.90)'; ctx.fillRect(0,0,w,h);
        const mobile = w < 600;

        // Title
        ctx.save();
        ctx.font=`bold ${mobile?22:32}px "Orbitron", monospace`;
        ctx.textAlign='center';
        ctx.shadowColor='#FFB800'; ctx.shadowBlur=20;
        ctx.fillStyle='#FFB800';
        ctx.fillText(t('settings_title'), w/2, 50);
        ctx.shadowBlur=0;
        ctx.restore();

        const selectables = this.getSelectableSettingsItems();
        const panelW=Math.min(500, w-30), startY=80;
        const pX=(w-panelW)/2;
        const sliderStart = mobile ? pX + panelW*0.45 : pX+230;
        const sliderW = mobile ? panelW*0.38 : 200;
        let y=startY;
        let selIdx=0;
        const scrollOffset = Math.max(0, this.selectedSettingsItem - 8) * 36;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 65, w, h-95);
        ctx.clip();

        for(const item of this.settingsItems) {
            const drawY = y - scrollOffset;

            if(item.type==='header') {
                // Section header
                ctx.font='bold 14px "Rajdhani", sans-serif';
                ctx.fillStyle='#FFB800';
                ctx.textAlign='left';
                ctx.fillText(t(item.label), pX+5, drawY+14);
                // Line
                ctx.strokeStyle='rgba(255,184,0,0.2)';
                ctx.lineWidth=1;
                ctx.beginPath();
                ctx.moveTo(pX, drawY+20); ctx.lineTo(pX+panelW, drawY+20);
                ctx.stroke();
                y+=30;
                continue;
            }

            const sel = selIdx === this.selectedSettingsItem;
            const iy = drawY;

            // Row background
            if(sel) {
                ctx.fillStyle='rgba(255,184,0,0.08)';
                ctx.fillRect(pX, iy-2, panelW, 30);
                ctx.strokeStyle='rgba(255,184,0,0.35)';
                ctx.lineWidth=1;
                ctx.strokeRect(pX, iy-2, panelW, 30);
            }

            // Label
            ctx.font=`${sel?'bold':'600'} 13px "Rajdhani", sans-serif`;
            ctx.fillStyle=sel?'#ffffff':'#99aabb';
            ctx.textAlign='left';
            ctx.fillText(t(item.label), pX+12, iy+16);

            if(item.type==='slider') {
                // Slider bar
                const barX=sliderStart, barW=sliderW, barH=8, barY=iy+10;
                let val, range;
                if(item.configKey==='MOUSE_SENSITIVITY') {
                    val = audioSettings.sensitivity || CONFIG.MOUSE_SENSITIVITY;
                    range = (val - item.min)/(item.max - item.min);
                } else {
                    val = audioSettings[item.configKey] !== undefined ? audioSettings[item.configKey] : CONFIG[item.configKey];
                    range = (val - item.min)/(item.max - item.min);
                }
                // Background
                ctx.fillStyle='rgba(255,255,255,0.08)';
                ctx.fillRect(barX, barY, barW, barH);
                // Fill
                const grd = ctx.createLinearGradient(barX, 0, barX+barW*range, 0);
                grd.addColorStop(0, '#FFB800'); grd.addColorStop(1, '#FF8C00');
                ctx.fillStyle=grd;
                ctx.fillRect(barX, barY, barW*range, barH);
                // Border
                ctx.strokeStyle=sel?'rgba(255,184,0,0.5)':'rgba(255,255,255,0.1)';
                ctx.lineWidth=0.5;
                ctx.strokeRect(barX, barY, barW, barH);
                // Value text
                ctx.font='bold 12px "Rajdhani", sans-serif';
                ctx.fillStyle=sel?'#FFB800':'#667788';
                ctx.textAlign='right';
                if(item.configKey==='MOUSE_SENSITIVITY') {
                    ctx.fillText((val*1000).toFixed(1), pX+panelW-10, iy+17);
                } else {
                    ctx.fillText(Math.round(range*100)+'%', pX+panelW-10, iy+17);
                }
                // Arrows if selected
                if(sel) {
                    ctx.font='14px "Rajdhani"'; ctx.fillStyle='#FFB800';
                    ctx.textAlign='center';
                    ctx.fillText('◂', barX-10, iy+17);
                    ctx.fillText('▸', barX+barW+10, iy+17);
                }
            } else if(item.type==='keybind') {
                const bound = keyBindings[item.action] || '???';
                const isWaiting = sel && this.settingsWaitingKey;
                ctx.font='bold 13px "Rajdhani", sans-serif';
                ctx.textAlign='right';
                if(isWaiting) {
                    const pulse=Math.sin(this.menuAnimTimer*6)*0.3+0.7;
                    ctx.fillStyle=rgbaString('#FFB800',pulse);
                    ctx.fillText(t('settings_press_key'), pX+panelW-10, iy+17);
                } else {
                    // Key box
                    const keyLabel = this._formatKeyCode(bound);
                    const kw = Math.max(ctx.measureText(keyLabel).width+16, 60);
                    const kx = pX+panelW-kw-5, ky = iy+2;
                    ctx.fillStyle=sel?'rgba(255,184,0,0.15)':'rgba(255,255,255,0.05)';
                    ctx.fillRect(kx, ky, kw, 22);
                    ctx.strokeStyle=sel?'rgba(255,184,0,0.4)':'rgba(255,255,255,0.1)';
                    ctx.lineWidth=0.5;
                    ctx.strokeRect(kx, ky, kw, 22);
                    ctx.fillStyle=sel?'#FFB800':'#aabbcc';
                    ctx.textAlign='center';
                    ctx.fillText(keyLabel, kx+kw/2, iy+17);
                }
            } else if(item.type==='action') {
                ctx.font='bold 13px "Rajdhani", sans-serif';
                ctx.textAlign='right';
                if(item.action==='toggleLang') {
                    ctx.fillStyle=sel?'#FFB800':'#aabbcc';
                    ctx.fillText(getLang()==='es'?'ESPAÑOL 🇪🇸':'ENGLISH 🇬🇧', pX+panelW-10, iy+17);
                } else if(item.action==='reset') {
                    ctx.fillStyle=sel?COLORS.DANGER_RED:'#667788';
                    ctx.fillText('↺', pX+panelW-10, iy+17);
                }
            }

            selIdx++;
            y+=36;
        }

        ctx.restore();

        // Bottom hint
        ctx.font='12px "Rajdhani", sans-serif';
        ctx.fillStyle='#556677';
        ctx.textAlign='center';
        ctx.fillText(t('settings_hint'), w/2, h-18);

        this._scanlines(ctx, w, h, 0.02);
    }

    _formatKeyCode(code) {
        const map = {
            'KeyW':'W','KeyA':'A','KeyS':'S','KeyD':'D',
            'KeyQ':'Q','KeyE':'E','KeyF':'F','KeyR':'R',
            'KeyZ':'Z','KeyX':'X','KeyC':'C','KeyV':'V',
            'Space':'SPACE','ShiftLeft':'L-SHIFT','ShiftRight':'R-SHIFT',
            'ControlLeft':'L-CTRL','ControlRight':'R-CTRL',
            'AltLeft':'L-ALT','AltRight':'R-ALT',
            'ArrowUp':'↑','ArrowDown':'↓','ArrowLeft':'←','ArrowRight':'→',
            'Escape':'ESC','Enter':'ENTER','Tab':'TAB','Backspace':'BKSP',
            'KeyP':'P','KeyI':'I','KeyO':'O','KeyU':'U',
            'KeyH':'H','KeyJ':'J','KeyK':'K','KeyL':'L',
            'KeyN':'N','KeyM':'M','KeyB':'B','KeyG':'G','KeyT':'T','KeyY':'Y',
            'Digit1':'1','Digit2':'2','Digit3':'3','Digit4':'4','Digit5':'5',
            'Digit6':'6','Digit7':'7','Digit8':'8','Digit9':'9','Digit0':'0',
        };
        return map[code] || code;
    }
}
