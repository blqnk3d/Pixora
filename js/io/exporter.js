export class Exporter {
    constructor(app) {
        this.app = app;
    }

    savePNG() {
        var width = this.app.canvas.width;
        var height = this.app.canvas.height;
        var exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;
        var ctx = exportCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        var layers = this.app.state.get('layers');
        var offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
        var offCtx = offscreenCanvas.getContext('2d');
        
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (!layer.visible) continue;
            
            offCtx.clearRect(0, 0, width, height);
            var imageData = offCtx.createImageData(width, height);
            imageData.data.set(layer.pixels);
            offCtx.putImageData(imageData, 0, 0);
            
            ctx.globalAlpha = layer.opacity ?? 1;
            ctx.drawImage(offscreenCanvas, 0, 0);
        }
        
        ctx.globalAlpha = 1;
        
        exportCanvas.toBlob(function(blob) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'pixel-art.png';
            a.click();
            setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        }, 'image/png');
    }

    saveGIF() {
        alert('GIF export requires additional library. Use PNG export for now.');
    }

    removeBackground() {
        const layerIdx = this.app.state.get('activeLayer');
        const layer = this.app.state.get('layers')[layerIdx];
        if (!layer) return;

        const pixels = layer.pixels;
        const r = pixels[0];
        const g = pixels[1];
        const b = pixels[2];
        const a = pixels[3];

        if (a === 0) return; // Already transparent at (0,0)

        this.app.history.beginStroke();
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i] === r && pixels[i+1] === g && pixels[i+2] === b && pixels[i+3] === a) {
                pixels[i+3] = 0;
            }
        }
        layer.dirty = true;
        this.app.canvas.render();
        this.app.history.endStroke();
    }
}
