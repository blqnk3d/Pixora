export class MenuBar {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('menu-bar');
        this.render();
    }

    render() {
        this.element.innerHTML = `
            <div class="menu-item">
                File
                <div class="menu-dropdown">
                    <div class="menu-dropdown-item" data-action="new">New... <span class="shortcut">Ctrl+N</span></div>
                    <div class="menu-dropdown-item" data-action="open">Open... <span class="shortcut">Ctrl+O</span></div>
                    <div class="menu-dropdown-item" data-action="save">Save PNG <span class="shortcut">Ctrl+S</span></div>
                    <div class="menu-dropdown-item" data-action="export-gif">Export GIF</div>
                </div>
            </div>
            <div class="menu-item">
                Edit
                <div class="menu-dropdown">
                    <div class="menu-dropdown-item" data-action="undo">Undo <span class="shortcut">Ctrl+Z</span></div>
                    <div class="menu-dropdown-item" data-action="redo">Redo <span class="shortcut">Ctrl+Y</span></div>
                    <div class="menu-dropdown-item" data-action="clear">Clear Layer</div>
                    <div class="menu-dropdown-item" data-action="resize">Resize Canvas</div>
                </div>
            </div>
            <div class="menu-item">
                View
                <div class="menu-dropdown">
                    <div class="menu-dropdown-item" data-action="zoom-in">Zoom In <span class="shortcut">Ctrl+Scroll</span></div>
                    <div class="menu-dropdown-item" data-action="zoom-out">Zoom Out</div>
                    <div class="menu-dropdown-item" data-action="grid">Toggle Grid</div>
                    <div class="menu-dropdown-item" data-action="theme">Toggle Theme</div>
                    <div class="menu-dropdown-item" data-action="retro-font">Toggle Retro Font</div>
                </div>
            </div>
            <div class="menu-item">
                Layer
                <div class="menu-dropdown">
                    <div class="menu-dropdown-item" data-action="add-layer">Add Layer</div>
                    <div class="menu-dropdown-item" data-action="remove-layer">Remove Layer</div>
                    <div class="menu-dropdown-item" data-action="duplicate-layer">Duplicate Layer</div>
                    <div class="menu-dropdown-item" data-action="merge-down">Merge Down</div>
                </div>
            </div>
            <div class="menu-item">
                Image
                <div class="menu-dropdown">
                    <div class="menu-dropdown-item" data-action="remove-bg">Remove Background</div>
                </div>
            </div>
        `;

        this.element.querySelectorAll('.menu-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleAction(item.dataset.action);
            });
        });
    }

    handleAction(action) {
        const app = this.app;
        switch (action) {
            case 'new': this.newFileDialog(); break;
            case 'open': app.importer.openFile(); break;
            case 'save': app.exporter.savePNG(); break;
            case 'export-gif': app.exporter.saveGIF(); break;
            case 'undo': app.history.undo(); break;
            case 'redo': app.history.redo(); break;
            case 'clear': this.clearLayer(); break;
            case 'resize': this.resizeDialog(); break;
            case 'zoom-in': app.canvas.zoomIn(); break;
            case 'zoom-out': app.canvas.zoomOut(); break;
            case 'grid': app.state.set('showGrid', !app.state.get('showGrid')); app.canvas.render(); break;
            case 'theme': document.body.classList.toggle('light-theme'); break;
            case 'retro-font':
                const isRetro = !app.state.get('retroFont');
                app.state.set('retroFont', isRetro);
                document.body.classList.toggle('retro-font', isRetro);
                localStorage.setItem('prity-retro-font', isRetro);
                const link = document.getElementById('retro-font-link');
                if (link) link.style.display = isRetro ? 'block' : 'none';
                break;
            case 'add-layer': this.addLayer(); break;
            case 'remove-layer': this.removeLayer(); break;
            case 'duplicate-layer': this.duplicateLayer(); break;
            case 'merge-down': this.mergeDown(); break;
            case 'remove-bg': app.history.push(); app.importer.removeBackground(); break;
        }
    }

    newFileDialog() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-title">New File</div>
                <div class="modal-field">
                    <label>Width</label>
                    <input type="number" id="new-width" value="32" min="1" max="1024">
                </div>
                <div class="modal-field">
                    <label>Height</label>
                    <input type="number" id="new-height" value="32" min="1" max="1024">
                </div>
                <div class="modal-buttons">
                    <button class="btn" id="cancel-new">Cancel</button>
                    <button class="btn btn-primary" id="confirm-new">Create</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#cancel-new').onclick = () => overlay.remove();
        overlay.querySelector('#confirm-new').onclick = () => {
            const w = parseInt(overlay.querySelector('#new-width').value) || 32;
            const h = parseInt(overlay.querySelector('#new-height').value) || 32;
            this.app.state.initCanvas(w, h);
            this.app.canvas.render();
            this.app.layersPanel.render();
            overlay.remove();
        };
    }

    resizeDialog() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-title">Resize Canvas</div>
                <div class="modal-field">
                    <label>Width</label>
                    <input type="number" id="resize-width" value="${this.app.canvas.width}" min="1" max="1024">
                </div>
                <div class="modal-field">
                    <label>Height</label>
                    <input type="number" id="resize-height" value="${this.app.canvas.height}" min="1" max="1024">
                </div>
                <div class="modal-buttons">
                    <button class="btn" id="cancel-resize">Cancel</button>
                    <button class="btn btn-primary" id="confirm-resize">Resize</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#cancel-resize').onclick = () => overlay.remove();
        overlay.querySelector('#confirm-resize').onclick = () => {
            const w = parseInt(overlay.querySelector('#resize-width').value);
            const h = parseInt(overlay.querySelector('#resize-height').value);
            this.app.canvas.resizeCanvas(w, h);
            overlay.remove();
        };
    }

    clearLayer() {
        const layers = this.app.state.get('layers');
        const activeIdx = this.app.state.get('activeLayer');
        layers[activeIdx].pixels.fill(0);
        this.app.canvas.render();
    }

    addLayer() {
        const layers = this.app.state.get('layers');
        layers.push(this.app.state.createLayer(`Layer ${layers.length + 1}`));
        this.app.state.set('layers', layers);
        this.app.layersPanel.render();
    }

    removeLayer() {
        const layers = this.app.state.get('layers');
        if (layers.length <= 1) return;
        const activeIdx = this.app.state.get('activeLayer');
        layers.splice(activeIdx, 1);
        this.app.state.set('activeLayer', Math.min(activeIdx, layers.length - 1));
        this.app.state.set('layers', layers);
        this.app.layersPanel.render();
    }

    duplicateLayer() {
        const layers = this.app.state.get('layers');
        const activeIdx = this.app.state.get('activeLayer');
        const original = layers[activeIdx];
        const copy = {
            ...original,
            name: original.name + ' Copy',
            pixels: new Uint8ClampedArray(original.pixels),
            id: Date.now() + Math.random()
        };
        layers.splice(activeIdx + 1, 0, copy);
        this.app.state.set('layers', layers);
        this.app.layersPanel.render();
    }

    mergeDown() {
        const layers = this.app.state.get('layers');
        const activeIdx = this.app.state.get('activeLayer');
        if (activeIdx === 0) return;
        const target = layers[activeIdx - 1];
        const source = layers[activeIdx];
        for (let i = 0; i < source.pixels.length; i += 4) {
            if (source.pixels[i+3] > 0) {
                target.pixels[i] = source.pixels[i];
                target.pixels[i+1] = source.pixels[i+1];
                target.pixels[i+2] = source.pixels[i+2];
                target.pixels[i+3] = source.pixels[i+3];
            }
        }
        layers.splice(activeIdx, 1);
        this.app.state.set('activeLayer', activeIdx - 1);
        this.app.state.set('layers', layers);
        this.app.canvas.render();
        this.app.layersPanel.render();
    }
}
