// ============================================
// DRONES PANDAVEN 3D — Particle System (FPS Enhanced)
// ============================================
class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.max = CONFIG.MAX_PARTICLES;
        this.positions = new Float32Array(this.max * 3);
        this.colors = new Float32Array(this.max * 3);
        this.sizes = new Float32Array(this.max);
        this.particles = [];
        for (let i = 0; i < this.max; i++) {
            this.particles.push({ active:false, x:0,y:0,z:0, vx:0,vy:0,vz:0, life:0,maxLife:1, size:3,endSize:0, r:1,g:1,b:1, endR:-1,endG:-1,endB:-1, alpha:1, gravity:0, friction:1 });
            this.sizes[i] = 0;
        }
        const c = document.createElement('canvas'); c.width=32; c.height=32;
        const cx = c.getContext('2d');
        const g = cx.createRadialGradient(16,16,0,16,16,16);
        g.addColorStop(0,'rgba(255,255,255,1)');
        g.addColorStop(0.3,'rgba(255,255,255,0.5)');
        g.addColorStop(1,'rgba(255,255,255,0)');
        cx.fillStyle=g; cx.fillRect(0,0,32,32);
        this.tex = new THREE.CanvasTexture(c);
        this.geo = new THREE.BufferGeometry();
        this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        this.geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
        this.mat = new THREE.PointsMaterial({
            size:6, map:this.tex, vertexColors:true, transparent:true,
            opacity:0.8, depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true
        });
        this.points = new THREE.Points(this.geo, this.mat);
        this.points.frustumCulled = false;
        scene.add(this.points);
    }

    _get() { for(let i=0;i<this.max;i++) if(!this.particles[i].active) return i; return -1; }
    _rgb(hex) { const c=hexToRgb(hex); return {r:c.r/255,g:c.g/255,b:c.b/255}; }

    emit(x,y,z,preset,count=1) {
        for(let c=0;c<count;c++) {
            const i=this._get(); if(i<0) return;
            const p=this.particles[i];
            p.active=true; p.x=x+randomRange(-2,2); p.y=y+randomRange(-2,2); p.z=z+randomRange(-2,2);
            p.life=0; p.vx=0;p.vy=0;p.vz=0; p.endR=-1; p.gravity=0; p.friction=1; p.alpha=1;
            this._preset(p, preset);
        }
    }

    // Emit relative to a position (for rain around player)
    emitAround(cx,cy,cz,preset,count=1,range=300) {
        for(let c=0;c<count;c++) {
            const i=this._get(); if(i<0) return;
            const p=this.particles[i];
            p.active=true;
            p.x=cx+randomRange(-range,range);
            p.y=cy+randomRange(50,200);
            p.z=cz+randomRange(-range,range);
            p.life=0; p.vx=0;p.vy=0;p.vz=0; p.endR=-1; p.gravity=0; p.friction=1; p.alpha=1;
            this._preset(p, preset);
        }
    }

    _preset(p, preset) {
        const rA = () => Math.random()*Math.PI*2;
        switch(preset) {
            case 'thruster': {
                p.vx=randomRange(-15,15); p.vy=randomRange(-30,-5); p.vz=randomRange(20,60);
                p.maxLife=randomRange(0.1,0.25); p.size=randomRange(3,6); p.endSize=0;
                const c=this._rgb(COLORS.DRONE_YELLOW);
                p.r=c.r;p.g=c.g;p.b=c.b; p.alpha=0.8; break;
            }
            case 'boost': {
                p.vx=randomRange(-40,40); p.vy=randomRange(-20,20); p.vz=randomRange(30,80);
                p.maxLife=randomRange(0.2,0.4); p.size=randomRange(5,10); p.endSize=0;
                const c=this._rgb(COLORS.NEON_CYAN);
                p.r=c.r;p.g=c.g;p.b=c.b; p.alpha=0.9; break;
            }
            case 'pickup': {
                const a=rA(), s=randomRange(30,90);
                p.vx=Math.cos(a)*s; p.vy=randomRange(20,60); p.vz=Math.sin(a)*s;
                p.maxLife=randomRange(0.3,0.6); p.size=randomRange(4,8); p.endSize=0;
                const c=this._rgb(COLORS.DRONE_YELLOW);
                p.r=c.r;p.g=c.g;p.b=c.b; p.alpha=1; break;
            }
            case 'delivery': {
                const a=rA(), s=randomRange(40,120);
                p.vx=Math.cos(a)*s; p.vy=randomRange(40,100); p.vz=Math.sin(a)*s;
                p.maxLife=randomRange(0.4,0.8); p.size=randomRange(5,10); p.endSize=0;
                const c=this._rgb(COLORS.DELIVERY_GREEN);
                p.r=c.r;p.g=c.g;p.b=c.b; p.alpha=1; break;
            }
            case 'damage': {
                const a=rA(), s=randomRange(80,250);
                p.vx=Math.cos(a)*s; p.vy=randomRange(30,120); p.vz=randomRange(-80,80);
                p.maxLife=randomRange(0.3,0.7); p.size=randomRange(4,8); p.endSize=0;
                const c1=this._rgb(COLORS.DANGER_RED), c2=this._rgb(COLORS.RUSH_ORANGE);
                p.r=c1.r;p.g=c1.g;p.b=c1.b; p.endR=c2.r;p.endG=c2.g;p.endB=c2.b;
                p.gravity=-150; p.friction=0.95; p.alpha=1; break;
            }
            case 'explosion': {
                const a=rA(), b=Math.random()*Math.PI, s=randomRange(60,220);
                p.vx=Math.sin(b)*Math.cos(a)*s; p.vy=Math.cos(b)*s; p.vz=Math.sin(b)*Math.sin(a)*s;
                p.maxLife=randomRange(0.4,1); p.size=randomRange(5,12); p.endSize=0;
                const cols=[COLORS.RUSH_ORANGE,COLORS.RUSH_YELLOW,COLORS.DANGER_RED,'#ffffff'];
                const c=this._rgb(randomChoice(cols));
                p.r=c.r;p.g=c.g;p.b=c.b; p.gravity=-100; p.friction=0.96; p.alpha=1; break;
            }
            case 'rush': {
                p.vx=randomRange(-60,60); p.vy=randomRange(20,80); p.vz=randomRange(-100,-30);
                p.maxLife=randomRange(0.3,0.7); p.size=randomRange(4,8); p.endSize=0;
                const c1=this._rgb(COLORS.RUSH_YELLOW), c2=this._rgb(COLORS.RUSH_ORANGE);
                p.r=c1.r;p.g=c1.g;p.b=c1.b; p.endR=c2.r;p.endG=c2.g;p.endB=c2.b;
                p.friction=0.97; p.alpha=1; break;
            }
            case 'coin': {
                const a=rA(), s=randomRange(20,60);
                p.vx=Math.cos(a)*s; p.vy=randomRange(30,70); p.vz=Math.sin(a)*s;
                p.maxLife=randomRange(0.2,0.4); p.size=randomRange(3,6); p.endSize=0;
                const c=this._rgb(COLORS.COIN_GOLD);
                p.r=c.r;p.g=c.g;p.b=c.b; p.alpha=1; break;
            }
            case 'neon': {
                p.vx=randomRange(-5,5); p.vy=randomRange(-2,5); p.vz=randomRange(-5,5);
                p.maxLife=randomRange(0.5,1.5); p.size=randomRange(2,4); p.endSize=0;
                const cols=[COLORS.NEON_CYAN,COLORS.NEON_PINK,COLORS.NEON_PURPLE];
                const c=this._rgb(randomChoice(cols));
                p.r=c.r;p.g=c.g;p.b=c.b; p.alpha=0.6; break;
            }
            // --- NEW FPS PRESETS ---
            case 'projectile_trail': {
                p.vx=randomRange(-8,8); p.vy=randomRange(-8,8); p.vz=randomRange(-8,8);
                p.maxLife=randomRange(0.15,0.3); p.size=randomRange(3,5); p.endSize=0;
                const c1=this._rgb(COLORS.PROJECTILE_RED), c2=this._rgb(COLORS.RUSH_ORANGE);
                p.r=c1.r;p.g=c1.g;p.b=c1.b; p.endR=c2.r;p.endG=c2.g;p.endB=c2.b;
                p.alpha=0.9; break;
            }
            case 'shield_hit': {
                const a=rA(), s=randomRange(40,100);
                p.vx=Math.cos(a)*s; p.vy=randomRange(-20,40); p.vz=Math.sin(a)*s;
                p.maxLife=randomRange(0.2,0.5); p.size=randomRange(3,7); p.endSize=0;
                const c=this._rgb(COLORS.EMP_CYAN);
                p.r=c.r;p.g=c.g;p.b=c.b; p.alpha=1; break;
            }
            case 'emp_burst': {
                const a=rA(), s=randomRange(60,200);
                p.vx=Math.cos(a)*s; p.vy=randomRange(-10,10); p.vz=Math.sin(a)*s;
                p.maxLife=randomRange(0.3,0.6); p.size=randomRange(4,8); p.endSize=1;
                const c1=this._rgb(COLORS.EMP_CYAN), c2=this._rgb(COLORS.NEON_PURPLE);
                p.r=c1.r;p.g=c1.g;p.b=c1.b; p.endR=c2.r;p.endG=c2.g;p.endB=c2.b;
                p.friction=0.94; p.alpha=1; break;
            }
            case 'rain': {
                p.vx=randomRange(-5,5); p.vy=-randomRange(200,350); p.vz=randomRange(-15,-5);
                p.maxLife=randomRange(0.8,1.5); p.size=randomRange(1,2); p.endSize=0.5;
                p.r=0.4;p.g=0.5;p.b=0.6; p.alpha=0.3; break;
            }
            case 'sparks': {
                const a=rA(), s=randomRange(60,150);
                p.vx=Math.cos(a)*s; p.vy=randomRange(30,100); p.vz=Math.sin(a)*s;
                p.maxLife=randomRange(0.2,0.5); p.size=randomRange(2,5); p.endSize=0;
                const cols=[COLORS.DRONE_YELLOW,'#ffffff',COLORS.RUSH_ORANGE];
                const c=this._rgb(randomChoice(cols));
                p.r=c.r;p.g=c.g;p.b=c.b; p.gravity=-200; p.friction=0.95; p.alpha=1; break;
            }
            case 'muzzle_flash': {
                const a=rA(), s=randomRange(20,60);
                p.vx=Math.cos(a)*s; p.vy=randomRange(-10,10); p.vz=Math.sin(a)*s;
                p.maxLife=randomRange(0.05,0.15); p.size=randomRange(4,8); p.endSize=0;
                p.r=1;p.g=0.8;p.b=0.3; p.alpha=1; break;
            }
        }
    }

    update(dt) {
        for(let i=0;i<this.max;i++) {
            const p=this.particles[i];
            if(!p.active) continue;
            p.life+=dt;
            if(p.life>=p.maxLife) { p.active=false; this.sizes[i]=0; continue; }
            p.vx*=p.friction; p.vy*=p.friction; p.vz*=p.friction;
            p.vy+=(p.gravity||0)*dt;
            p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt;
            const t=p.life/p.maxLife;
            const sz=lerp(p.size, p.endSize, t);
            const i3=i*3;
            this.positions[i3]=p.x; this.positions[i3+1]=p.y; this.positions[i3+2]=p.z;
            if(p.endR>=0) {
                this.colors[i3]=lerp(p.r,p.endR,t);
                this.colors[i3+1]=lerp(p.g,p.endG,t);
                this.colors[i3+2]=lerp(p.b,p.endB,t);
            } else {
                this.colors[i3]=p.r; this.colors[i3+1]=p.g; this.colors[i3+2]=p.b;
            }
            this.sizes[i]=Math.max(0,sz);
        }
        this.geo.attributes.position.needsUpdate=true;
        this.geo.attributes.color.needsUpdate=true;
        this.geo.attributes.size.needsUpdate=true;
    }

    clear() {
        for(let i=0;i<this.max;i++) { this.particles[i].active=false; this.sizes[i]=0; }
        this.geo.attributes.size.needsUpdate=true;
    }
}
