export class ShapeTool {
    constructor(canvas, state, history, type = 'rect') {
        this.canvas = canvas;
        this.state = state;
        this.history = history;
        this.type = type;
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
        this.drawPreview(this.startPos, pos);
    }

    onMouseUp(pos) {
        if (!this.isDrawing || !pos) {
            this.isDrawing = false;
            return;
        }
        this.isDrawing = false;
        this.drawShape(this.startPos, pos);
        this.history.endStroke();
    }

    drawPreview(from, to) {
        if (!from || !to) return;
        const ctx = this.canvas.overlayCtx;
        ctx.strokeStyle = `rgb(${this.state.get('currentColor').slice(0,3).join(',')})`;
        ctx.lineWidth = 1;
        
        const scale = this.canvas.getOverlayScale();

        const x = Math.min(from.x, to.x) * scale.x;
        const y = Math.min(from.y, to.y) * scale.y;
        const w = (Math.abs(from.x - to.x) + 1) * scale.x;
        const h = (Math.abs(from.y - to.y) + 1) * scale.y;

        if (this.type === 'rect') {
            ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        } else {
            ctx.beginPath();
            ctx.ellipse(x + w/2, y + h/2, (w-1)/2, (h-1)/2, 0, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }

    drawShape(from, to) {
        if (!from || !to) return;
        const x1 = Math.min(from.x, to.x);
        const y1 = Math.min(from.y, to.y);
        const x2 = Math.max(from.x, to.x);
        const y2 = Math.max(from.y, to.y);
        const color = this.state.get('currentColor');

        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return;

        for (let y = y1; y <= y2; y++) {
            for (let x = x1; x <= x2; x++) {
                let inside = false;
                if (this.type === 'rect') {
                    if (x === x1 || x === x2 || y === y1 || y === y2) inside = true;
                } else {
                    const cx = (x1 + x2) / 2;
                    const cy = (y1 + y2) / 2;
                    const rx = (x2 - x1) / 2;
                    const ry = (y2 - y1) / 2;
                    const dx = (x - cx) / (rx || 1);
                    const dy = (y - cy) / (ry || 1);
                    const d = dx * dx + dy * dy;
                    if (d <= 1 && d >= 0.8) inside = true;
                }
                if (inside) this.canvas.setPixel(x, y, color);
            }
        }
    }
}
