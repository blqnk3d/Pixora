export class HealTool {
    constructor(canvas, state, history) {
        this.canvas = canvas;
        this.state = state;
        this.history = history;
        this.isDrawing = false;
        this.sourcePos = null;
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

    onMouseDown(pos, e) {
        if (e.ctrlKey) {
            this.sourcePos = pos;
            return;
        }

        if (!this.sourcePos) return;

        this.isDrawing = true;
        this.history.beginStroke();
        this.offset = {
            x: this.sourcePos.x - pos.x,
            y: this.sourcePos.y - pos.y
        };
        this.healArea(pos);
    }

    onMouseMove(pos, e) {
        this.previewPos = pos;
        if (!this.isDrawing || !pos) return;
        this.healArea(pos);
    }

    onMouseUp() {
        this.isDrawing = false;
        this.history.endStroke();
    }

    updatePreview(pos, e) {
        this.previewPos = pos;
    }

    healArea(pos) {
        if (!this.sourcePos) return;

        const size = this.state.get('brushSize');
        const center = Math.floor(size / 2);
        const width = this.canvas.width;
        const height = this.canvas.height;
        const intensity = 0.5; // Blending intensity

        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const x = pos.x + dx - center;
                const y = pos.y + dy - center;

                if (x >= 0 && y >= 0 && x < width && y < height) {
                    if (window.app.hasSelection() && !window.app.isPointInSelection(x, y)) continue;

                    const sx = x + this.offset.x;
                    const sy = y + this.offset.y;

                    if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
                        const sourceColor = this.canvas.getPixel(sx, sy);
                        const destColor = this.canvas.getPixel(x, y);
                        
                        if (sourceColor && destColor) {
                            const newColor = [
                                Math.round(destColor[0] * (1 - intensity) + sourceColor[0] * intensity),
                                Math.round(destColor[1] * (1 - intensity) + sourceColor[1] * intensity),
                                Math.round(destColor[2] * (1 - intensity) + sourceColor[2] * intensity),
                                Math.round(destColor[3] * (1 - intensity) + sourceColor[3] * intensity)
                            ];
                            this.canvas.setPixel(x, y, newColor);
                        }
                    }
                }
            }
        }
    }
}
