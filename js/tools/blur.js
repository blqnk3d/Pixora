export class BlurTool {
    constructor(canvas, state, history) {
        this.canvas = canvas;
        this.state = state;
        this.history = history;
        this.isDrawing = false;
        this.previewPos = null;
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
        this.history.beginStroke();
        this.blurArea(pos);
    }

    onMouseMove(pos) {
        this.previewPos = pos;
        if (!this.isDrawing || !pos) return;
        this.blurArea(pos);
    }

    onMouseUp() {
        this.isDrawing = false;
        this.history.endStroke();
    }

    updatePreview(pos, e) {
        this.previewPos = pos;
    }

    blurArea(pos) {
        const size = this.state.get('brushSize');
        const intensity = (this.state.get('blurIntensity') || 50) / 100;
        const center = Math.floor(size / 2);
        const layerIdx = this.state.get('activeLayer');
        const layer = this.state.get('layers')[layerIdx];
        if (!layer) return;

        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Use a temporary buffer to avoid immediate feedback loop while blurring a single brush stroke
        // Actually, for real-time feel, we can just average with the current state.
        
        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const x = pos.x + dx - center;
                const y = pos.y + dy - center;

                if (x >= 0 && y >= 0 && x < width && y < height) {
                    if (window.app.hasSelection() && !window.app.isPointInSelection(x, y)) continue;

                    const avg = this.getAverageColor(x, y, 1);
                    const currentColor = this.canvas.getPixel(x, y);
                    
                    if (currentColor && avg) {
                        const newColor = [
                            Math.round(currentColor[0] * (1 - intensity) + avg[0] * intensity),
                            Math.round(currentColor[1] * (1 - intensity) + avg[1] * intensity),
                            Math.round(currentColor[2] * (1 - intensity) + avg[2] * intensity),
                            Math.round(currentColor[3] * (1 - intensity) + avg[3] * intensity)
                        ];
                        this.canvas.setPixel(x, y, newColor);
                    }
                }
            }
        }
    }

    getAverageColor(x, y, radius) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        const width = this.canvas.width;
        const height = this.canvas.height;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const color = this.canvas.getPixel(nx, ny);
                    if (color && color[3] > 0) {
                        r += color[0];
                        g += color[1];
                        b += color[2];
                        a += color[3];
                        count++;
                    }
                }
            }
        }

        if (count === 0) return null;
        return [r / count, g / count, b / count, a / count];
    }
}
