// ============================================
// DRONES PANDAVEN 3D — Utils & Config (First Person)
// ============================================

const CONFIG = {
    CANVAS_WIDTH: 1280,
    CANVAS_HEIGHT: 720,

    // Drone
    DRONE_SIZE: 12,
    DRONE_SPEED: 320,
    DRONE_ACCEL: 2200,
    DRONE_FRICTION: 0.94,
    DRONE_BOOST_SPEED: 600,
    DRONE_BOOST_DURATION: 0.6,
    DRONE_BOOST_COOLDOWN: 0.8,
    DRONE_MAX_LIVES: 3,
    DRONE_INVINCIBILITY_TIME: 1.5,

    // First Person Camera
    MOUSE_SENSITIVITY: 0.0015,
    CAMERA_COCKPIT_HEIGHT: 6,
    HEAD_BOB_INTENSITY: 0.10,
    HEAD_BOB_SPEED: 8,
    ENGINE_VIBRATION: 0.06,
    CAMERA_TILT_FACTOR: 0.15,
    FPS_FOV: 85,
    FPS_FOV_BOOST: 105,
    FPS_FOV_RUSH: 100,

    // Combat
    PROJECTILE_SPEED: 320,
    PROJECTILE_LIFE: 4,
    PROJECTILE_RADIUS: 3,
    ENEMY_FIRE_RATE_MIN: 2.5,
    ENEMY_FIRE_RATE_MAX: 4,
    TURRET_FIRE_RATE: 2.2,
    TURRET_BURST: 3,
    TURRET_BURST_DELAY: 0.15,
    TURRET_DETECT_RANGE: 350,
    BARREL_ROLL_DURATION: 0.4,
    BARREL_ROLL_COOLDOWN: 2,
    EMP_SHIELD_DURATION: 2,
    EMP_SHIELD_COST: 30,
    EMP_SHIELD_RADIUS: 25,

    // Enemy types
    KAMIKAZE_SPEED: 220,
    KAMIKAZE_DETECT_RANGE: 300,
    PATROL_DETECT_RANGE: 400,
    PATROL_SHOOT_RANGE: 300,
    JAMMER_RANGE: 150,
    JAMMER_DISTORTION: 0.5,

    // Rush Mode
    RUSH_MAX: 100,
    RUSH_GAIN_PER_DELIVERY: 25,
    RUSH_GAIN_PER_PACKAGE: 8,
    RUSH_DURATION: 7,
    RUSH_SPEED_MULT: 1.5,
    RUSH_SCORE_MULT: 3,

    // World
    SCROLL_SPEED: 130,
    MAX_SCROLL_SPEED: 300,
    CITY_WIDTH: 200,
    CITY_HEIGHT: 300,
    CHUNK_DEPTH: 800,

    // Difficulty
    DIFFICULTY_INCREASE_INTERVAL: 20,
    BASE_OBSTACLE_DENSITY: 0.3,
    MAX_OBSTACLE_DENSITY: 0.8,

    // Scoring
    DELIVERY_SCORE: 250,
    PACKAGE_SCORE: 50,
    COIN_SCORE: 10,
    COMBO_TIMEOUT: 4,
    MAX_COMBO_MULT: 8,

    // Camera legacy (used by menu scene)
    CAMERA_DISTANCE: 300,
    CAMERA_HEIGHT: 120,
    CAMERA_FOV: 70,
    CAMERA_FOV_RUSH: 85,
    FOG_NEAR: 200,
    FOG_FAR: 2500,

    // Particles
    MAX_PARTICLES: 800,

    // Audio
    MASTER_VOLUME: 0.3,
    SFX_VOLUME: 0.5,
    MUSIC_VOLUME: 0.25,

    // Upgrades
    UPGRADES: {
        speed:    { name: 'MOTORES',     baseCost: 40,  maxLevel: 5, description: '+15% velocidad' },
        battery:  { name: 'BATERÍA',     baseCost: 50,  maxLevel: 3, description: '+1 vida extra' },
        magnet:   { name: 'IMÁN',        baseCost: 60,  maxLevel: 4, description: '+25% rango recogida' },
        rush:     { name: 'TURBO',       baseCost: 80,  maxLevel: 3, description: '+2s modo rush' },
        boost:    { name: 'PROPULSORES', baseCost: 70,  maxLevel: 3, description: '-0.3s cooldown boost' },
    }
};

