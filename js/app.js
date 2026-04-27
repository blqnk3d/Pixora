import { CanvasEngine } from './core/canvas.js';
import { State } from './core/state.js';
import { History } from './core/history.js';
import { MenuBar } from './ui/menu.js';
import { Toolbar } from './ui/toolbar.js';
import { ColorPanel } from './ui/colorpicker-simple.js';
import { LayersPanel } from './ui/layers.js';
import { StatusBar } from './ui/statusbar.js';
import { Exporter } from './io/exporter.js';
import { Importer } from './io/importer.js';
import { PencilTool } from './tools/pencil.js';
import { EraserTool } from './tools/eraser.js';
import { FillTool } from './tools/fill.js';
import { SelectorTool } from './tools/selector.js';
import { TransformTool } from './tools/transform.js';
import { TextTool } from './tools/text.js';

class App {
    constructor() {
        this.state = new State();
        this.history = new History(this.state);
        this.canvas = new CanvasEngine('pixel-canvas', this.state, this.history);

        this.tools = {
            pencil: new PencilTool(this.canvas, this.state),
            eraser: new EraserTool(this.canvas, this.state),
            fill: new FillTool(this.canvas, this.state),
            selector: new SelectorTool(this.canvas, this.state, this.history),
            move: new TransformTool(this.canvas, this.state, this.history),
            text: new TextTool(this.canvas, this.state, this.history)
        };

        this.currentTool = this.tools.pencil;
        this.isPanning = false;
        this.panStart = null;
        this.scrollStart = null;

        this.menu = new MenuBar(this);
        this.toolbar = new Toolbar(this);
        this.colorPanel = new ColorPanel(this);
        this.layersPanel = new LayersPanel(this);
        this.statusBar = new StatusBar(this);
        this.exporter = new Exporter(this);
        this.importer = new Importer(this);

        this.init();
    }

    init() {
        this.state.initCanvas(32, 32);
        this.selectTool('pencil');
        this.bindEvents();
        this.canvas.render();
        this.layersPanel.render();
        this.statusBar.render();
    }

    selectTool(name) {
        if (this.currentTool && this.currentTool.deactivate) {
            this.currentTool.deactivate();
        }
        this.currentTool = this.tools[name];
        if (this.currentTool && this.currentTool.activate) {
            this.currentTool.activate();
        }
        this.toolbar.updateActive(name);
        this.state.set('currentTool', name);
    }

    bindEvents() {
        const canvasEl = this.canvas.element;
        const container = document.getElementById('canvas-container');

        canvasEl.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (e.button === 1) {
                this.isPanning = true;
                this.panStart = { x: e.clientX, y: e.clientY };
                this.scrollStart = { x: container.scrollLeft, y: container.scrollTop };
                canvasEl.style.cursor = 'grab';
            } else {
                const pos = this.canvas.getPixelPosition(e);
                if (pos) {
                    this.currentTool.onMouseDown(pos, e);
                }
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                const dx = e.clientX - this.panStart.x;
                const dy = e.clientY - this.panStart.y;
                container.scrollLeft = this.scrollStart.x - dx;
                container.scrollTop = this.scrollStart.y - dy;
            } else {
                if (this.currentTool && this.currentTool.onMouseMove) {
                    const pos = this.canvas.getPixelPosition(e);
                    this.statusBar.updatePosition(pos);
                    if (pos && this.currentTool.isDrawing) {
                        this.currentTool.onMouseMove(pos, e);
                        this.canvas.render();
                    }
                    if (this.currentTool.updatePreview) {
                        this.currentTool.updatePreview(pos, e);
                    }
                }
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 1 && this.isPanning) {
                this.isPanning = false;
                canvasEl.style.cursor = '';
            } else {
                if (this.currentTool && this.currentTool.onMouseUp) {
                    this.currentTool.onMouseUp(e);
                    this.canvas.render();
                }
            }
        });

        canvasEl.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY > 0) {
                    this.canvas.zoomOut();
                } else {
                    this.canvas.zoomIn();
                }
            }
        });

        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        container.addEventListener('scroll', () => {
            this.statusBar.update();
        });

        document.body.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.importer.loadFile(file);
            }
        });
    }

    onKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    this.exporter.savePNG();
                    break;
                case 'o':
                    e.preventDefault();
                    this.importer.openFile();
                    break;
                case 'n':
                    e.preventDefault();
                    this.menu.newFileDialog();
                    break;
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) this.history.redo();
                    else this.history.undo();
                    break;
                case 'y':
                    e.preventDefault();
                    this.history.redo();
                    break;
                case 'a':
                    e.preventDefault();
                    this.tools.selector.selectAll(this.canvas);
                    break;
            }
        } else {
            switch (e.key.toLowerCase()) {
                case 'b': this.selectTool('pencil'); break;
                case 'e': this.selectTool('eraser'); break;
                case 'g': this.selectTool('fill'); break;
                case 'm': this.selectTool('selector'); break;
                case 'v': this.selectTool('move'); break;
                case 't': this.selectTool('text'); break;
                case '[': this.state.set('brushSize', Math.max(1, this.state.get('brushSize') - 2)); break;
                case ']': this.state.set('brushSize', Math.min(7, this.state.get('brushSize') + 2)); break;
            }
        }
    }

    updateUI() {
        this.canvas.render();
        this.layersPanel.render();
        this.statusBar.update();
    }
}

const app = new App();
window.app = app;