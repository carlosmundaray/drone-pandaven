// ============================================
// DRONES PANDAVEN 3D — Entry Point
// ============================================
(function() {
    'use strict';

    let game = null;

    function init() {
        const container = document.getElementById('gameContainer');
        if (!container) { console.error('No game container found'); return; }

        // Check Three.js
        if (typeof THREE === 'undefined') {
            console.error('Three.js not loaded');
            document.getElementById('loadingOverlay').innerHTML = '<div style="color:#ff4444;font-family:monospace;text-align:center;"><h2>Error</h2><p>Three.js no se pudo cargar.<br>Verifica tu conexión a internet.</p></div>';
            return;
        }

        // Create game
        game = new Game(container);

        // Hide loading screen
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 500);
            }, 800);
        }

        // Start game loop
        game.start();

        console.log('%c🐼 DRONES PANDAVEN 3D %c— Entregas Rápidas',
            'color: #FFB800; font-size: 20px; font-weight: bold;',
            'color: #667788; font-size: 14px;'
        );
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
