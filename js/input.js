// ============================================
// DRONES PANDAVEN 3D — Input Handler (FPS)
// ============================================
class InputHandler {
    constructor() {
        this.keys = {};
        this.keysJustPressed = {};
        this.mouse = { x:0, y:0, down:false, clicked:false, buttons:{} };
        this.mouseDelta = { x:0, y:0 };
        this.touch = { active:false, x:0, y:0, startX:0, startY:0 };
        this.virtualJoystick = { active:false, dx:0, dy:0, magnitude:0 };
        this.virtualButtons = { dash:false, pause:false };

        // Pointer Lock
        this.pointerLocked = false;
        this.pointerLockRequested = false;

        // Double-tap detection for barrel roll
        this._tapTimers = {};
        this._tapThreshold = 0.3; // seconds

        // Dynamic bindings
        this.bindings = {
            moveUp:'KeyW', moveDown:'KeyS', moveLeft:'KeyA', moveRight:'KeyD',
            flyUp:'Space', flyDown:'ShiftLeft',
            shield:'KeyQ', pause:'Escape'
        };

        this._setupKeyboard();
        this._setupMouse();
        this._setupTouch();
        this._setupPointerLock();
    }

    setBindings(b) {
        if(b) Object.assign(this.bindings, b);
    }

    _setupKeyboard() {
        window.addEventListener('keydown', e => {
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space',' '].includes(e.key)) e.preventDefault();
            if (!this.keys[e.code]) {
                this.keysJustPressed[e.code] = true;
                // Double-tap detection
                if (e.code === this.bindings.moveLeft || e.code === this.bindings.moveRight) {
                    const now = performance.now() / 1000;
                    if (!this._tapTimers[e.code]) this._tapTimers[e.code] = 0;
                    if (now - this._tapTimers[e.code] < this._tapThreshold) {
                        this.keysJustPressed[e.code + '_DOUBLE'] = true;
                    }
                    this._tapTimers[e.code] = now;
                }
            }
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    }

    _setupMouse() {
        window.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            if (this.pointerLocked) {
                this.mouseDelta.x += e.movementX || 0;
                this.mouseDelta.y += e.movementY || 0;
            }
        });
        window.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            this.mouse.clicked = true;
            if(!this.mouse.buttons) this.mouse.buttons = {};
            this.mouse.buttons[e.button] = true;
        });
        window.addEventListener('mouseup', (e) => {
            this.mouse.down = false;
            if(this.mouse.buttons) this.mouse.buttons[e.button] = false;
        });
    }

    _setupPointerLock() {
        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = !!document.pointerLockElement;
        });
        document.addEventListener('pointerlockerror', () => {
            this.pointerLocked = false;
        });
    }

    requestPointerLock(element) {
        if (!this.pointerLocked && element) {
            try {
                const promise = element.requestPointerLock();
                if (promise) {
                    promise.catch(e => {
                        console.warn('Pointer lock requires a direct user click. Show overlay.', e.message);
                        document.dispatchEvent(new Event('pointerlockchange'));
                    });
                }
                this.pointerLockRequested = true;
            } catch (e) {
                console.warn('Pointer lock error', e);
                document.dispatchEvent(new Event('pointerlockchange'));
            }
        }
    }

    exitPointerLock() {
        if (this.pointerLocked) {
            document.exitPointerLock();
        }
    }

    _setupTouch() {
        window.addEventListener('touchstart', e => {
            e.preventDefault();
            const t = e.touches[0];
            this.touch.active = true;
            this.touch.startX = t.clientX;
            this.touch.startY = t.clientY;
            this.touch.x = t.clientX;
            this.touch.y = t.clientY;
            this.mouse.clicked = true;
            this.mouse.x = t.clientX;
            this.mouse.y = t.clientY;
            if (t.clientX > window.innerWidth * 0.7) this.virtualButtons.dash = true;
            this.virtualJoystick.active = true;
        }, {passive:false});
        window.addEventListener('touchmove', e => {
            e.preventDefault();
            const t = e.touches[0];
            this.touch.x = t.clientX;
            this.touch.y = t.clientY;
            this.mouse.x = t.clientX;
            this.mouse.y = t.clientY;
            if (this.virtualJoystick.active) {
                const dx = t.clientX - this.touch.startX;
                const dy = t.clientY - this.touch.startY;
                const mag = Math.sqrt(dx*dx + dy*dy);
                const maxD = 60;
                this.virtualJoystick.magnitude = Math.min(mag/maxD, 1);
                if (mag > 5) {
                    this.virtualJoystick.dx = dx/mag;
                    this.virtualJoystick.dy = dy/mag;
                } else {
                    this.virtualJoystick.dx = 0;
                    this.virtualJoystick.dy = 0;
                }
            }
        }, {passive:false});
        window.addEventListener('touchend', () => {
            this.touch.active = false;
            this.virtualJoystick.active = false;
            this.virtualJoystick.dx = 0;
            this.virtualJoystick.dy = 0;
            this.virtualJoystick.magnitude = 0;
            this.virtualButtons.dash = false;
        });
    }

    getMovement() {
        let mx=0, my=0;
        if (this.keys[this.bindings.moveLeft] || this.keys['ArrowLeft'])  mx -= 1;
        if (this.keys[this.bindings.moveRight] || this.keys['ArrowRight']) mx += 1;
        if (this.keys[this.bindings.moveUp] || this.keys['ArrowUp'])    my += 1;
        if (this.keys[this.bindings.moveDown] || this.keys['ArrowDown'])  my -= 1;
        if (this.virtualJoystick.active && this.virtualJoystick.magnitude > 0.1) {
            mx = this.virtualJoystick.dx * this.virtualJoystick.magnitude;
            my = -this.virtualJoystick.dy * this.virtualJoystick.magnitude;
        }
        const l = Math.sqrt(mx*mx + my*my);
        if (l > 1) { mx /= l; my /= l; }
        return {x:mx, y:my};
    }

    getMouseDelta() {
        const d = { x:this.mouseDelta.x, y:this.mouseDelta.y };
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        return d;
    }

    isDashPressed() {
        return this.keysJustPressed['ShiftLeft'] || this.virtualButtons.dash;
    }

    isBoostPressed() { return !!this.keysJustPressed['KeyF']; }

    isBarrelRollLeft() { return !!this.keysJustPressed[this.bindings.moveLeft + '_DOUBLE']; }
    isBarrelRollRight() { return !!this.keysJustPressed[this.bindings.moveRight + '_DOUBLE']; }

    isEMPPressed() { return !!this.keysJustPressed[this.bindings.shield]; }
    isDropPressed() { return !!this.keysJustPressed['KeyE']; }

    isPausePressed() { return this.keysJustPressed[this.bindings.pause] || this.keysJustPressed['KeyP']; }
    isConfirmPressed() { return this.keysJustPressed['Enter'] || this.keysJustPressed['Space'] || this.mouse.clicked; }
    isKeyJustPressed(code) { return !!this.keysJustPressed[code]; }

    isVerticalUp() { return !!this.keys[this.bindings.flyUp]; }
    isVerticalDown() { return !!this.keys[this.bindings.flyDown]; }

    endFrame() {
        this.keysJustPressed = {};
        this.mouse.clicked = false;
        this.virtualButtons.dash = false;
    }
}
