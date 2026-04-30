export class LassoSelectTool {
    constructor(canvas, state, history) {
        this.canvas = canvas;
        this.state = state;
        this.history = history;
        this.isSelecting = false;
        this.path = [];
        this.selection = null;
    }

    activate() {
        this.canvas.element.style.cursor = 'crosshair';
    }

    deactivate() {
        this.isSelecting = false;
        this.path = [];
    }

    onMouseDown(pos) {
        this.isSelecting = true;
        this.path = [pos];
        this.selection = null;
    }

    onMouseMove(pos) {
        if (!this.isSelecting || !pos) return;
        const last = this.path[this.path.length - 1];
        if (last.x !== pos.x || last.y !== pos.y) {
            this.path.push(pos);
            this.canvas.render();
        }
    }

    onMouseUp() {
        if (this.path.length < 3) {
            this.path = [];
            this.isSelecting = false;
            this.selection = null;
            return;
        }

        this.isSelecting = false;
        this.selection = this.createSelectionFromPath();
        this.path = [];
        this.canvas.render();
    }

    createSelectionFromPath() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const mask = new Uint8Array(width * height);
        
        let minX = width, minY = height, maxX = 0, maxY = 0;
        this.path.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });

        // Use a temporary canvas to fill the polygon and read back the mask
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.closePath();
        ctx.fill();

        const imageData = ctx.getImageData(0, 0, width, height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            if (imageData.data[i + 3] > 128) {
                mask[i / 4] = 1;
            }
        }

        return { x1: minX, y1: minY, x2: maxX, y2: maxY, mask };
    }

    drawSelection() {
        const ctx = this.canvas.overlayCtx;
        const zoom = this.canvas.zoom;

        if (this.isSelecting && this.path.length > 0) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.path[0].x * zoom + zoom / 2, this.path[0].y * zoom + zoom / 2);
            for (let i = 1; i < this.path.length; i++) {
                ctx.lineTo(this.path[i].x * zoom + zoom / 2, this.path[i].y * zoom + zoom / 2);
            }
            ctx.stroke();
            return;
        }

        if (!this.selection) return;

        const width = this.canvas.width;
        const { x1, y1, x2, y2, mask } = this.selection;

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(x1 * zoom + 0.5, y1 * zoom + 0.5, (x2 - x1 + 1) * zoom - 1, (y2 - y1 + 1) * zoom - 1);
        
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x1 * zoom + 0.5, y1 * zoom + 0.5, (x2 - x1 + 1) * zoom - 1, (y2 - y1 + 1) * zoom - 1);
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let y = y1; y <= y2; y++) {
            for (let x = x1; x <= x2; x++) {
                if (mask[y * width + x]) {
                    ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
                }
            }
        }
    }

    getSelectedPixels() {
        if (!this.selection) return null;
        const { x1, y1, x2, y2, mask } = this.selection;
        const width = x2 - x1 + 1;
        const height = y2 - y1 + 1;
        const pixels = new Uint8ClampedArray(width * height * 4);
        const layer = this.state.get('layers')[this.state.get('activeLayer')];

        for (let y = y1; y <= y2; y++) {
            for (let x = x1; x <= x2; x++) {
                if (mask[y * this.canvas.width + x]) {
                    const srcIdx = (y * this.canvas.width + x) * 4;
                    const dstIdx = ((y - y1) * width + (x - x1)) * 4;
                    pixels[dstIdx] = layer.pixels[srcIdx];
                    pixels[dstIdx+1] = layer.pixels[srcIdx+1];
                    pixels[dstIdx+2] = layer.pixels[srcIdx+2];
                    pixels[dstIdx+3] = layer.pixels[srcIdx+3];
                }
            }
        }
        return { pixels, x: x1, y: y1, width, height };
    }
}
