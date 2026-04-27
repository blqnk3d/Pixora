export class CanvasEngine {
    constructor(canvasId, state, history) {
        this.element = document.getElementById(canvasId);
        this.ctx = this.element.getContext('2d');
        this.state = state;
        this.history = history;
        this.zoomLevels = [1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 48, 64];
        this.zoomIndex = 5;
        this.zoom = this.zoomLevels[this.zoomIndex];
        this.isDrawing = false;
        this.renderPending = false;
        this.previewRenderPending = false;
        this.cachedRect = null;
        this.lastPreviewPos = { x: -1, y: -1 };
        this.showPreview = false;
        this.lastScrollX = 0;
        this.lastScrollY = 0;

        this.ctx.imageSmoothingEnabled = false;
        this.updateCachedRect();
        this.setupScrollListener();
    }

    setupScrollListener() {
        const container = document.getElementById('canvas-container');
        if (container) {
            container.addEventListener('scroll', () => {
                if (container.scrollLeft !== this.lastScrollX || container.scrollTop !== this.lastScrollY) {
                    this.lastScrollX = container.scrollLeft;
                    this.lastScrollY = container.scrollTop;
                    this.cachedRect = null;
                }
            });
        }
    }

    updateCachedRect() {
        this.cachedRect = this.element.getBoundingClientRect();
    }

    get width() { return this.state.get('canvasWidth'); }
    get height() { return this.state.get('canvasHeight'); }

    getPixelPosition(e) {
        if (!this.cachedRect) this.updateCachedRect();
        const rect = this.cachedRect;
        const x = Math.floor((e.clientX - rect.left) / this.zoom);
        const y = Math.floor((e.clientY - rect.top) / this.zoom);
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
        return { x, y };
    }

    setZoom(newZoom) {
        const idx = this.zoomLevels.indexOf(newZoom);
        if (idx !== -1) {
            this.zoomIndex = idx;
            this.zoom = newZoom;
        }
        this.updateCachedRect();
        this.render();
        this.state.set('zoom', this.zoom);
    }

    zoomIn() {
        if (this.zoomIndex < this.zoomLevels.length - 1) {
            this.zoomIndex++;
            this.zoom = this.zoomLevels[this.zoomIndex];
            this.updateCachedRect();
            this.render();
            this.state.set('zoom', this.zoom);
        }
    }

    zoomOut() {
        if (this.zoomIndex > 0) {
            this.zoomIndex--;
            this.zoom = this.zoomLevels[this.zoomIndex];
            this.updateCachedRect();
            this.render();
            this.state.set('zoom', this.zoom);
        }
    }

    render() {
        if (this.renderPending) return;
        this.renderPending = true;
        requestAnimationFrame(() => {
            this.renderNow();
            this.renderPending = false;
        });
    }

    requestPreviewRender() {
        if (this.previewRenderPending) return;
        if (!this.lastPreviewPos) {
            this.lastPreviewPos = { x: -1, y: -1 };
        }
        this.previewRenderPending = true;
        requestAnimationFrame(() => {
            this.renderPreviewOnly();
            this.previewRenderPending = false;
        });
    }

    renderPreviewOnly() {
        const ctx = this.ctx;
        const zoom = this.zoom;
        const app = window.app;
        if (!app || !app.currentTool || !app.currentTool.previewPos) return;

        const pos = app.currentTool.previewPos;
        const size = this.state.get('brushSize');
        const offset = Math.floor(size / 2);
        const previewSize = size * zoom;
        const prevX = (pos.x - offset) * zoom;
        const prevY = (pos.y - offset) * zoom;

        if (this.lastPreviewPos.x !== -1) {
            const lastSize = this.state.get('brushSize') * zoom;
            const lastOffset = Math.floor(this.state.get('brushSize') / 2);
            const clearX = (this.lastPreviewPos.x - lastOffset) * zoom;
            const clearY = (this.lastPreviewPos.y - lastOffset) * zoom;
            ctx.clearRect(clearX - 2, clearY - 2, lastSize + 4, lastSize + 4);
        }

        this.lastPreviewPos = { x: pos.x, y: pos.y };

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(prevX, prevY, previewSize, previewSize);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(prevX, prevY, previewSize, previewSize);
    }

    renderNow() {
        const { width, height, zoom } = this;
        const newWidth = width * zoom;
        const newHeight = height * zoom;

        if (this.element.width !== newWidth || this.element.height !== newHeight) {
            this.element.width = newWidth;
            this.element.height = newHeight;
            this.element.style.width = newWidth + 'px';
            this.element.style.height = newHeight + 'px';
            this.updateCachedRect();
        }

        this.ctx.clearRect(0, 0, newWidth, newHeight);
        this.ctx.imageSmoothingEnabled = false;

        const layers = this.state.get('layers');
        const layerCount = layers.length;

        for (let i = 0; i < layerCount; i++) {
            const layer = layers[i];
            if (!layer.visible) continue;

            if (layer.dirty || !layer.scaledCanvas || layer.lastZoom !== zoom) {
                if (layer.dirty && layer.offscreenCtx) {
                    const imageData = new ImageData(layer.pixels, width, height);
                    layer.offscreenCtx.putImageData(imageData, 0, 0);
                    layer.dirty = false;
                }

                const scaled = new OffscreenCanvas(width * zoom, height * zoom);
                const sctx = scaled.getContext('2d');
                sctx.imageSmoothingEnabled = false;
                sctx.drawImage(layer.offscreen, 0, 0, width * zoom, height * zoom);
                layer.scaledCanvas = scaled;
                layer.lastZoom = zoom;
            }

            this.ctx.globalAlpha = layer.opacity;
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.drawImage(layer.scaledCanvas, 0, 0);
        }
        this.ctx.globalAlpha = 1;

        this.drawToolSelection();
        this.drawToolPreview();
        this.lastPreviewPos = null;
    }

    drawToolSelection() {
        if (!window.app || !window.app.tools) return;
        const tools = window.app.tools;
        const selector = tools.selector;
        if (selector && selector.selection) {
            selector.drawSelection();
        }
        const magicSelect = tools.magicSelect;
        if (magicSelect && magicSelect.selection) {
            magicSelect.drawSelection();
        }
        const ellipseSelect = tools.ellipseSelect;
        if (ellipseSelect && ellipseSelect.selection) {
            ellipseSelect.drawSelection();
        }
    }

    drawToolPreview() {
        const app = window.app;
        if (!app || !app.currentTool || !app.currentTool.previewPos) return;

        const pos = app.currentTool.previewPos;
        if (!pos) return;

        const zoom = this.zoom;
        const size = this.state.get('brushSize');
        const offset = Math.floor(size / 2);
        const prevX = (pos.x - offset) * zoom;
        const prevY = (pos.y - offset) * zoom;
        const previewSize = size * zoom;

        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(prevX, prevY, previewSize, previewSize);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(prevX, prevY, previewSize, previewSize);
    }

    drawPreviewOnly() {
        const app = window.app;
        const pos = app?.currentTool?.previewPos;
        if (!pos) return;

        const zoom = this.zoom;
        const size = this.state.get('brushSize');
        const offset = Math.floor(size / 2);
        const previewSize = size * zoom + 4;
        const prevX = (pos.x - offset) * zoom - 2;
        const prevY = (pos.y - offset) * zoom - 2;

        if (this.lastPreviewPos) {
            const lastSize = (this.lastPreviewPos.size || size) * zoom + 4;
            const lastOffset = Math.floor((this.lastPreviewPos.size || size) / 2);
            const clearX = (this.lastPreviewPos.x - lastOffset) * zoom - 2;
            const clearY = (this.lastPreviewPos.y - lastOffset) * zoom - 2;
            this.ctx.clearRect(clearX, clearY, lastSize, lastSize);
        }

        this.lastPreviewPos = { x: pos.x, y: pos.y, size };

        const drawX = (pos.x - offset) * zoom;
        const drawY = (pos.y - offset) * zoom;

        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(drawX, drawY, size * zoom, size * zoom);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(drawX, drawY, size * zoom, size * zoom);
    }

    showPreviewAt(x, y) {
        if (this.lastPreviewPos) {
            const lastSize = (this.lastPreviewPos.size || this.state.get('brushSize')) * this.zoom;
            const lastOffset = Math.floor((this.lastPreviewPos.size || this.state.get('brushSize')) / 2);
            const lx = (this.lastPreviewPos.x - lastOffset) * this.zoom - 2;
            const ly = (this.lastPreviewPos.y - lastOffset) * this.zoom - 2;
            this.ctx.clearRect(lx, ly, lastSize + 4, lastSize + 4);
        }

        const zoom = this.zoom;
        const size = this.state.get('brushSize');
        const offset = Math.floor(size / 2);
        const px = (x - offset) * zoom;
        const py = (y - offset) * zoom;
        const s = size * zoom;

        this.lastPreviewPos = { x, y, size };

        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(px, py, s, s);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(px, py, s, s);
    }

    setPixel(x, y, color, layerIndex = null) {
        const layerIdx = layerIndex ?? this.state.get('activeLayer');
        const layer = this.state.get('layers')[layerIdx];
        if (!layer) return;

        const idx = (y * this.width + x) * 4;
        if (idx < 0 || idx >= layer.pixels.length) return;

        const oldColor = [layer.pixels[idx], layer.pixels[idx+1], layer.pixels[idx+2], layer.pixels[idx+3]];

        layer.pixels[idx] = color[0];
        layer.pixels[idx+1] = color[1];
        layer.pixels[idx+2] = color[2];
        layer.pixels[idx+3] = color[3];

        layer.dirty = true;
        layer.scaledCanvas = null;

        return oldColor;
    }

    getPixel(x, y, layerIndex = null) {
        const layerIdx = layerIndex ?? this.state.get('activeLayer');
        const layer = this.state.get('layers')[layerIdx];
        if (!layer) return null;

        const idx = (y * this.width + x) * 4;
        if (idx < 0 || idx >= layer.pixels.length) return null;

        return [layer.pixels[idx], layer.pixels[idx+1], layer.pixels[idx+2], layer.pixels[idx+3]];
    }

    resizeCanvas(newWidth, newHeight) {
        const layers = this.state.get('layers');
        layers.forEach(layer => {
            const newPixels = new Uint8ClampedArray(newWidth * newHeight * 4);
            for (let y = 0; y < Math.min(this.height, newHeight); y++) {
                for (let x = 0; x < Math.min(this.width, newWidth); x++) {
                    const oldIdx = (y * this.width + x) * 4;
                    const newIdx = (y * newWidth + x) * 4;
                    newPixels[newIdx] = layer.pixels[oldIdx];
                    newPixels[newIdx+1] = layer.pixels[oldIdx+1];
                    newPixels[newIdx+2] = layer.pixels[oldIdx+2];
                    newPixels[newIdx+3] = layer.pixels[oldIdx+3];
                }
            }
            layer.pixels = newPixels;
            layer.dirty = true;
            layer.scaledCanvas = null;
        });
        this.state.set('canvasWidth', newWidth);
        this.state.set('canvasHeight', newHeight);
        this.render();
    }
}
