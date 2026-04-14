// ============================================
// DRONES PANDAVEN 3D — Internationalization (i18n)
// ============================================

const LANG_DATA = {
    es: {
        // === Menu ===
        menu_survival: 'SUPERVIVENCIA',
        menu_racing: 'CARRERA PANDAVEN',
        menu_upgrades: 'MEJORAS',
        menu_tutorial: 'CÓMO JUGAR',
        menu_language: '🌐 IDIOMA: ESPAÑOL',
        menu_subtitle: 'ENTREGAS RÁPIDAS — PRIMERA PERSONA',
        menu_footer: 'DRONES PANDAVEN 3D — Primera Persona Inmersivo',
        menu_controls: 'WASD: Mover  •  Ratón: Mirar  •  Q: Escudo  •  ESC: Pausa',
        menu_record: 'RÉCORD',

        // === HUD ===
        hud_deliveries: 'ENTREGAS',
        hud_vel: 'VEL',
        hud_alt: 'ALT',
        hud_kmh: 'km/h',
        hud_battery: 'BATERÍA',
        hud_rush: 'RUSH',
        hud_rush_mode: '⚡ RUSH MODE ⚡',
        hud_barrel_roll: 'BARREL ROLL',
        hud_barrel_roll_hint: '⟵⟵ A/D ROLL ⟶⟶',
        hud_radar: 'RADAR',
        hud_package_hint: '📦 PAQUETE RECOGIDO — BUSCA EL PAD DE ENTREGA ⬇',
        hud_shield_active: '🛡 ESCUDO ACTIVO',
        hud_shield_ready: '[Q] ESCUDO EMP',
        hud_shield_no_rush: '[Q] ESCUDO — SIN RUSH',

        // === Notifications ===
        notif_go: '¡GO!',
        notif_shield_activated: '🛡 ESCUDO EMP ACTIVADO',
        notif_enemy_destroyed: '💥 ¡ENEMIGO DESTRUIDO!',
        notif_package_picked: '📦 ¡PAQUETE RECOGIDO!',
        notif_delivery: '🎯 ¡ENTREGA',
        notif_rush_mode: '⚡ ¡RUSH MODE! ⚡',
        notif_victory: '🏆 ¡VICTORIA!',
        notif_position: 'POSICIÓN',
        notif_upgrade_level: 'nivel',

        // === Power-ups ===
        powerup_shield: '🛡 ESCUDO',
        powerup_speed: '⚡ VELOCIDAD',
        powerup_magnet: '🧲 IMÁN',
        powerup_timeslow: '⏳ CÁMARA LENTA',
        powerup_default: 'POWER UP',

        // === Racing ===
        race_select_title: 'SELECCIONAR PISTA',
        race_select_subtitle: 'CARRERA PANDAVEN — ELIGE TU MUNDO',
        race_controls_hint: 'W/S o ↑/↓: Seleccionar  •  ENTER: Iniciar  •  ESC: Volver',
        race_pilots: 'PILOTOS',
        race_gates: 'GATES',
        race_victory: '🏆 ¡VICTORIA!',
        race_finish: 'FIN DE CARRERA',
        race_final_pos: 'Posición Final',
        race_of: 'de',
        race_suffix_1: 'er',
        race_suffix_2: 'do',
        race_suffix_3: 'ro',
        race_suffix_other: 'to',

        // === Race Worlds ===
        world_campo: '🌿 CAMPO VERDE',
        world_campo_desc: 'Pradera abierta con árboles y rocas',
        world_desierto: '🏜️ DESIERTO ROJO',
        world_desierto_desc: 'Arena ardiente con cactus y cañones',
        world_neon: '🌃 NOCHE NEON',
        world_neon_desc: 'Ciudad cyberpunk iluminada con neón',
        world_nevado: '❄️ MONTAÑA NEVADA',
        world_nevado_desc: 'Cumbres heladas con pinos y nieve',
        world_volcanico: '🌋 VOLCÁNICO',
        world_volcanico_desc: 'Tierra de lava con rocas de obsidiana',

        // === Pause ===
        pause_title: 'PAUSA',
        pause_continue: 'CONTINUAR',
        pause_restart: 'REINICIAR',
        pause_menu: 'MENÚ PRINCIPAL',

        // === Game Over ===
        go_title: 'DRONE PERDIDO',
        go_score: 'PUNTUACIÓN',
        go_record: 'RÉCORD',
        go_time: 'TIEMPO',
        go_deliveries: 'ENTREGAS',
        go_max_combo: 'COMBO MÁX',
        go_coins: 'MONEDAS',
        go_rush_activations: 'RUSH ACTIVACIONES',
        go_new_record: '★ NUEVO RÉCORD ★',
        go_play_again: 'JUGAR DE NUEVO',
        go_upgrades: 'MEJORAS',
        go_main_menu: 'MENÚ PRINCIPAL',

        // === Shop ===
        shop_title: 'MEJORAS',
        shop_coins: 'MONEDAS',
        shop_max: 'MÁXIMO',
        shop_hint: 'ESC: Volver  •  ENTER: Comprar',
        // Upgrade names
        upg_speed: 'MOTORES',
        upg_battery: 'BATERÍA',
        upg_magnet: 'IMÁN',
        upg_rush: 'TURBO',
        upg_boost: 'PROPULSORES',
        // Upgrade descriptions
        upg_speed_desc: '+15% velocidad',
        upg_battery_desc: '+1 vida extra',
        upg_magnet_desc: '+25% rango recogida',
        upg_rush_desc: '+2s modo rush',
        upg_boost_desc: '-0.3s cooldown boost',

        // === Tutorial ===
        tut_title: 'CÓMO JUGAR',
        tut_move: 'WASD para mover el drone en la dirección que miras',
        tut_look: 'Ratón para mirar alrededor (click para capturar)',
        tut_updown: 'ESPACIO subir • SHIFT bajar',
        tut_roll: 'Doble-tap A/D para barrel roll (esquiva con invencibilidad)',
        tut_shield: 'Q para activar escudo EMP (consume medidor Rush)',
        tut_pickup: 'Vuela cerca de los paquetes para recogerlos',
        tut_deliver: 'Lleva el paquete al pad de entrega (columna verde)',
        tut_rush: 'Las entregas llenan el medidor Rush Mode',
        tut_rush_mode: 'Rush Mode: 3x puntos pero todo más rápido',
        tut_danger: '¡CUIDADO! Los drones enemigos te disparan proyectiles',
        tut_back: 'Presiona cualquier tecla para volver',

        // === Waypoint ===
        wp_delivery: '🏁 ENTREGA',
        wp_package: '📦 PAQUETE',

        // === Settings ===
        menu_settings: '⚙ CONFIGURACIÓN',
        settings_title: 'CONFIGURACIÓN',
        settings_audio: '🔊 AUDIO',
        settings_master_vol: 'VOLUMEN GENERAL',
        settings_sfx_vol: 'EFECTOS SONIDO',
        settings_music_vol: 'MÚSICA',
        settings_controls: '🎮 CONTROLES',
        settings_move_up: 'MOVER ADELANTE',
        settings_move_down: 'MOVER ATRÁS',
        settings_move_left: 'MOVER IZQUIERDA',
        settings_move_right: 'MOVER DERECHA',
        settings_fly_up: 'SUBIR',
        settings_fly_down: 'BAJAR',
        settings_shield: 'ESCUDO EMP',
        settings_shoot: 'DISPARAR',
        settings_pause: 'PAUSA',
        settings_sensitivity: 'SENSIBILIDAD RATÓN',
        settings_press_key: '... presiona una tecla ...',
        settings_hint: '↑/↓: Navegar  •  ←/→: Ajustar  •  ENTER: Reasignar tecla  •  ESC: Volver',
        settings_reset: 'RESTABLECER TODO',
        settings_language: '🌐 IDIOMA',
    },

    en: {
        // === Menu ===
        menu_survival: 'SURVIVAL',
        menu_racing: 'PANDAVEN RACE',
        menu_upgrades: 'UPGRADES',
        menu_tutorial: 'HOW TO PLAY',
        menu_language: '🌐 LANGUAGE: ENGLISH',
        menu_subtitle: 'FAST DELIVERIES — FIRST PERSON',
        menu_footer: 'DRONES PANDAVEN 3D — Immersive First Person',
        menu_controls: 'WASD: Move  •  Mouse: Look  •  Q: Shield  •  ESC: Pause',
        menu_record: 'HIGH SCORE',

        // === HUD ===
        hud_deliveries: 'DELIVERIES',
        hud_vel: 'SPD',
        hud_alt: 'ALT',
        hud_kmh: 'km/h',
        hud_battery: 'BATTERY',
        hud_rush: 'RUSH',
        hud_rush_mode: '⚡ RUSH MODE ⚡',
        hud_barrel_roll: 'BARREL ROLL',
        hud_barrel_roll_hint: '⟵⟵ A/D ROLL ⟶⟶',
        hud_radar: 'RADAR',
        hud_package_hint: '📦 PACKAGE PICKED UP — FIND THE DELIVERY PAD ⬇',
        hud_shield_active: '🛡 SHIELD ACTIVE',
        hud_shield_ready: '[Q] EMP SHIELD',
        hud_shield_no_rush: '[Q] SHIELD — NO RUSH',

        // === Notifications ===
        notif_go: 'GO!',
        notif_shield_activated: '🛡 EMP SHIELD ACTIVATED',
        notif_enemy_destroyed: '💥 ENEMY DESTROYED!',
        notif_package_picked: '📦 PACKAGE PICKED UP!',
        notif_delivery: '🎯 DELIVERY',
        notif_rush_mode: '⚡ RUSH MODE! ⚡',
        notif_victory: '🏆 VICTORY!',
        notif_position: 'POSITION',
        notif_upgrade_level: 'level',

        // === Power-ups ===
        powerup_shield: '🛡 SHIELD',
        powerup_speed: '⚡ SPEED',
        powerup_magnet: '🧲 MAGNET',
        powerup_timeslow: '⏳ SLOW MOTION',
        powerup_default: 'POWER UP',

        // === Racing ===
        race_select_title: 'SELECT TRACK',
        race_select_subtitle: 'PANDAVEN RACE — CHOOSE YOUR WORLD',
        race_controls_hint: 'W/S or ↑/↓: Select  •  ENTER: Start  •  ESC: Back',
        race_pilots: 'PILOTS',
        race_gates: 'GATES',
        race_victory: '🏆 VICTORY!',
        race_finish: 'RACE FINISHED',
        race_final_pos: 'Final Position',
        race_of: 'of',
        race_suffix_1: 'st',
        race_suffix_2: 'nd',
        race_suffix_3: 'rd',
        race_suffix_other: 'th',

        // === Race Worlds ===
        world_campo: '🌿 GREEN FIELDS',
        world_campo_desc: 'Open meadow with trees and rocks',
        world_desierto: '🏜️ RED DESERT',
        world_desierto_desc: 'Scorching sand with cacti and canyons',
        world_neon: '🌃 NEON NIGHT',
        world_neon_desc: 'Cyberpunk city lit with neon lights',
        world_nevado: '❄️ SNOWY MOUNTAIN',
        world_nevado_desc: 'Frozen peaks with pines and snow',
        world_volcanico: '🌋 VOLCANIC',
        world_volcanico_desc: 'Lava land with obsidian rocks',

        // === Pause ===
        pause_title: 'PAUSED',
        pause_continue: 'CONTINUE',
        pause_restart: 'RESTART',
        pause_menu: 'MAIN MENU',

        // === Game Over ===
        go_title: 'DRONE LOST',
        go_score: 'SCORE',
        go_record: 'HIGH SCORE',
        go_time: 'TIME',
        go_deliveries: 'DELIVERIES',
        go_max_combo: 'MAX COMBO',
        go_coins: 'COINS',
        go_rush_activations: 'RUSH ACTIVATIONS',
        go_new_record: '★ NEW RECORD ★',
        go_play_again: 'PLAY AGAIN',
        go_upgrades: 'UPGRADES',
        go_main_menu: 'MAIN MENU',

        // === Shop ===
        shop_title: 'UPGRADES',
        shop_coins: 'COINS',
        shop_max: 'MAX',
        shop_hint: 'ESC: Back  •  ENTER: Buy',
        // Upgrade names
        upg_speed: 'ENGINES',
        upg_battery: 'BATTERY',
        upg_magnet: 'MAGNET',
        upg_rush: 'TURBO',
        upg_boost: 'THRUSTERS',
        // Upgrade descriptions
        upg_speed_desc: '+15% speed',
        upg_battery_desc: '+1 extra life',
        upg_magnet_desc: '+25% pickup range',
        upg_rush_desc: '+2s rush mode',
        upg_boost_desc: '-0.3s boost cooldown',

        // === Tutorial ===
        tut_title: 'HOW TO PLAY',
        tut_move: 'WASD to move the drone in the direction you look',
        tut_look: 'Mouse to look around (click to capture)',
        tut_updown: 'SPACE go up • SHIFT go down',
        tut_roll: 'Double-tap A/D for barrel roll (dodge with invincibility)',
        tut_shield: 'Q to activate EMP shield (uses Rush meter)',
        tut_pickup: 'Fly near packages to pick them up',
        tut_deliver: 'Bring the package to the delivery pad (green column)',
        tut_rush: 'Deliveries fill the Rush Mode meter',
        tut_rush_mode: 'Rush Mode: 3x points but everything faster',
        tut_danger: 'WATCH OUT! Enemy drones shoot projectiles at you',
        tut_back: 'Press any key to go back',

        // === Waypoint ===
        wp_delivery: '🏁 DELIVERY',
        wp_package: '📦 PACKAGE',

        // === Settings ===
        menu_settings: '⚙ SETTINGS',
        settings_title: 'SETTINGS',
        settings_audio: '🔊 AUDIO',
        settings_master_vol: 'MASTER VOLUME',
        settings_sfx_vol: 'SOUND EFFECTS',
        settings_music_vol: 'MUSIC',
        settings_controls: '🎮 CONTROLS',
        settings_move_up: 'MOVE FORWARD',
        settings_move_down: 'MOVE BACK',
        settings_move_left: 'MOVE LEFT',
        settings_move_right: 'MOVE RIGHT',
        settings_fly_up: 'FLY UP',
        settings_fly_down: 'FLY DOWN',
        settings_shield: 'EMP SHIELD',
        settings_shoot: 'SHOOT',
        settings_pause: 'PAUSE',
        settings_sensitivity: 'MOUSE SENSITIVITY',
        settings_press_key: '... press a key ...',
        settings_hint: '↑/↓: Navigate  •  ←/→: Adjust  •  ENTER: Rebind key  •  ESC: Back',
        settings_reset: 'RESET ALL',
        settings_language: '🌐 LANGUAGE',
    }
};

// Current language
let _currentLang = loadData ? loadData('lang', 'es') : 'es';

// Get translation
function t(key) {
    const dict = LANG_DATA[_currentLang] || LANG_DATA['es'];
    return dict[key] !== undefined ? dict[key] : key;
}

// Set language
function setLang(lang) {
    if (LANG_DATA[lang]) {
        _currentLang = lang;
        if (typeof saveData === 'function') saveData('lang', lang);
    }
}

// Get current language
function getLang() { return _currentLang; }

// Toggle between available languages
function toggleLang() {
    const langs = Object.keys(LANG_DATA);
    const idx = langs.indexOf(_currentLang);
    const next = langs[(idx + 1) % langs.length];
    setLang(next);
    return next;
}
