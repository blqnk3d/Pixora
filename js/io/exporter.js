export class Exporter {
    constructor(app) {
        this.app = app;
        this.exportCanvas = null;
        this.exportCtx = null;
    }

    getExportCanvas() {
        const width = this.app.canvas.width;
        const height = this.app.canvas.height;
        if (!this.exportCanvas || this.exportCanvas.width !== width || this.exportCanvas.height !== height) {
            this.exportCanvas = new OffscreenCanvas(width, height);
            this.exportCtx = this.exportCanvas.getContext('2d');
            this.exportCtx.imageSmoothingEnabled = false;
        }
        this.exportCtx.clearRect(0, 0, width, height);
        return { canvas: this.exportCanvas, ctx: this.exportCtx };
    }

    savePNG() {
        const { canvas, ctx } = this.getExportCanvas();
        const width = canvas.width;
        const height = canvas.height;
        const layers = this.app.state.get('layers');

        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (!layer.visible) continue;
            const imageData = ctx.createImageData(width, height);
            imageData.data.set(layer.pixels);
            ctx.putImageData(imageData, 0, 0);
            ctx.globalAlpha = layer.opacity ?? 1;
        }

        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pixel-art.png';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, 'image/png');
    }

    saveGIF() {
        alert('GIF export requires additional library. Use PNG export for now.');
    }
}
