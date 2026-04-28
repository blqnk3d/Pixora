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

        let content = '<div class="panel-title">Tool Settings</div>';

        if (currentTool === 'pencil' || currentTool === 'eraser') {
            content += `
                <div class="setting-row">
                    <label style="font-size:11px;color:var(--text-secondary)">Brush Size</label>
                    <div style="display:flex;align-items:center;gap:4px">
                        <button class="size-btn" data-delta="-2" title="Decrease ( [ )">-</button>
                        <input type="number" id="brush-size" min="1" max="31" value="${brushSize}" style="width:48px;background:var(--bg-tertiary);border:1px solid var(--border);color:var(--text-primary);padding:2px;text-align:center;font-size:12px">
                        <button class="size-btn" data-delta="2" title="Increase ( ] )">+</button>
                    </div>
                </div>
                <div class="setting-row">
                    <label style="font-size:11px;color:var(--text-secondary)">Preview</label>
                    <div style="display:flex;align-items:center;gap:4px">
                        <div id="brush-preview" style="width:${brushSize + 4}px;height:${brushSize + 4}px;background:var(--text-primary);border-radius:50%;opacity:0.7"></div>
                        <span style="font-size:11px;color:var(--text-secondary)">${brushSize}px</span>
                    </div>
                </div>
            `;
        } else if (currentTool === 'magicSelect') {
            content += `
                <div class="setting-row">
                    <label style="font-size:11px;color:var(--text-secondary)">Tolerance</label>
                    <div style="display:flex;align-items:center;gap:4px">
                        <input type="number" id="magic-tolerance" min="0" max="255" value="${tolerance}" style="width:60px;background:var(--bg-tertiary);border:1px solid var(--border);color:var(--text-primary);padding:2px;text-align:center;font-size:12px">
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
        const brushInput = document.getElementById('brush-size');
        if (brushInput) {
            brushInput.addEventListener('input', () => {
                let val = parseInt(brushInput.value) || 1;
                if (val % 2 === 0) val = Math.max(1, val - 1);
                this.app.state.set('brushSize', val);
                brushInput.value = val;
                this.updatePreview(val);
            });

            brushInput.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -2 : 2;
                const newSize = Math.max(1, Math.min(31, this.app.state.get('brushSize') + delta));
                this.app.state.set('brushSize', newSize);
                brushInput.value = newSize;
                this.updatePreview(newSize);
            });
        }

        this.element.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const delta = parseInt(btn.dataset.delta);
                const newSize = Math.max(1, Math.min(31, this.app.state.get('brushSize') + delta));
                this.app.state.set('brushSize', newSize);
                if (brushInput) brushInput.value = newSize;
                this.updatePreview(newSize);
            });
        });

        const toleranceInput = document.getElementById('magic-tolerance');
        if (toleranceInput) {
            toleranceInput.addEventListener('input', () => {
                let val = parseInt(toleranceInput.value) || 0;
                val = Math.max(0, Math.min(255, val));
                this.app.state.set('magicWandTolerance', val);
                toleranceInput.value = val;
            });
        }
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
