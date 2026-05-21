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
        const brushSize = this.state.get('brushSize');

        ctx.beginPath();
        ctx.moveTo(from.x * scale.x + scale.x / 2, from.y * scale.y + scale.y / 2);
        ctx.lineTo(to.x * scale.x + scale.x / 2, to.y * scale.y + scale.y / 2);
        ctx.strokeStyle = `rgb(${this.state.get('currentColor').slice(0,3).join(',')})`;
        ctx.lineWidth = brushSize * scale.x;
        ctx.lineCap = this.state.get('brushShape') === 'circle' ? 'round' : 'square';
        ctx.stroke();
    }

    drawBrushPixel(pos) {
        const color = this.state.get('currentColor');
        const size = this.state.get('brushSize');
        const shape = this.state.get('brushShape') || 'square';
        const center = Math.floor(size / 2);

        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const x = pos.x + dx - center;
                const y = pos.y + dy - center;
                if (x >= 0 && y >= 0 && x < this.canvas.width && y < this.canvas.height) {
                    if (shape === 'circle') {
                        const distX = dx - center;
                        const distY = dy - center;
                        const radius = center + 0.5;
                        if (distX * distX + distY * distY > radius * radius) continue;
                    }
                    if (!window.app.hasSelection() || window.app.isPointInSelection(x, y)) {
                        this.canvas.setPixel(x, y, color);
                    }
                }
            }
        }
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
                this.drawBrushPixel({ x, y });
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
