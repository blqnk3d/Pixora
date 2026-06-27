export class BrightenTool {
    constructor(canvas, state, history) {
        this.canvas = canvas;
        this.state = state;
        this.history = history;
        this.isDrawing = false;
        this.previewPos = null;
        this.shiftHeld = false;
    }

    activate() {
        this.canvas.element.style.cursor = 'crosshair';
    }

    deactivate() {
        this.isDrawing = false;
        this.previewPos = null;
        this.canvas.render();
    }

    onMouseDown(pos) {
        this.isDrawing = true;
        this.shiftHeld = false;
        this.history.beginStroke();
        this.brightenArea(pos);
    }

    onMouseMove(pos, e) {
        this.previewPos = pos;
        this.shiftHeld = e && e.shiftKey;
        if (!this.isDrawing || !pos) return;
        this.brightenArea(pos);
    }

    onMouseUp() {
        this.isDrawing = false;
        this.shiftHeld = false;
        this.history.endStroke();
    }

    updatePreview(pos, e) {
        this.previewPos = pos;
    }

    brightenArea(pos) {
        const size = this.state.get('brushSize');
        const intensity = (this.state.get('brightenIntensity') || 10) / 100;
        const direction = this.shiftHeld ? -1 : 1;
        const center = Math.floor(size / 2);
        const layerIdx = this.state.get('activeLayer');
        const layer = this.state.get('layers')[layerIdx];
        if (!layer) return;

        const width = this.canvas.width;
        const height = this.canvas.height;
        const amount = intensity * 255 * direction;

        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const x = pos.x + dx - center;
                const y = pos.y + dy - center;

                if (x >= 0 && y >= 0 && x < width && y < height) {
                    if (window.app.hasSelection() && !window.app.isPointInSelection(x, y)) continue;

                    const color = this.canvas.getPixel(x, y);
                    if (color && color[3] > 0) {
                        this.canvas.setPixel(x, y, [
                            Math.max(0, Math.min(255, Math.round(color[0] + amount))),
                            Math.max(0, Math.min(255, Math.round(color[1] + amount))),
                            Math.max(0, Math.min(255, Math.round(color[2] + amount))),
                            color[3]
                        ]);
                    }
                }
            }
        }
    }
}
