export class ToolSettings {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('tool-settings');
        this.render();
    }

    render() {
        const currentTool = this.app.state.get('currentTool');
        const brushSize = this.app.state.get('brushSize');
        const tolerance = this.app.state.get('magicWandTolerance');
        const blurIntensity = this.app.state.get('blurIntensity');
        const smudgeIntensity = this.app.state.get('smudgeIntensity');

        let content = '<div class="panel-title">Tool Settings</div>';

        const brushTools = ['pencil', 'eraser', 'blur', 'clone', 'heal', 'smudge', 'line', 'rect', 'circle', 'adjust'];

        if (brushTools.includes(currentTool)) {
            const brushShape = this.app.state.get('brushShape') || 'square';
            content += `
                <div class="setting-row">
                    <label style="font-size:11px;color:var(--text-secondary)">Brush Size</label>
                    <div style="display:flex;align-items:center;gap:4px">
                        <button class="size-btn" data-delta="-2" title="Decrease ( [ )">-</button>
                        <input type="number" id="brush-size" class="scrollable-setting" data-setting="brushSize" data-min="1" data-max="31" data-step="2" value="${brushSize}" style="width:48px;background:var(--bg-tertiary);border:1px solid var(--border);color:var(--text-primary);padding:2px;text-align:center;font-size:12px">
                        <button class="size-btn" data-delta="2" title="Increase ( ] )">+</button>
                    </div>
                </div>
                <div class="setting-row">
                    <label style="font-size:11px;color:var(--text-secondary)">Shape</label>
                    <div style="display:flex;gap:4px">
                        <button class="shape-btn${brushShape === 'square' ? ' active' : ''}" data-shape="square" title="Square" style="padding:2px 6px;font-size:11px">■</button>
                        <button class="shape-btn${brushShape === 'circle' ? ' active' : ''}" data-shape="circle" title="Circle" style="padding:2px 6px;font-size:11px">●</button>
                    </div>
                </div>
            `;

            if (currentTool === 'blur') {
                content += `
                    <div class="setting-row">
                        <label style="font-size:11px;color:var(--text-secondary)">Intensity</label>
                        <div style="display:flex;align-items:center;gap:4px">
                            <input type="number" id="blur-intensity" class="scrollable-setting" data-setting="blurIntensity" data-min="0" data-max="100" data-step="5" value="${blurIntensity}" style="width:60px;background:var(--bg-tertiary);border:1px solid var(--border);color:var(--text-primary);padding:2px;text-align:center;font-size:12px">
                        </div>
                    </div>
                `;
            } else if (currentTool === 'smudge') {
                content += `
                    <div class="setting-row">
                        <label style="font-size:11px;color:var(--text-secondary)">Mixing</label>
                        <div style="display:flex;align-items:center;gap:4px">
                            <input type="number" id="smudge-intensity" class="scrollable-setting" data-setting="smudgeIntensity" data-min="0" data-max="100" data-step="5" value="${smudgeIntensity}" style="width:60px;background:var(--bg-tertiary);border:1px solid var(--border);color:var(--text-primary);padding:2px;text-align:center;font-size:12px">
                        </div>
                    </div>
                `;
            } else if (currentTool === 'adjust') {
                content += `
                    <div class="setting-row">
                        <label style="font-size:11px;color:var(--text-secondary)">Brightness</label>
                        <input type="number" class="scrollable-setting" data-setting="brightness" data-min="-100" data-max="100" data-step="5" value="${this.app.state.get('brightness')}" style="width:60px">
                        <label style="font-size:11px;color:var(--text-secondary)">Contrast</label>
                        <input type="number" class="scrollable-setting" data-setting="contrast" data-min="0" data-max="200" data-step="5" value="${this.app.state.get('contrast')}" style="width:60px">
                    </div>
                `;
            } else if (currentTool === 'clone' || currentTool === 'heal') {
                const toolObj = this.app.tools[currentTool];
                const hasSource = toolObj && toolObj.sourcePos;
                content += `
                    <div class="setting-row">
                        <span style="font-size:10px;color:${hasSource ? 'var(--accent)' : 'var(--text-secondary)'}">${hasSource ? 'Source Set' : 'Ctrl+Click to set source'}</span>
                    </div>
                `;
            }
        } else if (currentTool === 'magicSelect') {
            content += `
                <div class="setting-row">
                    <label style="font-size:11px;color:var(--text-secondary)">Tolerance</label>
                    <div style="display:flex;align-items:center;gap:4px">
                        <input type="number" id="magic-tolerance" class="scrollable-setting" data-setting="magicWandTolerance" data-min="0" data-max="255" data-step="5" value="${tolerance}" style="width:60px;background:var(--bg-tertiary);border:1px solid var(--border);color:var(--text-primary);padding:2px;text-align:center;font-size:12px">
                    </div>
                </div>
            `;
        } else {
            content += `<div style="font-size:11px;color:var(--text-secondary);padding:8px 0">No settings for this tool</div>`;
        }

        this.element.innerHTML = content;
        this.bindEvents();
    }

    bindEvents() {
        // Generic numeric inputs with scroll wheel support
        this.element.querySelectorAll('.scrollable-setting').forEach(input => {
            const settingName = input.dataset.setting;
            const min = parseInt(input.dataset.min) || 0;
            const max = parseInt(input.dataset.max) || 255;
            const step = parseInt(input.dataset.step) || 1;

            input.addEventListener('input', () => {
                let val = parseInt(input.value) || 0;
                val = Math.max(min, Math.min(max, val));
                if (settingName === 'brushSize' && val % 2 === 0) val = Math.max(1, val - 1);
                this.app.state.set(settingName, val);
                input.value = val;
                if (settingName === 'brushSize') this.updatePreview(val);
            });

            input.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -step : step;
                let val = this.app.state.get(settingName) + delta;
                val = Math.max(min, Math.min(max, val));
                this.app.state.set(settingName, val);
                input.value = val;
                if (settingName === 'brushSize') this.updatePreview(val);
            });
        });

        this.element.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const delta = parseInt(btn.dataset.delta);
                const newSize = Math.max(1, Math.min(31, this.app.state.get('brushSize') + delta));
                this.app.state.set('brushSize', newSize);
                const brushInput = document.getElementById('brush-size');
                if (brushInput) brushInput.value = newSize;
                this.updatePreview(newSize);
            });
        });

        this.element.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const shape = btn.dataset.shape;
                this.app.state.set('brushShape', shape);
                this.render();
            });
        });
    }

    updatePreview(size) {
        const preview = document.getElementById('brush-preview');
        if (preview) {
            preview.style.width = (size + 4) + 'px';
            preview.style.height = (size + 4) + 'px';
            const sizeLabel = preview.nextElementSibling;
            if (sizeLabel) sizeLabel.textContent = size + 'px';
        }
    }
}
