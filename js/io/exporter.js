export class Exporter {
    constructor(app) {
        this.app = app;
    }

    savePNG() {
        const canvas = document.createElement('canvas');
        canvas.width = this.app.canvas.width;
        canvas.height = this.app.canvas.height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const layers = this.app.state.get('layers');
        layers.forEach(layer => {
            if (!layer.visible) return;
            const imageData = ctx.createImageData(canvas.width, canvas.height);
            imageData.data.set(layer.pixels);
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(imageData, 0, 0);
            ctx.globalAlpha = layer.opacity;
            ctx.drawImage(tempCanvas, 0, 0);
        });

        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pixel-art.png';
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    saveGIF() {
        alert('GIF export requires additional library. Use PNG export for now.');
    }
}
