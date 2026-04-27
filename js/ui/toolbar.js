export class Toolbar {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('left-toolbar');
        this.tools = [
            { name: 'pencil', title: 'Pencil (B)' },
            { name: 'eraser', title: 'Eraser (E)' },
            { name: 'fill', title: 'Fill (G)' },
            { name: 'selector', title: 'Select (M)' }
        ];
        this.render();
    }

    render() {
        const icons = { pencil: 'P', eraser: 'E', fill: 'F', selector: 'S' };
        this.element.innerHTML = this.tools.map(t =>
            `<button class="tool-btn" data-tool="${t.name}" title="${t.title}">${icons[t.name]}</button>`
        ).join('');

        this.element.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.app.selectTool(btn.dataset.tool);
            });
        });
    }

    updateActive(toolName) {
        this.element.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === toolName);
        });
    }
}