const COLORS = {
    BG_DARK: '#87CEEB',
    BG_MID: '#B0D4E8',
    BG_LIGHT: '#C8E0F0',

    DRONE_YELLOW: '#FFB800',
    DRONE_DARK: '#2a2a2a',
    DRONE_ACCENT: '#FF8C00',

    NEON_CYAN: '#0088cc',
    NEON_PINK: '#cc2255',
    NEON_PURPLE: '#7733aa',
    NEON_GREEN: '#22aa44',

    PACKAGE_BROWN: '#8B6914',
    PACKAGE_TAPE: '#FFB800',

    DELIVERY_GREEN: '#00cc66',
    DELIVERY_GLOW: '#00dd77',

    RUSH_ORANGE: '#ff6600',
    RUSH_YELLOW: '#ffaa00',

    DANGER_RED: '#dd1133',
    PROJECTILE_RED: '#ff2244',
    PROJECTILE_GLOW: '#ff4466',

    GOLD: '#ffd700',
    COIN_GOLD: '#FFD700',

    BUILDING_1: '#C8BEB0',
    BUILDING_2: '#A8A098',
    BUILDING_3: '#D8D0C4',

    SHIELD_BLUE: '#4488ff',
    EMP_CYAN: '#00bbee',

    UI_TEXT: '#f0f4f8',
    UI_DIM: '#99aabb',
    UI_PANEL: 'rgba(15, 25, 40, 0.85)',
    UI_PANEL_BORDER: 'rgba(255, 184, 0, 0.35)',
    COCKPIT_HUD: 'rgba(0, 180, 220, 0.9)',
    COCKPIT_HUD_DIM: 'rgba(0, 150, 200, 0.4)',
    THREAT_RED: 'rgba(220, 20, 50, 0.85)',
    MINIMAP_BG: 'rgba(10, 18, 30, 0.85)',
};

// --- Math ---
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
function distance(x1, y1, x2, y2) { return Math.sqrt((x2-x1)**2 + (y2-y1)**2); }
function distance3D(x1,y1,z1,x2,y2,z2) { return Math.sqrt((x2-x1)**2+(y2-y1)**2+(z2-z1)**2); }
function randomRange(a, b) { return a + Math.random() * (b - a); }
function randomInt(a, b) { return Math.floor(randomRange(a, b + 1)); }
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function normalize(x, y) { const l=Math.sqrt(x*x+y*y); return l===0?{x:0,y:0}:{x:x/l,y:y/l}; }
function normalize3D(x,y,z) { const l=Math.sqrt(x*x+y*y+z*z); return l===0?{x:0,y:0,z:0}:{x:x/l,y:y/l,z:z/l}; }
function angleBetween(x1,z1,x2,z2) { return Math.atan2(x2-x1,z2-z1); }

function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : {r:0,g:0,b:0};
}
function rgbaString(hex, a) { const c=hexToRgb(hex); return `rgba(${c.r},${c.g},${c.b},${a})`; }
function hexToRGBA(hex, a) { return rgbaString(hex, a); }
function lerpColor(h1, h2, t) {
    const c1=hexToRgb(h1), c2=hexToRgb(h2);
    return `rgb(${Math.round(lerp(c1.r,c2.r,t))},${Math.round(lerp(c1.g,c2.g,t))},${Math.round(lerp(c1.b,c2.b,t))})`;
}

function drawGlow(ctx, x, y, r, color, intensity=1) {
    const g = ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0, rgbaString(color, 0.6*intensity));
    g.addColorStop(0.4, rgbaString(color, 0.2*intensity));
    g.addColorStop(1, rgbaString(color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
}

function createMetalMat(color, rough=0.5) {
    return new THREE.MeshStandardMaterial({ color, metalness:0.8, roughness:rough });
}

// --- Easing ---
function easeOutQuad(t) { return t*(2-t); }
function easeInQuad(t) { return t*t; }
function easeOutCubic(t) { return 1-Math.pow(1-t,3); }
function easeOutElastic(t) { const c=(2*Math.PI)/3; return t===0?0:t===1?1:Math.pow(2,-10*t)*Math.sin((t*10-0.75)*c)+1; }
function easeOutBack(t) { const c1=1.70158,c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); }

// --- Storage ---
function saveData(k, d) { try { localStorage.setItem('pandaven_'+k, JSON.stringify(d)); } catch(e){} }
function loadData(k, def=null) { try { const d=localStorage.getItem('pandaven_'+k); return d?JSON.parse(d):def; } catch(e){return def;} }
