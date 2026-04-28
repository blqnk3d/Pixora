export class SelectorTool {
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

    selectAll() {
        this.selection = {
            x1: 0, y1: 0,
            x2: this.canvas.width - 1,
            y2: this.canvas.height - 1
        };
        this.canvas.render();
    }

    drawSelection() {
        if (!this.selection) return;
        const { x1, y1, x2, y2 } = this.selection;
        const ctx = this.canvas.ctx;
        const offset = this.canvas.selectionOffset || 0;

        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        ctx.lineWidth = 1;
        
        // White dash
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([3, 3]);
        ctx.lineDashOffset = -offset;
        ctx.strokeRect(minX + 0.5, minY + 0.5, maxX - minX, maxY - minY);
        
        // Black dash (offset)
        ctx.strokeStyle = '#000000';
        ctx.lineDashOffset = -offset + 3;
        ctx.strokeRect(minX + 0.5, minY + 0.5, maxX - minX, maxY - minY);
        
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
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
        const canvasWidth = this.canvas.width;
        const activeLayer = this.state.get('activeLayer');
        const layer = this.state.get('layers')[activeLayer];
        const layerPixels = layer.pixels;

        for (let y = minY; y <= maxY; y++) {
            const rowOffset = y * canvasWidth;
            const dstRowOffset = (y - minY) * width;
            for (let x = minX; x <= maxX; x++) {
                const srcIdx = (rowOffset + x) * 4;
                const dstIdx = (dstRowOffset + (x - minX)) * 4;
                pixels[dstIdx] = layerPixels[srcIdx];
                pixels[dstIdx+1] = layerPixels[srcIdx+1];
                pixels[dstIdx+2] = layerPixels[srcIdx+2];
                pixels[dstIdx+3] = layerPixels[srcIdx+3];
            }
        }
        return { pixels, x: minX, y: minY, width, height };
    }
}
