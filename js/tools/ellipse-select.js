export class EllipseSelectTool {
    constructor(canvas, state, history) {
        this.canvas = canvas;
        this.state = state;
        this.history = history;
        this.isSelecting = false;
        this.startPos = null;
        this.selection = null;
    }

    activate() {
        this.canvas.element.style.cursor = 'crosshair';
    }

    deactivate() {
        this.isSelecting = false;
        this.startPos = null;
    }

    onMouseDown(pos) {
        this.isSelecting = true;
        this.startPos = pos;
        this.selection = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
    }

    onMouseMove(pos) {
        if (!this.isSelecting || !pos) return;
        this.selection.x2 = pos.x;
        this.selection.y2 = pos.y;
        this.canvas.render();
    }

    onMouseUp() {
        this.isSelecting = false;
    }

    drawSelection() {
        if (!this.selection) return;
        const { x1, y1, x2, y2 } = this.selection;
        const zoom = this.canvas.zoom;
        const ctx = this.canvas.overlayCtx;

        const minX = Math.min(x1, x2) * zoom;
        const maxX = (Math.max(x1, x2) + 1) * zoom;
        const minY = Math.min(y1, y2) * zoom;
        const maxY = (Math.max(y1, y2) + 1) * zoom;
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const radiusX = (maxX - minX) / 2;
        const radiusY = (maxY - minY) / 2;

        ctx.lineWidth = 1;

        // Outer black border
        ctx.strokeStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Inner white dash
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);
    }

    getSelectedPixels() {
        if (!this.selection) return null;
        const { x1, y1, x2, y2 } = this.selection;
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;
        const pixels = new Uint8ClampedArray(width * height * 4);

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const radiusX = (maxX - minX + 1) / 2;
        const radiusY = (maxY - minY + 1) / 2;

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const dx = (x - centerX) / radiusX;
                const dy = (y - centerY) / radiusY;
                if (dx * dx + dy * dy <= 1) {
                    const srcIdx = (y * this.canvas.width + x) * 4;
                    const dstIdx = ((y - minY) * width + (x - minX)) * 4;
                    const layer = this.canvas.state.get('layers')[this.canvas.state.get('activeLayer')];
                    pixels[dstIdx] = layer.pixels[srcIdx];
                    pixels[dstIdx+1] = layer.pixels[srcIdx+1];
                    pixels[dstIdx+2] = layer.pixels[srcIdx+2];
                    pixels[dstIdx+3] = layer.pixels[srcIdx+3];
                }
            }
        }
        return { pixels, x: minX, y: minY, width, height };
    }
}
