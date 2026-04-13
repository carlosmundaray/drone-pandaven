// ============================================
// DRONES PANDAVEN 3D — Input Handler
// ============================================
class InputHandler {
    constructor() {
        this.keys = {};
        this.keysJustPressed = {};
        this.mouse = { x:0, y:0, down:false, clicked:false };
        this.touch = { active:false, x:0, y:0, startX:0, startY:0 };
        this.virtualJoystick = { active:false, dx:0, dy:0, magnitude:0 };
        this.virtualButtons = { dash:false, pause:false };
        this._setupKeyboard();
        this._setupMouse();
        this._setupTouch();
    }
    _setupKeyboard() {
        window.addEventListener('keydown', e => {
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space',' '].includes(e.key)) e.preventDefault();
            if (!this.keys[e.code]) this.keysJustPressed[e.code] = true;
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    }
    _setupMouse() {
        window.addEventListener('mousemove', e => { this.mouse.x=e.clientX; this.mouse.y=e.clientY; });
        window.addEventListener('mousedown', () => { this.mouse.down=true; this.mouse.clicked=true; });
        window.addEventListener('mouseup', () => { this.mouse.down=false; });
    }
    _setupTouch() {
        window.addEventListener('touchstart', e => {
            e.preventDefault();
            const t=e.touches[0];
            this.touch.active=true; this.touch.startX=t.clientX; this.touch.startY=t.clientY;
            this.touch.x=t.clientX; this.touch.y=t.clientY;
            this.mouse.clicked=true; this.mouse.x=t.clientX; this.mouse.y=t.clientY;
            if (t.clientX > window.innerWidth*0.7) this.virtualButtons.dash=true;
            this.virtualJoystick.active=true;
        }, {passive:false});
        window.addEventListener('touchmove', e => {
            e.preventDefault();
            const t=e.touches[0];
            this.touch.x=t.clientX; this.touch.y=t.clientY;
            this.mouse.x=t.clientX; this.mouse.y=t.clientY;
            if (this.virtualJoystick.active) {
                const dx=t.clientX-this.touch.startX, dy=t.clientY-this.touch.startY;
                const mag=Math.sqrt(dx*dx+dy*dy), maxD=60;
                this.virtualJoystick.magnitude=Math.min(mag/maxD,1);
                if (mag>5) { this.virtualJoystick.dx=dx/mag; this.virtualJoystick.dy=dy/mag; }
                else { this.virtualJoystick.dx=0; this.virtualJoystick.dy=0; }
            }
        }, {passive:false});
        window.addEventListener('touchend', () => {
            this.touch.active=false; this.virtualJoystick.active=false;
            this.virtualJoystick.dx=0; this.virtualJoystick.dy=0; this.virtualJoystick.magnitude=0;
            this.virtualButtons.dash=false;
        });
    }
    getMovement() {
        let mx=0, my=0;
        if (this.keys['KeyA']||this.keys['ArrowLeft']) mx-=1;
        if (this.keys['KeyD']||this.keys['ArrowRight']) mx+=1;
        if (this.keys['KeyW']||this.keys['ArrowUp']) my+=1;
        if (this.keys['KeyS']||this.keys['ArrowDown']) my-=1;
        if (this.virtualJoystick.active && this.virtualJoystick.magnitude>0.1) {
            mx=this.virtualJoystick.dx*this.virtualJoystick.magnitude;
            my=-this.virtualJoystick.dy*this.virtualJoystick.magnitude;
        }
        const l=Math.sqrt(mx*mx+my*my);
        if (l>1) { mx/=l; my/=l; }
        return {x:mx, y:my};
    }
    isDashPressed() { return this.keysJustPressed['Space']||this.keysJustPressed['ShiftLeft']||this.virtualButtons.dash; }
    isPausePressed() { return this.keysJustPressed['Escape']||this.keysJustPressed['KeyP']; }
    isConfirmPressed() { return this.keysJustPressed['Enter']||this.keysJustPressed['Space']||this.mouse.clicked; }
    isKeyJustPressed(code) { return !!this.keysJustPressed[code]; }
    endFrame() { this.keysJustPressed={}; this.mouse.clicked=false; this.virtualButtons.dash=false; }
}
