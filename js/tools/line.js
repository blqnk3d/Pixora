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
        if (!this.isDrawing || !pos) {
            this.isDrawing = false;
            return;
        }
        this.isDrawing = false;
        this.drawLine(this.startPos, pos);
        this.history.endStroke();
    }

    drawLinePreview(from, to) {
        if (!from || !to) return;
        const ctx = this.canvas.overlayCtx;
        const scale = this.canvas.getOverlayScale();

        ctx.beginPath();
        ctx.moveTo(from.x * scale.x + scale.x / 2, from.y * scale.y + scale.y / 2);
        ctx.lineTo(to.x * scale.x + scale.x / 2, to.y * scale.y + scale.y / 2);
        ctx.strokeStyle = `rgb(${this.state.get('currentColor').slice(0,3).join(',')})`;
        ctx.lineWidth = this.state.get('brushSize') * scale.x;
        ctx.stroke();
    }

    drawLine(from, to) {
        if (!from || !to) return;
        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);
        
        if (isNaN(dx) || isNaN(dy)) return;

        const sx = from.x < to.x ? 1 : -1;
        const sy = from.y < to.y ? 1 : -1;
        let err = dx - dy;

        let x = from.x;
        let y = from.y;

        while (true) {
            if (!isNaN(x) && !isNaN(y)) {
                this.canvas.setPixel(x, y, this.state.get('currentColor'));
            }
            if (x === to.x && y === to.y) break;
            let e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x += sx; }
            if (e2 < dx) { err += dx; y += sy; }
            
            // Safety break to prevent infinite loops if coordinates are weird
            if (Math.abs(x - from.x) > 4096 || Math.abs(y - from.y) > 4096) break;
        }
    }
}
