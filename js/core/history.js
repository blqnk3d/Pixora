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
            pixels: new Uint8ClampedArray(layer.pixels),
            visible: layer.visible,
            opacity: layer.opacity,
            offscreen: layer.offscreen,
            offscreenCtx: layer.offscreenCtx,
            dirty: true
        }));
    }

    endStroke() {
        if (!this.strokeSnapshot) return;

        const layers = this.state.get('layers');
        const currentSnapshot = layers.map(layer => ({
            name: layer.name,
            pixels: new Uint8ClampedArray(layer.pixels),
            visible: layer.visible,
            opacity: layer.opacity,
            offscreen: layer.offscreen,
            offscreenCtx: layer.offscreenCtx,
            dirty: true
        }));

        const hasChanges = currentSnapshot.some((layer, i) => {
            if (layer.name !== this.strokeSnapshot[i].name) return true;
            if (layer.visible !== this.strokeSnapshot[i].visible) return true;
            if (layer.opacity !== this.strokeSnapshot[i].opacity) return true;
            return layer.pixels.some((val, j) => val !== this.strokeSnapshot[i].pixels[j]);
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
        const currentSnapshot = layers.map(layer => ({
            name: layer.name,
            pixels: new Uint8ClampedArray(layer.pixels),
            visible: layer.visible,
            opacity: layer.opacity,
            offscreen: layer.offscreen,
            offscreenCtx: layer.offscreenCtx,
            dirty: true
        }));

        this.redoStack.push(currentSnapshot);

        const prevSnapshot = this.undoStack.pop();
        this.restoreSnapshot(prevSnapshot);
    }

    redo() {
        if (this.redoStack.length === 0) return;

        const layers = this.state.get('layers');
        const currentSnapshot = layers.map(layer => ({
            name: layer.name,
            pixels: new Uint8ClampedArray(layer.pixels),
            visible: layer.visible,
            opacity: layer.opacity,
            offscreen: layer.offscreen,
            offscreenCtx: layer.offscreenCtx,
            dirty: true
        }));

        this.undoStack.push(currentSnapshot);

        const nextSnapshot = this.redoStack.pop();
        this.restoreSnapshot(nextSnapshot);
    }

    restoreSnapshot(snapshot) {
        const layers = snapshot.map(s => ({
            name: s.name,
            pixels: s.pixels,
            visible: s.visible,
            opacity: s.opacity,
            id: Date.now() + Math.random(),
            offscreen: s.offscreen,
            offscreenCtx: s.offscreenCtx,
            dirty: true
        }));
        this.state.set('layers', layers);
        if (window.app) {
            window.app.canvas.render();
            window.app.layersPanel.render();
        }
    }
}
