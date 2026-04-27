export class State {
    constructor() {
        const retroFont = localStorage.getItem('prity-retro-font') === 'true';
        this.state = {
            canvasWidth: 32,
            canvasHeight: 32,
            zoom: 10,
            showGrid: true,
            currentTool: 'pencil',
            brushSize: 1,
            currentColor: [0, 0, 0, 255],
            backgroundColor: [0, 0, 0, 0],
            activeLayer: 0,
            layers: [],
            palette: [
                [0,0,0,255], [255,255,255,255], [255,0,0,255], [0,255,0,255],
                [0,0,255,255], [255,255,0,255], [255,0,255,255], [0,255,255,255],
                [128,128,128,255], [192,192,192,255], [128,0,0,255], [0,128,0,255],
                [0,0,128,255], [128,128,0,255], [128,0,128,255], [0,128,128,255]
            ],
            recentColors: [],
            retroFont: retroFont
        };
        this.listeners = new Map();

        if (retroFont) {
            document.body.classList.add('retro-font');
            const link = document.getElementById('retro-font-link');
            if (link) link.style.display = 'block';
        }
    }

    initCanvas(width, height) {
        this.state.canvasWidth = width;
        this.state.canvasHeight = height;
        this.state.layers = [this.createLayer('Layer 1')];
        this.state.activeLayer = 0;
    }

    createLayer(name) {
        const size = this.state.canvasWidth * this.state.canvasHeight * 4;
        const offscreen = new OffscreenCanvas(this.state.canvasWidth, this.state.canvasHeight);
        const offscreenCtx = offscreen.getContext('2d');
        return {
            name,
            pixels: new Uint8ClampedArray(size),
            visible: true,
            opacity: 1.0,
            id: Date.now() + Math.random(),
            offscreen,
            offscreenCtx,
            dirty: true
        };
    }

    get(key) { return this.state[key]; }
    set(key, value) {
        this.state[key] = value;
        this.emit(key, value);
    }

    on(key, fn) {
        if (!this.listeners.has(key)) this.listeners.set(key, []);
        this.listeners.get(key).push(fn);
    }

    off(key, fn) {
        const fns = this.listeners.get(key);
        if (fns) this.listeners.set(key, fns.filter(f => f !== fn));
    }

    emit(key, value) {
        const fns = this.listeners.get(key);
        if (fns) fns.forEach(fn => fn(value));
    }

    addRecentColor(color) {
        const key = color.join(',');
        this.state.recentColors = this.state.recentColors.filter(c => c.join(",") !== key).slice(0, 15);
        this.state.recentColors.unshift([...color]);
    }
}
