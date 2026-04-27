export class PencilTool {
    constructor(canvas, state, history) {
        this.canvas = canvas;
        this.state = state;
        this.history = history;
        this.isDrawing = false;
        this.lastPos = null;
        this.previewPos = null;
    }

    activate() {
        this.canvas.element.style.cursor = 'crosshair';
    }

    deactivate() {
        this.isDrawing = false;
        this.lastPos = null;
        this.previewPos = null;
        this.canvas.render();
    }

    onMouseDown(pos) {
        this.isDrawing = true;
        this.lastPos = pos;
        this.history.beginStroke();
        this.drawPixel(pos);
    }

    onMouseMove(pos) {
        this.previewPos = pos;
        if (!this.isDrawing || !pos) return;
        this.drawLine(this.lastPos, pos);
        this.lastPos = pos;
    }

    onMouseUp() {
        this.isDrawing = false;
        this.lastPos = null;
        this.history.endStroke();
    }

    updatePreview(pos, e) {
        // No hover preview - just store position for when render is called
    }

    drawPixel(pos) {
        const color = this.state.get('currentColor');
        const size = this.state.get('brushSize');
        const offset = Math.floor(size / 2);

        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const x = pos.x + dx - offset;
                const y = pos.y + dy - offset;
                if (x >= 0 && y >= 0 && x < this.canvas.width && y < this.canvas.height) {
                    if (!window.app.hasSelection() || window.app.isPointInSelection(x, y)) {
                        this.canvas.setPixel(x, y, color);
                    }
                }
            }
        }
    }

    drawLine(from, to) {
        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);
        const steps = Math.max(dx, dy, 1);

        for (let i = 0; i <= steps; i++) {
            const x = Math.round(from.x + (to.x - from.x) * (i / steps));
            const y = Math.round(from.y + (to.y - from.y) * (i / steps));
            this.drawPixel({ x, y });
        }
    }
}
