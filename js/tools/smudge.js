export class SmudgeTool {
    constructor(canvas, state, history) {
        this.canvas = canvas;
        this.state = state;
        this.history = history;
        this.isDrawing = false;
        this.previewPos = null;
        this.capturedColors = null;
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
        this.captureArea(pos);
    }

    onMouseMove(pos) {
        this.previewPos = pos;
        if (!this.isDrawing || !pos) return;
        this.smudgeArea(pos);
        this.captureArea(pos); // Refresh capture for next step
    }

    onMouseUp() {
        this.isDrawing = false;
        this.capturedColors = null;
        this.history.endStroke();
    }

    updatePreview(pos, e) {
        this.previewPos = pos;
    }

    captureArea(pos) {
        const size = this.state.get('brushSize');
        const center = Math.floor(size / 2);
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.capturedColors = [];
        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const x = pos.x + dx - center;
                const y = pos.y + dy - center;
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    this.capturedColors.push({ x: dx, y: dy, color: this.canvas.getPixel(x, y) });
                }
            }
        }
    }

    smudgeArea(pos) {
        if (!this.capturedColors) return;

        const size = this.state.get('brushSize');
        const center = Math.floor(size / 2);
        const intensity = (this.state.get('smudgeIntensity') || 50) / 100;
        const width = this.canvas.width;
        const height = this.canvas.height;

        this.capturedColors.forEach(cap => {
            const x = pos.x + cap.x - center;
            const y = pos.y + cap.y - center;

            if (x >= 0 && x < width && y >= 0 && y < height) {
                if (window.app.hasSelection() && !window.app.isPointInSelection(x, y)) return;

                const currentColor = this.canvas.getPixel(x, y);
                if (currentColor && cap.color) {
                    const newColor = [
                        Math.round(currentColor[0] * (1 - intensity) + cap.color[0] * intensity),
                        Math.round(currentColor[1] * (1 - intensity) + cap.color[1] * intensity),
                        Math.round(currentColor[2] * (1 - intensity) + cap.color[2] * intensity),
                        Math.round(currentColor[3] * (1 - intensity) + cap.color[3] * intensity)
                    ];
                    this.canvas.setPixel(x, y, newColor);
                }
            }
        });
    }
}
