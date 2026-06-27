export class LayersPanel {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('layers-panel');
        this.contextMenu = null;
        this.dragSrcIdx = null;
        this.render();
    }

    getSelectedLayers() {
        return this.app.state.get('selectedLayers');
    }

    toggleSelected(idx) {
        const selected = [...this.getSelectedLayers()];
        const pos = selected.indexOf(idx);
        if (pos >= 0) {
            selected.splice(pos, 1);
        } else {
            selected.push(idx);
        }
        this.app.state.set('selectedLayers', selected);
    }

    selectRange(from, to) {
        const layers = this.app.state.get('layers');
        const start = Math.min(from, to);
        const end = Math.max(from, to);
        const selected = [];
        for (let i = start; i <= end; i++) {
            selected.push(i);
        }
        this.app.state.set('selectedLayers', selected);
    }

    selectAll() {
        const layers = this.app.state.get('layers');
        const selected = layers.map((_, i) => i);
        this.app.state.set('selectedLayers', selected);
    }

    deleteSelectedLayers() {
        const layers = this.app.state.get('layers');
        const selected = this.getSelectedLayers();
        if (selected.length === 0) return;
        if (layers.length - selected.length < 1) return;

        this.app.history.beginStroke();
        const activeIdx = this.app.state.get('activeLayer');
        const sortedDesc = [...selected].sort((a, b) => b - a);
        sortedDesc.forEach(idx => {
            layers.splice(idx, 1);
        });
        const newActive = Math.min(activeIdx, layers.length - 1);
        this.app.state.set('activeLayer', newActive >= 0 ? newActive : 0);
        this.app.state.set('selectedLayers', []);
        this.app.state.set('layers', layers);
        this.app.canvas.render();
        this.render();
        this.app.history.endStroke();
    }

    render() {
        const layers = this.app.state.get('layers');
        const activeIdx = this.app.state.get('activeLayer');
        const selectedLayers = this.getSelectedLayers();

        this.element.innerHTML = `
            <div class="panel-title" style="display:flex;justify-content:space-between;align-items:center">
                Layers
                <button class="btn btn-small" id="add-layer-btn" title="Add Layer (Ctrl+Shift+N)">+</button>
            </div>
            <div id="layers-list">
                ${layers.map((layer, i) => {
                    const isActive = i === activeIdx;
                    const isSelected = selectedLayers.includes(i);
                    const classes = ['layer-item'];
                    if (isActive) classes.push('active');
                    if (isSelected) classes.push('selected');
                    return `
                    <div class="${classes.join(' ')}" data-index="${i}" draggable="true">
                        <span class="layer-visibility" data-index="${i}" data-action="toggle-visibility">
                            ${layer.visible ? 'V' : 'X'}
                        </span>
                        <span class="layer-name">${layer.name}</span>
                        <input type="number" class="layer-opacity" data-index="${i}" value="${Math.round(layer.opacity * 100)}" min="0" max="100" step="5">
                    </div>`;
                }).reverse().join('')}
            </div>
            <div style="padding:6px;font-size:11px;color:var(--text-secondary)">
                ${layers.length} layer(s)
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const addBtn = document.getElementById('add-layer-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addLayer());
        }

        this.element.querySelectorAll('.layer-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.dataset.action) return;
                const idx = parseInt(item.dataset.index);
                if (e.ctrlKey || e.metaKey) {
                    this.toggleSelected(idx);
                    this.app.state.set('activeLayer', idx);
                } else if (e.shiftKey) {
                    const selected = this.getSelectedLayers();
                    const last = selected.length > 0 ? selected[selected.length - 1] : this.app.state.get('activeLayer');
                    this.selectRange(last, idx);
                    this.app.state.set('activeLayer', idx);
                } else {
                    this.app.state.set('activeLayer', idx);
                    this.app.state.set('selectedLayers', [idx]);
                }
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

            input.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -5 : 5;
                let val = parseInt(input.value) + delta;
                val = Math.max(0, Math.min(100, val));
                input.value = val;
                
                const idx = parseInt(input.dataset.index);
                const layers = this.app.state.get('layers');
                layers[idx].opacity = val / 100;
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
        const targetPixels = target.pixels;
        const sourcePixels = source.pixels;
        const len = sourcePixels.length;

        for (let i = 0; i < len; i += 4) {
            if (sourcePixels[i + 3] > 0) {
                targetPixels[i] = sourcePixels[i];
                targetPixels[i + 1] = sourcePixels[i + 1];
                targetPixels[i + 2] = sourcePixels[i + 2];
                targetPixels[i + 3] = sourcePixels[i + 3];
            }
        }
        target.dirty = true;
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

    addLayer() {
        this.app.history.beginStroke();
        const layers = this.app.state.get('layers');
        layers.push(this.app.state.createLayer('Layer ' + (layers.length + 1)));
        this.app.state.set('layers', layers);
        this.app.state.set('activeLayer', layers.length - 1);
        this.render();
        this.app.history.endStroke();
    }
}
