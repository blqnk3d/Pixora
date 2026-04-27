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
import { MagicSelectTool } from './tools/magic-select.js';
import { EllipseSelectTool } from './tools/ellipse-select.js';

class App {
    constructor() {
        this.state = new State();
        this.history = new History(this.state);
        this.canvas = new CanvasEngine('pixel-canvas', this.state, this.history);

        this.tools = {
            pencil: new PencilTool(this.canvas, this.state, this.history),
            eraser: new EraserTool(this.canvas, this.state, this.history),
            fill: new FillTool(this.canvas, this.state, this.history),
            selector: new SelectorTool(this.canvas, this.state, this.history),
            move: new TransformTool(this.canvas, this.state, this.history),
            text: new TextTool(this.canvas, this.state, this.history),
            magicSelect: new MagicSelectTool(this.canvas, this.state, this.history),
            ellipseSelect: new EllipseSelectTool(this.canvas, this.state, this.history)
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

    deselectAll() {
        if (this.tools.selector) this.tools.selector.selection = null;
        if (this.tools.magicSelect) this.tools.magicSelect.selection = null;
        if (this.tools.ellipseSelect) this.tools.ellipseSelect.selection = null;
        this.canvas.render();
    }

    isPointInSelection(x, y) {
        const selector = this.tools.selector;
        const magicSelect = this.tools.magicSelect;
        const ellipseSelect = this.tools.ellipseSelect;

        if (selector?.selection) {
            const { x1, y1, x2, y2 } = selector.selection;
            const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) return true;
        }

        if (magicSelect?.selection) {
            const { x1, y1, x2, y2, mask } = magicSelect.selection;
            if (x >= x1 && x <= x2 && y >= y1 && y <= y2 && mask?.[y * this.canvas.width + x]) return true;
        }

        if (ellipseSelect?.selection) {
            const { x1, y1, x2, y2 } = ellipseSelect.selection;
            const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const radiusX = (maxX - minX + 1) / 2;
            const radiusY = (maxY - minY + 1) / 2;
            const dx = (x - centerX) / radiusX;
            const dy = (y - centerY) / radiusY;
            if (dx * dx + dy * dy <= 1) return true;
        }

        return false;
    }

    hasSelection() {
        return !!(this.tools.selector?.selection || this.tools.magicSelect?.selection || this.tools.ellipseSelect?.selection);
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
                    if (pos) {
                        this.currentTool.onMouseMove(pos, e);
                        if (this.currentTool.isDrawing || (this.currentTool.isSelecting && this.currentTool.selection)) {
                            this.canvas.render();
                        }
                    }
                    if (this.currentTool.updatePreview && !this.currentTool.isDrawing && !this.currentTool.isSelecting) {
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
                    this.canvas.render();
                    break;
                case 'y':
                    e.preventDefault();
                    this.history.redo();
                    this.canvas.render();
                    break;
                case 'a':
                    e.preventDefault();
                    if (this.currentTool === this.tools.selector) {
                        this.tools.selector.selectAll();
                    }
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
                case 'w': this.selectTool('magicSelect'); break;
                case 'o': this.selectTool('ellipseSelect'); break;
                case '[': this.state.set('brushSize', Math.max(1, this.state.get('brushSize') - 2)); break;
                case ']': this.state.set('brushSize', Math.min(7, this.state.get('brushSize') + 2)); break;
                case 'escape': this.deselectAll(); break;
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
