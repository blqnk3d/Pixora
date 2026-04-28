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
        const selectionTools = ['selector', 'magicSelect', 'ellipseSelect'];
        if (selectionTools.includes(name)) {
            this.deselectAll();
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
        const self = this;

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

        document.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                const dx = (e.clientX - this.panStart.x) * 1.5;
                const dy = (e.clientY - this.panStart.y) * 1.5;
                container.scrollLeft = this.scrollStart.x + dx;
                container.scrollTop = this.scrollStart.y + dy;
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

        window.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const mouseX = e.clientX;
                const mouseY = e.clientY;
                if (e.deltaY > 0) {
                    self.canvas.zoomOut(mouseX, mouseY);
                } else {
                    self.canvas.zoomIn(mouseX, mouseY);
                }
            }
        });

        document.addEventListener('keydown', (e) => this.onKeyDown(e));

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
                case 'c':
                    e.preventDefault();
                    this.copySelection();
                    break;
                case 'x':
                    e.preventDefault();
                    this.cutSelection();
                    break;
                case 'v':
                    e.preventDefault();
                    this.pasteSelection();
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
                case '[':
                    if (this.state.get('currentTool') === 'magicSelect') {
                        this.state.set('magicWandTolerance', Math.max(0, this.state.get('magicWandTolerance') - 5));
                    } else {
                        this.state.set('brushSize', Math.max(1, this.state.get('brushSize') - 2));
                    }
                    break;
                case ']':
                    if (this.state.get('currentTool') === 'magicSelect') {
                        this.state.set('magicWandTolerance', Math.min(255, this.state.get('magicWandTolerance') + 5));
                    } else {
                        this.state.set('brushSize', Math.min(7, this.state.get('brushSize') + 2));
                    }
                    break;
                case 'escape': 
                    this.deselectAll(); 
                    if (this.tools.move?.cancelMove) {
                        this.tools.move.cancelMove();
                    }
                    break;
                case 'delete':
                    e.preventDefault();
                    this.deleteSelection();
                    break;
                case 'enter':
                    e.preventDefault();
                    if (this.tools.move?.approveMove) {
                        this.tools.move.approveMove();
                    }
                    break;
            }
        }
    }

    copySelection() {
        const sel = this.getActiveSelection();
        if (!sel) return;
        
        let pixels, x, y, width, height;
        const tool = this.getSelectionTool();
        
        if (tool === 'selector' || tool === 'ellipseSelect') {
            const { x1, y1, x2, y2 } = this.tools.selector?.selection || this.tools.ellipseSelect?.selection;
            x = Math.min(x1, x2);
            y = Math.min(y1, y2);
            width = Math.abs(x2 - x1) + 1;
            height = Math.abs(y2 - y1) + 1;
            pixels = this.getSelectedPixels(x, y, width, height);
        } else if (tool === 'magicSelect') {
            const selData = this.tools.magicSelect.getSelectedPixels();
            if (!selData) return;
            x = selData.x;
            y = selData.y;
            width = selData.width;
            height = selData.height;
            pixels = selData.pixels;
        }
        
        if (pixels && width && height) {
            this.clipboard = { pixels, x, y, width, height };
        }
    }

    cutSelection() {
        const sel = this.getActiveSelection();
        if (!sel) return;
        
        this.copySelection();
        this.deleteSelection();
    }

    pasteSelection() {
        if (!this.clipboard) return;
        
        var layers = this.state.get('layers');
        var newName = 'Pasted ' + (layers.length + 1);
        layers.push(this.state.createLayer(newName));
        var targetIdx = layers.length - 1;
        this.state.set('layers', layers);
        this.state.set('activeLayer', targetIdx);
        this.layersPanel.render();
        
        var layer = layers[targetIdx];
        var clipboard = this.clipboard;
        var canvasWidth = this.canvas.width;
        
        for (var py = 0; py < clipboard.height; py++) {
            for (var px = 0; px < clipboard.width; px++) {
                var dstX = clipboard.x + px;
                var dstY = clipboard.y + py;
                if (dstX >= 0 && dstX < canvasWidth && dstY >= 0 && dstY < this.canvas.height) {
                    var srcIdx = (py * clipboard.width + px) * 4;
                    var dstIdx = (dstY * canvasWidth + dstX) * 4;
                    if (clipboard.pixels[srcIdx + 3] > 0) {
                        layer.pixels[dstIdx] = clipboard.pixels[srcIdx];
                        layer.pixels[dstIdx + 1] = clipboard.pixels[srcIdx + 1];
                        layer.pixels[dstIdx + 2] = clipboard.pixels[srcIdx + 2];
                        layer.pixels[dstIdx + 3] = clipboard.pixels[srcIdx + 3];
                    }
                }
            }
        }
        layer.dirty = true;
        this.canvas.render();
    }

    deleteSelection() {
        const sel = this.getActiveSelection();
        if (!sel) return;
        
        const tool = this.getSelectionTool();
        let minX, minY, maxX, maxY;
        
        if (tool === 'selector' || tool === 'ellipseSelect') {
            const s = this.tools.selector?.selection || this.tools.ellipseSelect?.selection;
            minX = Math.min(s.x1, s.x2);
            minY = Math.min(s.y1, s.y2);
            maxX = Math.max(s.x1, s.x2);
            maxY = Math.max(s.y1, s.y2);
        } else if (tool === 'magicSelect') {
            const s = this.tools.magicSelect.selection;
            minX = s.x1;
            minY = s.y1;
            maxX = s.x2;
            maxY = s.y2;
        }
        
        const layerIdx = this.state.get('activeLayer');
        const layer = this.state.get('layers')[layerIdx];
        if (!layer) return;
        
        const canvasWidth = this.canvas.width;
        if (tool === 'magicSelect' && this.tools.magicSelect.selection?.mask) {
            const { mask } = this.tools.magicSelect.selection;
            for (let py = minY; py <= maxY; py++) {
                for (let px = minX; px <= maxX; px++) {
                    if (mask[py * canvasWidth + px]) {
                        const idx = (py * canvasWidth + px) * 4;
                        layer.pixels[idx] = 0;
                        layer.pixels[idx + 1] = 0;
                        layer.pixels[idx + 2] = 0;
                        layer.pixels[idx + 3] = 0;
                    }
                }
            }
        } else {
            for (let py = minY; py <= maxY; py++) {
                for (let px = minX; px <= maxX; px++) {
                    if (px >= 0 && px < canvasWidth && py >= 0 && py < this.canvas.height) {
                        const idx = (py * canvasWidth + px) * 4;
                        layer.pixels[idx] = 0;
                        layer.pixels[idx + 1] = 0;
                        layer.pixels[idx + 2] = 0;
                        layer.pixels[idx + 3] = 0;
                    }
                }
            }
        }
        
        layer.dirty = true;
        this.deselectAll();
        this.canvas.render();
    }

    getActiveSelection() {
        if (this.tools.selector?.selection) return this.tools.selector.selection;
        if (this.tools.magicSelect?.selection) return this.tools.magicSelect.selection;
        if (this.tools.ellipseSelect?.selection) return this.tools.ellipseSelect.selection;
        return null;
    }

    getSelectionTool() {
        if (this.tools.selector?.selection) return 'selector';
        if (this.tools.magicSelect?.selection) return 'magicSelect';
        if (this.tools.ellipseSelect?.selection) return 'ellipseSelect';
        return null;
    }

    getSelectedPixels(x, y, w, h) {
        const layerIdx = this.state.get('activeLayer');
        const layer = this.state.get('layers')[layerIdx];
        if (!layer) return null;
        
        const pixels = new Uint8ClampedArray(w * h * 4);
        const canvasWidth = this.canvas.width;
        
        for (let py = 0; py < h; py++) {
            for (let px = 0; px < w; px++) {
                const srcX = x + px;
                const srcY = y + py;
                if (srcX >= 0 && srcX < canvasWidth && srcY >= 0 && srcY < this.canvas.height) {
                    const srcIdx = (srcY * canvasWidth + srcX) * 4;
                    const dstIdx = (py * w + px) * 4;
                    pixels[dstIdx] = layer.pixels[srcIdx];
                    pixels[dstIdx + 1] = layer.pixels[srcIdx + 1];
                    pixels[dstIdx + 2] = layer.pixels[srcIdx + 2];
                    pixels[dstIdx + 3] = layer.pixels[srcIdx + 3];
                }
            }
        }
        return pixels;
    }

    updateUI() {
        this.canvas.render();
        this.layersPanel.render();
        this.statusBar.update();
    }
}

const app = new App();
window.app = app;
