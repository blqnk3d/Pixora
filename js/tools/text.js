export class TextTool {
    constructor(canvas, state, history) {
        this.canvas = canvas;
        this.state = state;
        this.history = history;
        this.isPlacing = false;
        this.textEl = null;
        this.currentPos = null;
    }

    activate() {
        this.canvas.element.style.cursor = 'text';
    }

    deactivate() {
        this.cancelText();
    }

    onMouseDown(pos) {
        this.cancelText();
        this.currentPos = pos;
        this.isPlacing = true;
        this.showTextInput(pos);
    }

    onMouseMove(pos) {}

    onMouseUp() {}

    showTextInput(pos) {
        const container = document.getElementById('canvas-container');
        const zoom = this.canvas.zoom;
        const rect = this.canvas.element.getBoundingClientRect();

        this.textEl = document.createElement('textarea');
        this.textEl.style.cssText = `
            position:fixed;
            left:${rect.left + pos.x * zoom}px;
            top:${rect.top + pos.y * zoom}px;
            width:200px;
            height:auto;
            min-height:20px;
            background:transparent;
            color:rgb(${this.state.get('currentColor').slice(0,3).join(',')});
            border:1px dashed var(--accent);
            font-family:var(--font-family);
            font-size:${12 * zoom}px;
            padding:2px;
            resize:both;
            z-index:1000;
            outline:none;
        `;
        this.textEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.applyText();
            }
            if (e.key === 'Escape') {
                this.cancelText();
            }
        });
        this.textEl.addEventListener('blur', () => {
            setTimeout(() => this.applyText(), 200);
        });
        document.body.appendChild(this.textEl);
        this.textEl.focus();
    }

    applyText() {
        if (!this.textEl || !this.currentPos) return;

        const text = this.textEl.value;
        if (!text) {
            this.cancelText();
            return;
        }

        this.history.beginStroke();

        const zoom = this.canvas.zoom;
        const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim() || 'Arial';
        const width = this.canvas.width;
        const height = this.canvas.height;
        const activeLayer = this.canvas.state.get('layers')[this.canvas.state.get('activeLayer')];

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width * zoom;
        tempCanvas.height = height * zoom;
        const ctx = tempCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const imageData = ctx.createImageData(tempCanvas.width, tempCanvas.height);
        const layerPixels = activeLayer.pixels;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcIdx = (y * width + x) * 4;
                const dstIdx = (y * zoom * tempCanvas.width + x * zoom) * 4;
                for (let dy = 0; dy < zoom; dy++) {
                    for (let dx = 0; dx < zoom; dx++) {
                        const px = x * zoom + dx;
                        const py = y * zoom + dy;
                        const pIdx = (py * tempCanvas.width + px) * 4;
                        imageData.data[pIdx] = layerPixels[srcIdx];
                        imageData.data[pIdx + 1] = layerPixels[srcIdx + 1];
                        imageData.data[pIdx + 2] = layerPixels[srcIdx + 2];
                        imageData.data[pIdx + 3] = layerPixels[srcIdx + 3];
                    }
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);

        ctx.font = `${12 * zoom}px ${fontFamily}`;
        ctx.fillStyle = `rgb(${this.state.get('currentColor').slice(0,3).join(',')})`;
        ctx.imageSmoothingEnabled = false;

        const lines = text.split('\n');
        const lineHeight = 14 * zoom;
        lines.forEach((line, i) => {
            ctx.fillText(line, this.currentPos.x * zoom, (this.currentPos.y + i) * zoom + lineHeight);
        });

        const textImageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const startX = this.currentPos.x * zoom;
        const startY = this.currentPos.y * zoom;
        const endX = startX + 200;
        const endY = startY + lines.length * lineHeight + zoom;

        for (let y = Math.floor(startY); y < Math.min(endY, this.canvas.height * zoom); y++) {
            for (let x = Math.floor(startX); x < Math.min(endX, this.canvas.width * zoom); x++) {
                const srcIdx = (y * tempCanvas.width + x) * 4;
                const dstX = Math.floor(x / zoom);
                const dstY = Math.floor(y / zoom);
                if (dstX >= 0 && dstX < this.canvas.width && dstY >= 0 && dstY < this.canvas.height) {
                    const dstIdx = (dstY * this.canvas.width + dstX) * 4;
                    if (textImageData.data[srcIdx + 3] > 0) {
                        activeLayer.pixels[dstIdx] = textImageData.data[srcIdx];
                        activeLayer.pixels[dstIdx+1] = textImageData.data[srcIdx+1];
                        activeLayer.pixels[dstIdx+2] = textImageData.data[srcIdx+2];
                        activeLayer.pixels[dstIdx+3] = textImageData.data[srcIdx+3];
                    }
                }
            }
        }

        activeLayer.dirty = true;
        activeLayer.scaledCanvas = null;
        this.canvas.render();
        this.history.endStroke();
        this.cancelText();
    }

    cancelText() {
        if (this.textEl) {
            this.textEl.remove();
            this.textEl = null;
        }
        this.isPlacing = false;
        this.currentPos = null;
    }
}
