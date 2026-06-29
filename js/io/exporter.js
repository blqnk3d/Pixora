export class Exporter {
    constructor(app) {
        this.app = app;
    }

    showSavePopup() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-title">Export / Save</div>
                <div style="display:flex;flex-direction:column;gap:12px;padding:8px 0">
                    <button class="btn" id="save-pixora" style="text-align:left;padding:12px 16px">
                        <div style="font-weight:600">Save Project (.pixora)</div>
                        <div style="font-size:11px;color:var(--text-secondary);margin-top:4px">Custom format with layers, editable later</div>
                    </button>
                    <button class="btn" id="save-png" style="text-align:left;padding:12px 16px">
                        <div style="font-weight:600">Export PNG</div>
                        <div style="font-size:11px;color:var(--text-secondary);margin-top:4px">Flat image, all layers merged</div>
                    </button>
                </div>
                <div class="modal-buttons">
                    <button class="btn" id="cancel-save">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('#cancel-save').onclick = () => overlay.remove();
        overlay.querySelector('#save-pixora').onclick = () => { this.savePixora(); overlay.remove(); };
        overlay.querySelector('#save-png').onclick = () => { this.savePNG(); overlay.remove(); };
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    }

    async saveWithPicker(blob, defaultName, ext) {
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: defaultName + '.' + ext,
                    types: [{
                        description: ext.toUpperCase() + ' file',
                        accept: { [blob.type]: ['.' + ext] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                return;
            } catch (e) {
                if (e.name === 'AbortError') return;
            }
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultName + '.' + ext;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    showLoadPopup() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-title">Open File</div>
                <div style="display:flex;flex-direction:column;gap:12px;padding:8px 0">
                    <button class="btn" id="load-pixora" style="text-align:left;padding:12px 16px">
                        <div style="font-weight:600">Open Project (.pixora)</div>
                        <div style="font-size:11px;color:var(--text-secondary);margin-top:4px">Load a saved project with all layers</div>
                    </button>
                    <button class="btn" id="load-image" style="text-align:left;padding:12px 16px">
                        <div style="font-weight:600">Open Image</div>
                        <div style="font-size:11px;color:var(--text-secondary);margin-top:4px">Import PNG, JPEG, or GIF</div>
                    </button>
                </div>
                <div class="modal-buttons">
                    <button class="btn" id="cancel-load">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('#cancel-load').onclick = () => overlay.remove();
        overlay.querySelector('#load-pixora').onclick = () => { this.app.importer.openPixora(); overlay.remove(); };
        overlay.querySelector('#load-image').onclick = () => { this.app.importer.openFile(); overlay.remove(); };
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    }

    savePixora() {
        const canvasWidth = this.app.canvas.width;
        const canvasHeight = this.app.canvas.height;
        const layers = this.app.state.get('layers');

        const data = {
            version: 1,
            format: 'pixora',
            canvasWidth,
            canvasHeight,
            layers: layers.map(layer => ({
                name: layer.name,
                pixels: Array.from(layer.pixels),
                visible: layer.visible,
                opacity: layer.opacity
            }))
        };

        const json = JSON.stringify(data);
        const blob = new Blob([json], { type: 'application/json' });
        this.saveWithPicker(blob, 'pixel-art', 'pixora');
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
        
        exportCanvas.toBlob((blob) => {
            this.saveWithPicker(blob, 'pixel-art', 'png');
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

        if (a === 0) return;

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
