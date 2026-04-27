export class Toolbar {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('left-toolbar');
        this.tools = [
            { name: 'pencil', icon: 'P', title: 'Pencil (B)' },
            { name: 'eraser', icon: 'E', title: 'Eraser (E)' },
            { name: 'fill', icon: 'F', title: 'Fill (G)' },
            { name: 'selector', icon: 'S', title: 'Select (M)' },
            { name: 'magicSelect', icon: 'W', title: 'Magic Select (W)' },
            { name: 'ellipseSelect', icon: 'O', title: 'Ellipse Select (E)' },
            { name: 'move', icon: 'M', title: 'Move (V)' },
            { name: 'text', icon: 'T', title: 'Text (T)' }
        ];
        this.render();
    }

    render() {
        this.element.innerHTML = this.tools.map(t =>
            `<button class="tool-btn" data-tool="${t.name}" title="${t.title}">${t.icon}</button>`
        ).join('') + `
            <div style="flex:1"></div>
            <div class="brush-size-container" title="Brush Size (use [ and ] or scroll on tool)">
                <label style="font-size:10px;color:var(--text-secondary);display:block;text-align:center">Size</label>
                <input type="number" id="brush-size" min="1" max="8" value="${this.app.state.get('brushSize')}" style="width:40px;background:var(--bg-tertiary);border:1px solid var(--border);color:var(--text-primary);padding:2px;text-align:center;font-size:11px">
            </div>
            <div id="tolerance-container" style="display:none;padding:4px;text-align:center">
                <label style="font-size:10px;color:var(--text-secondary);display:block">Tolerance</label>
                <input type="range" id="magic-tolerance" min="0" max="255" value="32" style="width:50px">
                <span id="tolerance-value" style="font-size:10px;color:var(--text-primary)">32</span>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        this.element.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.app.selectTool(btn.dataset.tool);
            });

            btn.addEventListener('wheel', (e) => {
                e.preventDefault();
                const currentTool = this.app.state.get('currentTool');
                const tool = this.app.tools[currentTool];
                if (tool && (currentTool === 'pencil' || currentTool === 'eraser')) {
                    const delta = e.deltaY > 0 ? -1 : 1;
                    const newSize = Math.max(1, Math.min(8, this.app.state.get('brushSize') + delta));
                    this.app.state.set('brushSize', newSize);
                    document.getElementById('brush-size').value = newSize;
                }
            });
        });

        const brushInput = document.getElementById('brush-size');
        if (brushInput) {
            brushInput.addEventListener('input', () => {
                let val = parseInt(brushInput.value) || 1;
                if (val % 2 === 0) val = Math.max(1, val - 1);
                this.app.state.set('brushSize', val);
                brushInput.value = val;
            });
            brushInput.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -2 : 2;
                const newSize = Math.max(1, Math.min(7, this.app.state.get('brushSize') + delta));
                this.app.state.set('brushSize', newSize);
                brushInput.value = newSize;
            });
        }

        const toleranceInput = document.getElementById('magic-tolerance');
        const toleranceValue = document.getElementById('tolerance-value');
        if (toleranceInput && toleranceValue) {
            toleranceInput.addEventListener('input', () => {
                const val = parseInt(toleranceInput.value);
                toleranceValue.textContent = val;
                if (this.app.tools.magicSelect) {
                    this.app.tools.magicSelect.tolerance = val;
                }
            });
        }
    }

    updateActive(toolName) {
        this.element.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === toolName);
        });
    }
}
