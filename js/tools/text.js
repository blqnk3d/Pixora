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

        const ctx = this.canvas.element.getContext('2d');
        const zoom = this.canvas.zoom;
        const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim() || 'Arial';
        ctx.font = `${12 * zoom}px ${fontFamily}`;
        ctx.fillStyle = `rgb(${this.state.get('currentColor').slice(0,3).join(',')})`;
        ctx.imageSmoothingEnabled = false;

        const lines = text.split('\n');
        const lineHeight = 14 * zoom;
        lines.forEach((line, i) => {
            ctx.fillText(line, this.currentPos.x * zoom, (this.currentPos.y + i) * zoom + lineHeight);
        });

        const layer = this.canvas.state.get('layers')[this.canvas.state.get('activeLayer')];
        const imageData = ctx.getImageData(0, 0, this.canvas.element.width, this.canvas.element.height);
        const startX = this.currentPos.x * zoom;
        const startY = this.currentPos.y * zoom;
        const endX = startX + 200;
        const endY = startY + lines.length * lineHeight + zoom;

        for (let y = Math.floor(startY); y < Math.min(endY, this.canvas.height * zoom); y++) {
            for (let x = Math.floor(startX); x < Math.min(endX, this.canvas.width * zoom); x++) {
                const srcIdx = (y * this.canvas.element.width + x) * 4;
                const dstX = Math.floor(x / zoom);
                const dstY = Math.floor(y / zoom);
                if (dstX >= 0 && dstX < this.canvas.width && dstY >= 0 && dstY < this.canvas.height) {
                    const dstIdx = (dstY * this.canvas.width + dstX) * 4;
                    if (imageData.data[srcIdx + 3] > 0) {
                        layer.pixels[dstIdx] = imageData.data[srcIdx];
                        layer.pixels[dstIdx+1] = imageData.data[srcIdx+1];
                        layer.pixels[dstIdx+2] = imageData.data[srcIdx+2];
                        layer.pixels[dstIdx+3] = imageData.data[srcIdx+3];
                    }
                }
            }
        }

        layer.dirty = true;
        layer.scaledCanvas = null;
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
