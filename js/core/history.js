export class History {
    constructor(state) {
        this.state = state;
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = 30;
        this.strokeSnapshot = null;
    }

    beginStroke() {
        const layers = this.state.get('layers');
        this.strokeSnapshot = layers.map(layer => ({
            name: layer.name,
            pixels: layer.pixels.slice(),
            visible: layer.visible,
            opacity: layer.opacity,
            dirty: true
        }));
    }

    endStroke() {
        if (!this.strokeSnapshot) return;

        const layers = this.state.get('layers');
        const diffs = [];
        const hasChanges = layers.some((layer, i) => {
            const snapshot = this.strokeSnapshot[i];
            if (layer.name !== snapshot.name) return true;
            if (layer.visible !== snapshot.visible) return true;
            if (layer.opacity !== snapshot.opacity) return true;

            for (let j = 0; j < layer.pixels.length; j += 4) {
                if (layer.pixels[j] !== snapshot.pixels[j] ||
                    layer.pixels[j+1] !== snapshot.pixels[j+1] ||
                    layer.pixels[j+2] !== snapshot.pixels[j+2] ||
                    layer.pixels[j+3] !== snapshot.pixels[j+3]) {
                    return true;
                }
            }
            return false;
        });

        if (hasChanges) {
            this.undoStack.push(this.strokeSnapshot);
            if (this.undoStack.length > this.maxHistory) {
                this.undoStack.shift();
            }
            this.redoStack = [];
        }

        this.strokeSnapshot = null;
    }

    undo() {
        if (this.undoStack.length === 0) return;

        const layers = this.state.get('layers');
        this.redoStack.push(layers.map((layer, i) => ({
            name: layer.name,
            pixels: layer.pixels.slice(),
            visible: layer.visible,
            opacity: layer.opacity,
            dirty: true
        })));

        const prevSnapshot = this.undoStack.pop();
        this.restoreSnapshot(prevSnapshot);
    }

    redo() {
        if (this.redoStack.length === 0) return;

        const layers = this.state.get('layers');
        this.undoStack.push(layers.map((layer, i) => ({
            name: layer.name,
            pixels: layer.pixels.slice(),
            visible: layer.visible,
            opacity: layer.opacity,
            dirty: true
        })));

        const nextSnapshot = this.redoStack.pop();
        this.restoreSnapshot(nextSnapshot);
    }

    restoreSnapshot(snapshot) {
        const width = this.state.get('canvasWidth');
        const height = this.state.get('canvasHeight');
        this.state.set('layers', snapshot.map(s => {
            const offscreen = new OffscreenCanvas(width, height);
            const offscreenCtx = offscreen.getContext('2d');
            const imageData = new ImageData(s.pixels, width, height);
            offscreenCtx.putImageData(imageData, 0, 0);
            return {
                name: s.name,
                pixels: s.pixels,
                visible: s.visible,
                opacity: s.opacity,
                id: Date.now() + Math.random(),
                offscreen,
                offscreenCtx,
                dirty: false,
                scaledCanvas: null,
                lastZoom: null
            };
        }));
        if (window.app) {
            window.app.canvas.render();
            window.app.layersPanel.render();
        }
    }
}
