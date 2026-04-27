export class EraserTool {
    constructor(canvas, state) {
        this.canvas = canvas;
        this.state = state;
        this.isDrawing = false;
        this.lastPos = null;
    }

    activate() {
        this.canvas.element.style.cursor = 'cell';
    }

    deactivate() {
        this.isDrawing = false;
        this.lastPos = null;
    }

    onMouseDown(pos) {
        this.isDrawing = true;
        this.lastPos = pos;
        window.app.history.beginStroke();
        this.erasePixel(pos);
    }

    onMouseMove(pos) {
        if (!this.isDrawing || !pos) return;
        this.eraseLine(this.lastPos, pos);
        this.lastPos = pos;
        this.canvas.render();
    }

    onMouseUp() {
        this.isDrawing = false;
        this.lastPos = null;
        window.app.history.endStroke();
    }

    erasePixel(pos) {
        const size = this.state.get('brushSize');
        const transparent = [0, 0, 0, 0];

        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const x = pos.x + dx;
                const y = pos.y + dy;
                if (x >= 0 && y >= 0 && x < this.canvas.width && y < this.canvas.height) {
                    this.canvas.setPixel(x, y, transparent);
                }
            }
        }
    }

    eraseLine(from, to) {
        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);
        const steps = Math.max(dx, dy, 1);

        for (let i = 0; i <= steps; i++) {
            const x = Math.round(from.x + (to.x - from.x) * (i / steps));
            const y = Math.round(from.y + (to.y - from.y) * (i / steps));
            this.erasePixel({ x, y });
        }
    }
}
