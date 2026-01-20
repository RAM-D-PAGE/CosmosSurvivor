export class Input {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, isDown: false };

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }

    onKeyDown(e) {
        this.keys[e.code] = true;
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
    }

    onMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }

    onMouseDown(e) {
        if (e.button === 0) { // Left click
            this.mouse.isDown = true;
        }
    }

    onMouseUp(e) {
        if (e.button === 0) {
            this.mouse.isDown = false;
        }
    }

    isKeyPressed(code) {
        return !!this.keys[code];
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    isMouseDown() {
        return this.mouse.isDown;
    }
}
