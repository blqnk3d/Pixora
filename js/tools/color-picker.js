export class ColorPickerTool {
    constructor(canvas, state, history) {
        this.canvas = canvas;
        this.state = state;
        this.history = history;
        this.previewPos = null;
        this.lastPreviewPos = null;
    }

    activate() {
        this.canvas.element.style.cursor = 'crosshair';
    }

    deactivate() {
        this.previewPos = null;
        this.clearPreview();
    }

    onMouseDown(pos) {
        this.isDrawing = true;
        this.pickColor(pos);
    }

    onMouseMove(pos) {
        this.previewPos = pos;
        if (this.isDrawing) {
            this.pickColor(pos);
        }
        this.drawPreview(pos);
    }

    onMouseUp() {
        this.isDrawing = false;
    }

    updatePreview(pos) {
        this.previewPos = pos;
    }

    clearPreview() {
        if (!this.lastPreviewPos) return;
        const ctx = this.canvas.ctx;
        const scale = this.canvas.getOverlayScale();
        const x = this.lastPreviewPos.x * scale.x;
        const y = this.lastPreviewPos.y * scale.y;
        ctx.clearRect(x + 6, y + 6, 16, 16);
        this.lastPreviewPos = null;
    }

    drawPreview(pos) {
        if (!pos) return;
        this.clearPreview();

        const layers = this.state.get('layers');
        const width = this.canvas.width;
        const scale = this.canvas.getOverlayScale();

        let color = null;
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (!layer.visible) continue;
            const idx = (pos.y * width + pos.x) * 4;
            if (layer.pixels[idx + 3] > 0) {
                color = [layer.pixels[idx], layer.pixels[idx + 1], layer.pixels[idx + 2]];
                break;
            }
        }
        if (!color) color = [255, 255, 255];

        const sz = 12;
        const x = pos.x * scale.x;
        const y = pos.y * scale.y;
        const ctx = this.canvas.ctx;

        ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
        ctx.fillRect(x + 8, y + 8, sz, sz);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 7, y + 7, sz + 2, sz + 2);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(x + 8, y + 8, sz, sz);

        this.lastPreviewPos = { x: pos.x, y: pos.y };
    }

    pickColor(pos) {
        const layers = this.state.get('layers');
        const width = this.canvas.width;
        
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (!layer.visible) continue;
            
            const idx = (pos.y * width + pos.x) * 4;
            if (layer.pixels[idx + 3] > 0) {
                const color = [
                    layer.pixels[idx],
                    layer.pixels[idx + 1],
                    layer.pixels[idx + 2],
                    layer.pixels[idx + 3]
                ];
                this.state.set('currentColor', color);
                this.state.addRecentColor(color);
                break;
            }
        }
    }
}
