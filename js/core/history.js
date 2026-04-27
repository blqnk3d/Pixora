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
        this.strokeSnapshot = {
            canvasWidth: this.state.get('canvasWidth'),
            canvasHeight: this.state.get('canvasHeight'),
            layers: layers.map(layer => ({
                name: layer.name,
                pixels: layer.pixels.slice(),
                visible: layer.visible,
                opacity: layer.opacity,
                dirty: true
            }))
        };
    }

    endStroke() {
        if (!this.strokeSnapshot) return;

        const layers = this.state.get('layers');
        const snapshot = this.strokeSnapshot.layers;
        const diffs = [];
        const hasChanges = layers.some((layer, i) => {
            const snap = snapshot[i];
            if (layer.name !== snap.name) return true;
            if (layer.visible !== snap.visible) return true;
            if (layer.opacity !== snap.opacity) return true;

            for (let j = 0; j < layer.pixels.length; j += 4) {
                if (layer.pixels[j] !== snap.pixels[j] ||
                    layer.pixels[j+1] !== snap.pixels[j+1] ||
                    layer.pixels[j+2] !== snap.pixels[j+2] ||
                    layer.pixels[j+3] !== snap.pixels[j+3]) {
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
        this.redoStack.push({
            canvasWidth: this.state.get('canvasWidth'),
            canvasHeight: this.state.get('canvasHeight'),
            layers: layers.map(layer => ({
                name: layer.name,
                pixels: layer.pixels.slice(),
                visible: layer.visible,
                opacity: layer.opacity,
                dirty: true
            }))
        });

        const prevSnapshot = this.undoStack.pop();
        this.restoreSnapshot(prevSnapshot);
    }

    redo() {
        if (this.redoStack.length === 0) return;

        const layers = this.state.get('layers');
        this.undoStack.push({
            canvasWidth: this.state.get('canvasWidth'),
            canvasHeight: this.state.get('canvasHeight'),
            layers: layers.map(layer => ({
                name: layer.name,
                pixels: layer.pixels.slice(),
                visible: layer.visible,
                opacity: layer.opacity,
                dirty: true
            }))
        });

        const nextSnapshot = this.redoStack.pop();
        this.restoreSnapshot(nextSnapshot);
    }

    restoreSnapshot(snapshot) {
        const width = snapshot.canvasWidth;
        const height = snapshot.canvasHeight;
        this.state.set('canvasWidth', width);
        this.state.set('canvasHeight', height);
        this.state.set('layers', snapshot.layers.map(s => {
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
