export class LineTool {
    constructor(canvas, state, history) {
        this.canvas = canvas;
        this.state = state;
        this.history = history;
        this.isDrawing = false;
        this.startPos = null;
    }

    activate() { this.canvas.element.style.cursor = 'crosshair'; }
    deactivate() { this.isDrawing = false; }

    onMouseDown(pos) {
        this.isDrawing = true;
        this.startPos = pos;
        this.history.beginStroke();
    }

    onMouseMove(pos) {
        if (!this.isDrawing) return;
        this.canvas.render();
        this.drawLinePreview(this.startPos, pos);
    }

    onMouseUp(pos) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.drawLine(this.startPos, pos);
        this.history.endStroke();
    }

    drawLinePreview(from, to) {
        const ctx = this.canvas.overlayCtx;
        ctx.beginPath();
        ctx.moveTo(from.x * this.canvas.zoom, from.y * this.canvas.zoom);
        ctx.lineTo(to.x * this.canvas.zoom, to.y * this.canvas.zoom);
        ctx.strokeStyle = `rgb(${this.state.get('currentColor').slice(0,3).join(',')})`;
        ctx.lineWidth = this.state.get('brushSize') * this.canvas.zoom;
        ctx.stroke();
    }

    drawLine(from, to) {
        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);
        const sx = from.x < to.x ? 1 : -1;
        const sy = from.y < to.y ? 1 : -1;
        let err = dx - dy;

        let x = from.x;
        let y = from.y;

        while (true) {
            this.canvas.setPixel(x, y, this.state.get('currentColor'));
            if (x === to.x && y === to.y) break;
            let e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x += sx; }
            if (e2 < dx) { err += dx; y += sy; }
        }
    }
}
