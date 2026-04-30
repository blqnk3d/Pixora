import { icons } from './icons.js';

export class Toolbar {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('left-toolbar');
        this.selectionTools = [
            { name: 'selector', icon: icons.selector, title: 'Rect Select (M)', shortcut: 'M' },
            { name: 'ellipseSelect', icon: icons.ellipseSelect, title: 'Ellipse Select (O)', shortcut: 'O' },
            { name: 'lassoSelect', icon: icons.lassoSelect, title: 'Lasso Select (L)', shortcut: 'L' },
            { name: 'magicSelect', icon: icons.magicSelect, title: 'Magic Select (W)', shortcut: 'W' }
        ];
        this.activeSelectionToolIndex = 0;
        this.tools = [
            { name: 'pencil', icon: icons.pencil, title: 'Pencil (B)', shortcut: 'B' },
            { name: 'eraser', icon: icons.eraser, title: 'Eraser (E)', shortcut: 'E' },
            { name: 'picker', icon: icons.picker, title: 'Color Picker (I)', shortcut: 'I' },
            { name: 'fill', icon: icons.fill, title: 'Fill (G)', shortcut: 'G' },
            { name: 'selectionGroup', isGroup: true },
            { name: 'move', icon: icons.move, title: 'Move (V)', shortcut: 'V' },
            { name: 'text', icon: icons.text, title: 'Text (T)', shortcut: 'T' }
        ];
        this.render();
    }

    render() {
        this.element.innerHTML = this.tools.map(t => {
            if (t.isGroup) {
                const activeTool = this.selectionTools[this.activeSelectionToolIndex];
                return `<button class="tool-btn" data-tool="${activeTool.name}" data-group="selection" title="${activeTool.title}">${activeTool.icon}<span class="tool-shortcut">${activeTool.shortcut}</span><div class="tool-group-indicator"></div></button>`;
            }
            return `<button class="tool-btn" data-tool="${t.name}" title="${t.title}">${t.icon}<span class="tool-shortcut">${t.shortcut}</span></button>`;
        }).join('') + `
            <div style="flex:1"></div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        this.element.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.app.selectTool(btn.dataset.tool);
            });

            btn.addEventListener('contextmenu', (e) => {
                if (btn.dataset.group === 'selection') {
                    e.preventDefault();
                    this.showSelectionGroupMenu(e, btn);
                }
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

    showSelectionGroupMenu(e, anchor) {
        const menu = document.createElement('div');
        menu.className = 'tool-context-menu';
        menu.style.position = 'fixed';
        menu.style.left = (e.clientX) + 'px';
        menu.style.top = (e.clientY) + 'px';
        menu.style.zIndex = '3000';
        
        this.selectionTools.forEach((tool, index) => {
            const item = document.createElement('div');
            item.className = 'tool-context-menu-item' + (index === this.activeSelectionToolIndex ? ' active' : '');
            item.innerHTML = `${tool.icon} <span>${tool.title}</span>`;
            item.onclick = () => {
                this.activeSelectionToolIndex = index;
                this.render();
                this.app.selectTool(tool.name);
                menu.remove();
            };
            menu.appendChild(item);
        });

        document.body.appendChild(menu);
        
        const closeMenu = (ev) => {
            if (!menu.contains(ev.target)) {
                menu.remove();
                document.removeEventListener('mousedown', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closeMenu), 10);
    }

    updateActive(toolName) {
        let foundInGroup = false;
        this.selectionTools.forEach((t, i) => {
            if (t.name === toolName) {
                this.activeSelectionToolIndex = i;
                foundInGroup = true;
            }
        });

        if (foundInGroup) {
            this.render();
        }

        this.element.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === toolName);
        });
    }
}
