export class CanvasEngine {
    constructor(canvasId, state, history) {
        this.element = document.getElementById(canvasId);
        this.ctx = this.element.getContext('2d');
        this.overlay = document.getElementById('overlay-canvas');
        this.overlayCtx = this.overlay.getContext('2d');
        this.state = state;
        this.history = history;
        this.canvasWidth = state.get('canvasWidth') || 32;
        this.canvasHeight = state.get('canvasHeight') || 32;
        this.zoom = state.get('zoom') || 1;
        this.minZoom = 0.1;
        this.maxZoom = 128;
        this.isDrawing = false;
        this.renderPending = false;
        this.previewRenderPending = false;
        this.cachedRect = null;
        this.lastPreviewPos = { x: -1, y: -1 };
        this.showPreview = false;
        this.lastScrollX = 0;
        this.lastScrollY = 0;

        this.ctx.imageSmoothingEnabled = false;
        this.applyZoomTransform();
        this.centerCanvas();
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
        const scaleX = rect.width / this.canvasWidth;
        const scaleY = rect.height / this.canvasHeight;
        const x = Math.floor((e.clientX - rect.left) / scaleX);
        const y = Math.floor((e.clientY - rect.top) / scaleY);
        if (x < 0 || y < 0 || x >= this.canvasWidth || y >= this.canvasHeight) return null;
        return { x, y };
    }

    setZoom(newZoom, focalPoint = null) {
        const clampedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
        if (Math.abs(this.zoom - clampedZoom) < 0.001) return;
        
        const oldZoom = this.zoom;
        const container = document.getElementById('canvas-container');
        
        // If no focal point provided, try to use the last known mouse position from app
        if (!focalPoint && window.app && window.app.lastMousePos) {
            focalPoint = window.app.lastMousePos;
        }

        let mouseX, mouseY;
        if (focalPoint && container) {
            const rect = container.getBoundingClientRect();
            mouseX = focalPoint.clientX - rect.left + container.scrollLeft;
            mouseY = focalPoint.clientY - rect.top + container.scrollTop;
        }

        this.zoom = clampedZoom;
        this.applyZoomTransform();
        this.updateCachedRect();
        this.render();
        this.state.set('zoom', this.zoom);
        
        if (focalPoint && container) {
            const rect = container.getBoundingClientRect();
            const scale = this.zoom / oldZoom;
            const newScrollX = mouseX * scale - (focalPoint.clientX - rect.left);
            const newScrollY = mouseY * scale - (focalPoint.clientY - rect.top);
            container.scrollLeft = newScrollX;
            container.scrollTop = newScrollY;
        } else {
            this.centerCanvas();
        }
    }

    applyZoomTransform() {
        const w = Math.floor(this.canvasWidth * this.zoom);
        const h = Math.floor(this.canvasHeight * this.zoom);
        this.element.style.width = w + 'px';
        this.element.style.height = h + 'px';
        this.overlay.style.width = w + 'px';
        this.overlay.style.height = h + 'px';
        
        // Internal overlay size matches zoomed display size for 1:1 screen pixel drawing
        this.overlay.width = w;
        this.overlay.height = h;

        this.element.style.transform = '';
        this.element.style.transformOrigin = '';
    }

    zoomIn(focalPoint = null) {
        this.setZoom(this.zoom * 1.2, focalPoint);
    }

    zoomOut(focalPoint = null) {
        this.setZoom(this.zoom / 1.2, focalPoint);
    }

    centerCanvas() {
        const container = document.getElementById('canvas-container');
        const workspace = container?.querySelector('.canvas-workspace');
        if (!container || !workspace) return;
        
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        container.scrollLeft = (workspace.scrollWidth - containerWidth) / 2;
        container.scrollTop = (workspace.scrollHeight - containerHeight) / 2;
    }

    scrollToMouse(mouseX, mouseY, oldZoom, newZoom) {
        const container = document.getElementById('canvas-container');
        const workspace = container?.querySelector('.canvas-workspace');
        if (!container || !workspace) return;
        
        if (oldZoom !== undefined && newZoom !== undefined) {
            const scale = newZoom / oldZoom;
            const newScrollX = mouseX * scale - container.clientWidth / 2;
            const newScrollY = mouseY * scale - container.clientHeight / 2;
            container.scrollLeft = newScrollX;
            container.scrollTop = newScrollY;
        } else {
            const targetX = mouseX - container.clientWidth / 2;
            const targetY = mouseY - container.clientHeight / 2;
            container.scrollLeft = targetX;
            container.scrollTop = targetY;
        }
    }

    syncWithState() {
        this.canvasWidth = this.state.get('canvasWidth');
        this.canvasHeight = this.state.get('canvasHeight');
        this.applyZoomTransform();
        this.updateCachedRect();
    }

