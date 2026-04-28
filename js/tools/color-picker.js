export class ColorPickerTool {
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
        this.previewPos = null;
    }

    onMouseDown(pos) {
        this.pickColor(pos);
    }

    onMouseMove(pos) {
        this.previewPos = pos;
        if (this.isDrawing) {
            this.pickColor(pos);
        }
    }

    onMouseUp() {
        this.isDrawing = false;
    }

    updatePreview(pos) {
        this.previewPos = pos;
    }

    pickColor(pos) {
        const layers = this.state.get('layers');
        const width = this.canvas.width;
        
        // Pick from top visible layer to bottom
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
