import { icons } from './icons.js';

export class Toolbar {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('left-toolbar');
        this.tools = [
            { name: 'pencil', icon: icons.pencil, title: 'Pencil (B)', shortcut: 'B' },
            { name: 'eraser', icon: icons.eraser, title: 'Eraser (E)', shortcut: 'E' },
            { name: 'picker', icon: icons.picker, title: 'Color Picker (I)', shortcut: 'I' },
            { name: 'fill', icon: icons.fill, title: 'Fill (G)', shortcut: 'G' },
            { name: 'selector', icon: icons.selector, title: 'Rect Select (M)', shortcut: 'M' },
            { name: 'ellipseSelect', icon: icons.ellipseSelect, title: 'Ellipse Select (O)', shortcut: 'O' },
            { name: 'magicSelect', icon: icons.magicSelect, title: 'Magic Select (W)', shortcut: 'W' },
            { name: 'move', icon: icons.move, title: 'Move (V)', shortcut: 'V' },
            { name: 'text', icon: icons.text, title: 'Text (T)', shortcut: 'T' }
        ];
        this.render();
    }

    render() {
        this.element.innerHTML = this.tools.map(t =>
            `<button class="tool-btn" data-tool="${t.name}" title="${t.title}">${t.icon}<span class="tool-shortcut">${t.shortcut}</span></button>`
        ).join('') + `
            <div style="flex:1"></div>
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
                if (currentTool === 'pencil' || currentTool === 'eraser') {
                    const delta = e.deltaY > 0 ? -2 : 2;
                    const newSize = Math.max(1, Math.min(31, this.app.state.get('brushSize') + delta));
                    this.app.state.set('brushSize', newSize);
                    this.app.toolSettings.render();
                }
            });
        });
    }

    updateActive(toolName) {
        this.element.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === toolName);
        });
    }
}
