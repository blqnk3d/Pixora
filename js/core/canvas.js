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

        this.ctx.imageSmoothingEnabled = false;
    }

    get width() { return this.state.get('canvasWidth'); }
    get height() { return this.state.get('canvasHeight'); }

    getPixelPosition(e) {
        const rect = this.element.getBoundingClientRect();
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
        this.render();
        this.state.set('zoom', this.zoom);
    }

    zoomIn() {
        if (this.zoomIndex < this.zoomLevels.length - 1) {
            this.zoomIndex++;
            this.zoom = this.zoomLevels[this.zoomIndex];
            this.render();
            this.state.set('zoom', this.zoom);
        }
    }

    zoomOut() {
        if (this.zoomIndex > 0) {
            this.zoomIndex--;
            this.zoom = this.zoomLevels[this.zoomIndex];
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

    renderNow() {
        const { width, height, zoom } = this;
        this.element.width = width * zoom;
        this.element.height = height * zoom;
        this.element.style.width = width * zoom + 'px';
        this.element.style.height = height * zoom + 'px';

        this.ctx.clearRect(0, 0, this.element.width, this.element.height);
        this.ctx.imageSmoothingEnabled = false;

        const layers = this.state.get('layers');
        const layerCount = layers.length;

        for (let i = 0; i < layerCount; i++) {
            const layer = layers[i];
            if (!layer.visible) continue;

            if (layer.dirty || !layer.scaledCanvas || layer.lastZoom !== zoom) {
                if (layer.dirty) {
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

        if (window.app && window.app.tools) {
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
            const currentTool = window.app.currentTool;
            if (currentTool && currentTool.updatePreview && currentTool.previewPos) {
                currentTool.updatePreview(currentTool.previewPos);
            }
        }

        if (this.state.get('showGrid') && zoom >= 4) {
            this.ctx.strokeStyle = 'rgba(128,128,128,0.3)';
            this.ctx.lineWidth = 1;
            const zoomW = zoom;
            const zoomH = zoom;
            const scaledWidth = width * zoom;
            const scaledHeight = height * zoom;

            for (let x = 0; x <= width; x++) {
                const px = x * zoomW + 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(px, 0);
                this.ctx.lineTo(px, scaledHeight);
                this.ctx.stroke();
            }
            for (let y = 0; y <= height; y++) {
                const py = y * zoomH + 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(0, py);
                this.ctx.lineTo(scaledWidth, py);
                this.ctx.stroke();
            }
        }
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
