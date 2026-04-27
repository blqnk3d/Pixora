export class StatusBar {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('status-bar');
        this.cursorPosEl = null;
        this.zoomLevelEl = null;
        this.canvasSizeEl = null;
        this.toolNameEl = null;
        this.pendingPos = null;
        this.frameRequested = false;
        this.render();
    }

    render() {
        const toolName = this.app.state.get('currentTool');
        const formattedName = toolName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
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
                <span id="tool-name">${formattedName}</span>
            </div>
        `;
        this.cursorPosEl = document.getElementById('cursor-pos');
        this.zoomLevelEl = document.getElementById('zoom-level');
        this.canvasSizeEl = document.getElementById('canvas-size');
        this.toolNameEl = document.getElementById('tool-name');
    }

    updatePosition(pos) {
        this.pendingPos = pos;
        if (!this.frameRequested) {
            this.frameRequested = true;
            requestAnimationFrame(() => {
                if (this.cursorPosEl && this.pendingPos) {
                    this.cursorPosEl.textContent = `${this.pendingPos.x}, ${this.pendingPos.y}`;
                }
                this.frameRequested = false;
                this.pendingPos = null;
            });
        }
    }

    update() {
        this.render();
    }
}
