// ============================================
// DRONES PANDAVEN 3D — Entry Point (Debug)
// ============================================
(function() {
    'use strict';

    let game = null;

    window.onerror = function(msg, src, line, col, error) {
        const d = document.createElement('div');
        d.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;font:14px monospace;padding:10px;z-index:99999;white-space:pre-wrap;';
        d.textContent = 'ERROR: ' + msg + '\nFile: ' + src + ':' + line + ':' + col;
        document.body.appendChild(d);
        console.error('GAME ERROR:', msg, src, line, col, error);
    };

    function init() {
        const container = document.getElementById('gameContainer');
        if (!container) { console.error('No game container found'); return; }

        if (typeof THREE === 'undefined') {
            console.error('Three.js not loaded');
            document.getElementById('loadingOverlay').innerHTML = '<div style="color:#ff4444;font-family:monospace;text-align:center;"><h2>Error</h2><p>Three.js no se pudo cargar.</p></div>';
            return;
        }

        try {
            game = new Game(container);
        } catch(e) {
            const d = document.createElement('div');
            d.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;font:14px monospace;padding:10px;z-index:99999;white-space:pre-wrap;';
            d.textContent = 'INIT ERROR: ' + e.message + '\n' + e.stack;
            document.body.appendChild(d);
            console.error('INIT ERROR:', e);
            return;
        }

        // Pointer lock overlay management
        const plOverlay = document.getElementById('pointerLockOverlay');
        if (plOverlay) {
            document.addEventListener('pointerlockchange', () => {
                if (document.pointerLockElement) {
                    plOverlay.classList.remove('visible');
                    document.body.style.cursor = 'none';
                } else {
                    if (game && game.state === 'playing') {
                        plOverlay.classList.add('visible');
                    } else {
                        plOverlay.classList.remove('visible');
                    }
                    document.body.style.cursor = 'crosshair';
                }
            });
        }

        // Hide loading screen
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => { overlay.style.display = 'none'; }, 500);
            }, 800);
        }

        game.start();

        console.log('%c🐼 DRONES PANDAVEN 3D %c— FPS Inmersivo',
            'color: #FFB800; font-size: 20px; font-weight: bold;',
            'color: #667788; font-size: 14px;'
        );
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
