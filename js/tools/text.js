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
        const rect = this.canvas.element.getBoundingClientRect();

        this.textEl = document.createElement('textarea');
        this.textEl.style.cssText = `
            position:fixed;
            left:${rect.left + pos.x}px;
            top:${rect.top + pos.y}px;
            width:200px;
            height:auto;
            min-height:20px;
            background:transparent;
            color:rgb(${this.state.get('currentColor').slice(0,3).join(',')});
            border:1px dashed var(--accent);
            font-family:var(--font-family);
            font-size:12px;
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

        const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim() || 'Arial';
        const width = this.canvas.width;
        const height = this.canvas.height;
        const activeLayer = this.canvas.state.get('layers')[this.canvas.state.get('activeLayer')];

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const imageData = ctx.createImageData(width, height);
        imageData.data.set(activeLayer.pixels);
        ctx.putImageData(imageData, 0, 0);

        ctx.font = `12px ${fontFamily}`;
        ctx.fillStyle = `rgb(${this.state.get('currentColor').slice(0,3).join(',')})`;
        ctx.imageSmoothingEnabled = false;

        const lines = text.split('\n');
        const lineHeight = 14;
        lines.forEach((line, i) => {
            ctx.fillText(line, this.currentPos.x, this.currentPos.y + i * lineHeight + lineHeight);
        });

        const textImageData = ctx.getImageData(0, 0, width, height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcIdx = (y * width + x) * 4;
                if (srcIdx < textImageData.data.length && textImageData.data[srcIdx + 3] > 0) {
                    if (!window.app.hasSelection() || window.app.isPointInSelection(x, y)) {
                        activeLayer.pixels[srcIdx] = textImageData.data[srcIdx];
                        activeLayer.pixels[srcIdx + 1] = textImageData.data[srcIdx + 1];
                        activeLayer.pixels[srcIdx + 2] = textImageData.data[srcIdx + 2];
                        activeLayer.pixels[srcIdx + 3] = textImageData.data[srcIdx + 3];
                    }
                }
            }
        }

        activeLayer.dirty = true;
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