    render() {
        if (this.renderPending) return;
        this.renderPending = true;
        requestAnimationFrame(() => {
            this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
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
        const app = window.app;
        if (!app || !app.currentTool || !app.currentTool.previewPos) return;

        const pos = app.currentTool.previewPos;
        const size = this.state.get('brushSize');
        const offset = Math.floor(size / 2);
        const prevX = pos.x - offset;
        const prevY = pos.y - offset;

        if (this.lastPreviewPos.x !== -1) {
            const lastSize = this.state.get('brushSize');
            const lastOffset = Math.floor(lastSize / 2);
            const clearX = this.lastPreviewPos.x - lastOffset;
            const clearY = this.lastPreviewPos.y - lastOffset;
            ctx.clearRect(clearX - 2, clearY - 2, lastSize + 4, lastSize + 4);
        }

        this.lastPreviewPos = { x: pos.x, y: pos.y };

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(prevX + 0.5, prevY + 0.5, size - 1, size - 1);
    }

renderNow() {
        const { canvasWidth: width, canvasHeight: height } = this;

        if (this.element.width !== width || this.element.height !== height) {
            this.element.width = width;
            this.element.height = height;
            this.applyZoomTransform();
            this.updateCachedRect();
        }

        this.ctx.clearRect(0, 0, width, height);
        this.ctx.imageSmoothingEnabled = false;

        const layers = this.state.get('layers');
        const layerCount = layers.length;

        for (let i = 0; i < layerCount; i++) {
            const layer = layers[i];
            if (!layer.visible) continue;

            if (layer.dirty && layer.offscreenCtx) {
                const imageData = new ImageData(layer.pixels, width, height);
                layer.offscreenCtx.putImageData(imageData, 0, 0);
                layer.dirty = false;
            }

            this.ctx.globalAlpha = layer.opacity;
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.drawImage(layer.offscreen, 0, 0);
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
        const lassoSelect = tools.lassoSelect;
        if (lassoSelect && (lassoSelect.selection || lassoSelect.isSelecting)) {
            lassoSelect.drawSelection();
        }
    }

    drawToolPreview() {
        const app = window.app;
        if (!app || !app.currentTool || !app.currentTool.previewPos) return;

        const pos = app.currentTool.previewPos;
        if (!pos) return;

        const size = this.state.get('brushSize');
        const offset = Math.floor(size / 2);
        const prevX = pos.x - offset;
        const prevY = pos.y - offset;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(prevX + 0.5, prevY + 0.5, size - 1, size - 1);
    }

    drawPreviewOnly() {
        const app = window.app;
        const pos = app?.currentTool?.previewPos;
        if (!pos) return;

        const size = this.state.get('brushSize');
        const offset = Math.floor(size / 2);
        const prevX = pos.x - offset - 2;
        const prevY = pos.y - offset - 2;

        if (this.lastPreviewPos) {
            const lastSize = (this.lastPreviewPos.size || size) + 4;
            const lastOffset = Math.floor((this.lastPreviewPos.size || size) / 2);
            const clearX = this.lastPreviewPos.x - lastOffset - 2;
            const clearY = this.lastPreviewPos.y - lastOffset - 2;
            this.ctx.clearRect(clearX, clearY, lastSize, lastSize);
        }

        this.lastPreviewPos = { x: pos.x, y: pos.y, size };

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pos.x - offset + 0.5, pos.y - offset + 0.5, size - 1, size - 1);
    }

    showPreviewAt(x, y) {
        if (this.lastPreviewPos) {
            const lastSize = (this.lastPreviewPos.size || this.state.get('brushSize')) + 4;
            const lastOffset = Math.floor((this.lastPreviewPos.size || this.state.get('brushSize')) / 2);
            const lx = this.lastPreviewPos.x - lastOffset - 2;
            const ly = this.lastPreviewPos.y - lastOffset - 2;
            this.ctx.clearRect(lx, ly, lastSize, lastSize);
        }

        const size = this.state.get('brushSize');
        const offset = Math.floor(size / 2);

        this.lastPreviewPos = { x, y, size };

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - offset + 0.5, y - offset + 0.5, size - 1, size - 1);
    }

    setPixel(x, y, color, layerIndex = null) {
        const layerIdx = layerIndex ?? this.state.get('activeLayer');
        const layer = this.state.get('layers')[layerIdx];
        if (!layer) return;

        const idx = (y * this.canvasWidth + x) * 4;
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

        const idx = (y * this.canvasWidth + x) * 4;
        if (idx < 0 || idx >= layer.pixels.length) return null;

        return [layer.pixels[idx], layer.pixels[idx+1], layer.pixels[idx+2], layer.pixels[idx+3]];
    }

    resizeCanvas(newWidth, newHeight) {
        const oldWidth = this.canvasWidth;
        const oldHeight = this.canvasHeight;
        this.canvasWidth = newWidth;
        this.canvasHeight = newHeight;
        const layers = this.state.get('layers');
        layers.forEach(layer => {
            const newPixels = new Uint8ClampedArray(newWidth * newHeight * 4);
            for (let y = 0; y < Math.min(oldHeight, newHeight); y++) {
                for (let x = 0; x < Math.min(oldWidth, newWidth); x++) {
                    const oldIdx = (y * oldWidth + x) * 4;
                    const newIdx = (y * newWidth + x) * 4;
                    newPixels[newIdx] = layer.pixels[oldIdx];
                    newPixels[newIdx+1] = layer.pixels[oldIdx+1];
                    newPixels[newIdx+2] = layer.pixels[oldIdx+2];
                    newPixels[newIdx+3] = layer.pixels[oldIdx+3];
                }
            }
            layer.pixels = newPixels;
            layer.dirty = true;
            if (layer.offscreen && (layer.offscreen.width !== newWidth || layer.offscreen.height !== newHeight)) {
                layer.offscreen = new OffscreenCanvas(newWidth, newHeight);
                layer.offscreenCtx = layer.offscreen.getContext('2d');
            }
        });
        this.state.set('canvasWidth', newWidth);
        this.state.set('canvasHeight', newHeight);
        this.render();
    }
}
