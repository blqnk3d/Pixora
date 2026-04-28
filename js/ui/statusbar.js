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
        this.app.state.on('zoom', () => this.updateZoomDisplay());
    }

    render() {
        var toolName = this.app.state.get('currentTool');
        var formattedName = toolName.replace(/([A-Z])/g, ' $1').replace(/^./, function(str) { return str.toUpperCase(); });
        var html = '<div class="status-item"><span>Pos:</span><span id="cursor-pos">0, 0</span></div>';
        html += '<div class="status-item"><span>Zoom:</span><span id="zoom-level">1x</span></div>';
        html += '<div class="status-item"><span>Size:</span><span id="canvas-size">' + this.app.canvas.width + ' x ' + this.app.canvas.height + '</span></div>';
        html += '<div class="status-item" style="margin-left:auto"><span id="tool-name">' + formattedName + '</span></div>';
        this.element.innerHTML = html;
        this.cursorPosEl = document.getElementById('cursor-pos');
        this.zoomLevelEl = document.getElementById('zoom-level');
        this.canvasSizeEl = document.getElementById('canvas-size');
        this.toolNameEl = document.getElementById('tool-name');
    }

    updatePosition(pos) {
        this.pendingPos = pos;
        if (!this.frameRequested) {
            this.frameRequested = true;
            var self = this;
            requestAnimationFrame(function() {
                if (self.cursorPosEl && self.pendingPos) {
                    self.cursorPosEl.textContent = self.pendingPos.x + ', ' + self.pendingPos.y;
                }
                self.frameRequested = false;
                self.pendingPos = null;
            });
        }
    }

    updateZoomDisplay() {
        if (this.zoomLevelEl) {
            var z = this.app.canvas.zoom;
            var text = z < 10 ? z.toFixed(2) + 'x' : z.toFixed(1) + 'x';
            this.zoomLevelEl.textContent = text;
        }
    }

    update() {
        this.updateZoomDisplay();
    }
}