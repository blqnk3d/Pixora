export class TransformTool {
    constructor(canvas, state, history) {
        this.canvas = canvas;
        this.state = state;
        this.history = history;
        this.isDragging = false;
        this.isResizing = false;
        this.startPos = null;
        this.layerStartPixels = null;
    }

    activate() {
        this.canvas.element.style.cursor = 'move';
    }

    deactivate() {
        this.isDragging = false;
        this.isResizing = false;
    }

    onMouseDown(pos) {
        const layer = this.canvas.state.get('layers')[this.canvas.state.get('activeLayer')];
        if (!layer) return;

        this.isDragging = true;
        this.startPos = pos;
        this.layerStartPixels = new Uint8ClampedArray(layer.pixels);
        this.history.beginStroke();
    }

    onMouseMove(pos) {
        if (!this.isDragging || !pos || !this.startPos) return;

        const dx = pos.x - this.startPos.x;
        const dy = pos.y - this.startPos.y;

        if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
            const layer = this.canvas.state.get('layers')[this.canvas.state.get('activeLayer')];
            const width = this.canvas.width;
            const height = this.canvas.height;

            layer.pixels.fill(0);

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const srcX = x - dx;
                    const srcY = y - dy;
                    if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                        const srcIdx = (srcY * width + srcX) * 4;
                        const dstIdx = (y * width + x) * 4;
                        layer.pixels[dstIdx] = this.layerStartPixels[srcIdx];
                        layer.pixels[dstIdx+1] = this.layerStartPixels[srcIdx+1];
                        layer.pixels[dstIdx+2] = this.layerStartPixels[srcIdx+2];
                        layer.pixels[dstIdx+3] = this.layerStartPixels[srcIdx+3];
                    }
                }
            }

            layer.dirty = true;
            layer.scaledCanvas = null;
            this.canvas.render();
        }
    }

    onMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.startPos = null;
            this.layerStartPixels = null;
            this.history.endStroke();
        }
    }

    scaleLayer(scaleX, scaleY) {
        const layer = this.canvas.state.get('layers')[this.canvas.state.get('activeLayer')];
        if (!layer) return;

        this.history.beginStroke();

        const width = this.canvas.width;
        const height = this.canvas.height;
        const newWidth = Math.round(width * scaleX);
        const newHeight = Math.round(height * scaleY);
        const newPixels = new Uint8ClampedArray(newWidth * newHeight * 4);

        for (let y = 0; y < newHeight; y++) {
            for (let x = 0; x < newWidth; x++) {
                const srcX = Math.floor(x / scaleX);
                const srcY = Math.floor(y / scaleY);
                if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                    const srcIdx = (srcY * width + srcX) * 4;
                    const dstIdx = (y * newWidth + x) * 4;
                    newPixels[dstIdx] = layer.pixels[srcIdx];
                    newPixels[dstIdx+1] = layer.pixels[srcIdx+1];
                    newPixels[dstIdx+2] = layer.pixels[srcIdx+2];
                    newPixels[dstIdx+3] = layer.pixels[srcIdx+3];
                }
            }
        }

        layer.pixels = newPixels;
        layer.dirty = true;
        layer.scaledCanvas = null;
        this.canvas.state.set('canvasWidth', newWidth);
        this.canvas.state.set('canvasHeight', newHeight);
        this.canvas.resizeCanvas(newWidth, newHeight);
        this.history.endStroke();
    }

    rotateLayer(degrees) {
        const layer = this.canvas.state.get('layers')[this.canvas.state.get('activeLayer')];
        if (!layer) return;

        this.history.beginStroke();

        const width = this.canvas.width;
        const height = this.canvas.height;
        const rad = degrees * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const newWidth = Math.abs(width * cos) + Math.abs(height * sin);
        const newHeight = Math.abs(width * sin) + Math.abs(height * cos);
        const newPixels = new Uint8ClampedArray(newWidth * newHeight * 4);

        const cx = width / 2;
        const cy = height / 2;
        const ncx = newWidth / 2;
        const ncy = newHeight / 2;

        for (let y = 0; y < newHeight; y++) {
            for (let x = 0; x < newWidth; x++) {
                const srcX = Math.round((x - ncx) * cos + (y - ncy) * sin + cx);
                const srcY = Math.round((y - ncy) * cos - (x - ncx) * sin + cy);
                if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                    const srcIdx = (srcY * width + srcX) * 4;
                    const dstIdx = (y * newWidth + x) * 4;
                    newPixels[dstIdx] = layer.pixels[srcIdx];
                    newPixels[dstIdx+1] = layer.pixels[srcIdx+1];
                    newPixels[dstIdx+2] = layer.pixels[srcIdx+2];
                    newPixels[dstIdx+3] = layer.pixels[srcIdx+3];
                }
            }
        }

        layer.pixels = newPixels;
        layer.dirty = true;
        layer.scaledCanvas = null;
        this.canvas.state.set('canvasWidth', newWidth);
        this.canvas.state.set('canvasHeight', newHeight);
        this.canvas.resizeCanvas(newWidth, newHeight);
        this.history.endStroke();
    }

    cropLayer(x1, y1, x2, y2) {
        const layer = this.canvas.state.get('layers')[this.canvas.state.get('activeLayer')];
        if (!layer) return;

        this.history.beginStroke();

        const minX = Math.max(0, Math.min(x1, x2));
        const maxX = Math.min(this.canvas.width - 1, Math.max(x1, x2));
        const minY = Math.max(0, Math.min(y1, y2));
        const maxY = Math.min(this.canvas.height - 1, Math.max(y1, y2));
        const newWidth = maxX - minX + 1;
        const newHeight = maxY - minY + 1;
        const newPixels = new Uint8ClampedArray(newWidth * newHeight * 4);

        for (let y = 0; y < newHeight; y++) {
            for (let x = 0; x < newWidth; x++) {
                const srcIdx = ((y + minY) * this.canvas.width + (x + minX)) * 4;
                const dstIdx = (y * newWidth + x) * 4;
                newPixels[dstIdx] = layer.pixels[srcIdx];
                newPixels[dstIdx+1] = layer.pixels[srcIdx+1];
                newPixels[dstIdx+2] = layer.pixels[srcIdx+2];
                newPixels[dstIdx+3] = layer.pixels[srcIdx+3];
            }
        }

        layer.pixels = newPixels;
        layer.dirty = true;
        layer.scaledCanvas = null;
        this.canvas.state.set('canvasWidth', newWidth);
        this.canvas.state.set('canvasHeight', newHeight);
        this.canvas.resizeCanvas(newWidth, newHeight);
        this.history.endStroke();
    }
}
