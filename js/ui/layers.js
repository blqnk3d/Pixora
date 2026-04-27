export class LayersPanel {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('layers-panel');
        this.contextMenu = null;
        this.dragSrcIdx = null;
        this.render();
    }

    render() {
        const layers = this.app.state.get('layers');
        const activeIdx = this.app.state.get('activeLayer');

        this.element.innerHTML = `
            <div class="panel-title">Layers</div>
            <div id="layers-list">
                ${layers.map((layer, i) => `
                    <div class="layer-item ${i === activeIdx ? 'active' : ''}" data-index="${i}" draggable="true">
                        <span class="layer-visibility" data-index="${i}" data-action="toggle-visibility">
                            ${layer.visible ? 'V' : 'X'}
                        </span>
                        <span class="layer-name">${layer.name}</span>
                        <input type="number" class="layer-opacity" data-index="${i}" value="${Math.round(layer.opacity * 100)}" min="0" max="100" step="5">
                    </div>
                `).reverse().join('')}
            </div>
            <div style="padding:6px;font-size:11px;color:var(--text-secondary)">
                ${layers.length} layer(s)
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        this.element.querySelectorAll('.layer-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.dataset.action) return;
                const idx = parseInt(item.dataset.index);
                this.app.state.set('activeLayer', idx);
                this.render();
                this.app.canvas.render();
            });

            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const idx = parseInt(item.dataset.index);
                this.showContextMenu(e.clientX, e.clientY, idx);
            });

            item.addEventListener('dragstart', (e) => {
                this.dragSrcIdx = parseInt(item.dataset.index);
                item.style.opacity = '0.5';
            });

            item.addEventListener('dragend', () => {
                item.style.opacity = '1';
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                item.style.borderTop = '2px solid var(--accent)';
            });

            item.addEventListener('dragleave', () => {
                item.style.borderTop = '';
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.style.borderTop = '';
                const dstIdx = parseInt(item.dataset.index);
                if (this.dragSrcIdx !== null && this.dragSrcIdx !== dstIdx) {
                    const layers = this.app.state.get('layers');
                    const [moved] = layers.splice(this.dragSrcIdx, 1);
                    layers.splice(dstIdx, 0, moved);
                    this.app.state.set('activeLayer', dstIdx);
                    this.app.state.set('layers', layers);
                    this.app.canvas.render();
                    this.render();
                }
                this.dragSrcIdx = null;
            });
        });

        this.element.querySelectorAll('.layer-visibility').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                const layers = this.app.state.get('layers');
                layers[idx].visible = !layers[idx].visible;
                this.app.state.set('layers', layers);
                this.render();
                this.app.canvas.render();
            });
        });

        this.element.querySelectorAll('.layer-opacity').forEach(input => {
            input.addEventListener('change', () => {
                const idx = parseInt(input.dataset.index);
                const layers = this.app.state.get('layers');
                layers[idx].opacity = parseInt(input.value) / 100;
                this.app.state.set('layers', layers);
                this.app.canvas.render();
            });
        });

        document.addEventListener('click', () => this.hideContextMenu());
    }

    showContextMenu(x, y, layerIdx) {
        this.hideContextMenu();

        const menu = document.createElement('div');
        menu.className = 'layer-context-menu';
        menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:4px;padding:4px 0;min-width:160px;z-index:3000;box-shadow:0 4px 12px rgba(0,0,0,0.3)`;

        const items = [
            { label: 'Rename', action: () => this.renameLayer(layerIdx) },
            { label: 'Duplicate', action: () => this.duplicateLayer(layerIdx) },
            { label: 'Delete', action: () => this.deleteLayer(layerIdx) },
            { label: 'Merge Down', action: () => this.mergeDown(layerIdx) },
            { label: 'Clear', action: () => this.clearLayer(layerIdx) }
        ];

        items.forEach(({ label, action }) => {
            const item = document.createElement('div');
            item.textContent = label;
            item.style.cssText = 'padding:6px 12px;cursor:pointer;font-size:12px;color:var(--text-primary)';
            item.onmouseenter = () => item.style.background = 'var(--bg-tertiary)';
            item.onmouseleave = () => item.style.background = 'transparent';
            item.onclick = () => { action(); this.hideContextMenu(); };
            menu.appendChild(item);
        });

        document.body.appendChild(menu);
        this.contextMenu = menu;
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.remove();
            this.contextMenu = null;
        }
    }

    renameLayer(idx) {
        const layers = this.app.state.get('layers');
        const name = prompt('Layer name:', layers[idx].name);
        if (name) {
            layers[idx].name = name;
            this.app.state.set('layers', layers);
            this.render();
        }
    }

    duplicateLayer(idx) {
        const layers = this.app.state.get('layers');
        const original = layers[idx];
        const copy = {
            ...original,
            name: original.name + ' Copy',
            pixels: new Uint8ClampedArray(original.pixels),
            id: Date.now() + Math.random()
        };
        layers.splice(idx + 1, 0, copy);
        this.app.state.set('layers', layers);
        this.render();
    }

    deleteLayer(idx) {
        const layers = this.app.state.get('layers');
        if (layers.length <= 1) return;
        layers.splice(idx, 1);
        this.app.state.set('activeLayer', Math.min(this.app.state.get('activeLayer'), layers.length - 1));
        this.app.state.set('layers', layers);
        this.app.canvas.render();
        this.render();
    }

    mergeDown(idx) {
        const layers = this.app.state.get('layers');
        if (idx === 0) return;
        const target = layers[idx - 1];
        const source = layers[idx];
        for (let i = 0; i < source.pixels.length; i += 4) {
            if (source.pixels[i+3] > 0) {
                target.pixels[i] = source.pixels[i];
                target.pixels[i+1] = source.pixels[i+1];
                target.pixels[i+2] = source.pixels[i+2];
                target.pixels[i+3] = source.pixels[i+3];
            }
        }
        layers.splice(idx, 1);
        this.app.state.set('activeLayer', idx - 1);
        this.app.state.set('layers', layers);
        this.app.canvas.render();
        this.render();
    }

    clearLayer(idx) {
        const layers = this.app.state.get('layers');
        layers[idx].pixels.fill(0);
        layers[idx].dirty = true;
        this.app.state.set('layers', layers);
        this.app.canvas.render();
    }
}
