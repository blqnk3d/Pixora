export class StatusBar {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('status-bar');
        this.render();
    }

    render() {
        this.element.innerHTML = `
            <div class="status-item">
                <span>Pos:</span>
                <span id="cursor-pos">0, 0</span>
            </div>
            <div class="status-item">
                <span>Zoom:</span>
                <span id="zoom-level">${this.app.canvas.zoom}x</span>
            </div>
            <div class="status-item">
                <span>Size:</span>
                <span id="canvas-size">${this.app.canvas.width} × ${this.app.canvas.height}</span>
            </div>
            <div class="status-item" style="margin-left:auto">
                <span id="tool-name">${this.app.state.get('currentTool')}</span>
            </div>
        `;
    }

    updatePosition(pos) {
        const posEl = document.getElementById('cursor-pos');
        if (posEl) {
            posEl.textContent = pos ? `${pos.x}, ${pos.y}` : '---';
        }
    }

    update() {
        this.render();
    }
}
