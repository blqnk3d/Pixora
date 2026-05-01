export class AdjustTool {
    constructor(canvas, state, history) {
        this.canvas = canvas;
        this.state = state;
        this.history = history;
        this.previewPos = null;
    }

    activate() {
        this.canvas.element.style.cursor = 'crosshair';
    }

    deactivate() {
        this.canvas.render();
    }

    onMouseDown(pos) {
        this.isDrawing = true;
        this.history.beginStroke();
        this.adjustArea(pos);
    }

    onMouseMove(pos) {
        this.previewPos = pos;
        if (!this.isDrawing || !pos) return;
        this.adjustArea(pos);
    }

    onMouseUp() {
        this.isDrawing = false;
        this.history.endStroke();
    }

    adjustArea(pos) {
        const size = this.state.get('brushSize');
        const brightness = (this.state.get('brightness') || 0) / 100; // -1 to 1 range
        const contrast = (this.state.get('contrast') || 100) / 100; // 0 to 2 range
        const center = Math.floor(size / 2);
        
        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const x = pos.x + dx - center;
                const y = pos.y + dy - center;
                if (x >= 0 && x < this.canvas.width && y >= 0 && y < this.canvas.height) {
                    const color = this.canvas.getPixel(x, y);
                    if (color && color[3] > 0) {
                        let [r, g, b, a] = color;
                        
                        // Apply Contrast
                        r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
                        g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
                        b = ((b / 255 - 0.5) * contrast + 0.5) * 255;
                        
                        // Apply Brightness
                        r += brightness * 255;
                        g += brightness * 255;
                        b += brightness * 255;

                        this.canvas.setPixel(x, y, [
                            Math.max(0, Math.min(255, r)),
                            Math.max(0, Math.min(255, g)),
                            Math.max(0, Math.min(255, b)),
                            a
                        ]);
                    }
                }
            }
        }
    }
}
