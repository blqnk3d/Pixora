export class FillTool {
    constructor(canvas, state, history) {
        this.canvas = canvas;
        this.state = state;
        this.history = history;
    }

    activate() {
        this.canvas.element.style.cursor = 'copy';
    }

    deactivate() {}

    onMouseDown(pos) {
        const color = this.state.get('currentColor');
        const layerIdx = this.state.get('activeLayer');
        const layers = this.state.get('layers');
        if (!layers || layerIdx === undefined || !layers[layerIdx]) return;
        const layer = layers[layerIdx];
        const width = this.canvas.width;
        const height = this.canvas.height;
        const startX = pos.x;
        const startY = pos.y;
        const startIdx = (startY * width + startX) * 4;
        const targetColor = [layer.pixels[startIdx], layer.pixels[startIdx+1], layer.pixels[startIdx+2], layer.pixels[startIdx+3]];

        if (this.colorsEqual(targetColor, color)) return;

        this.history.beginStroke();
        this.floodFill(layer, width, height, startX, startY, targetColor, color);
        layer.dirty = true;
        layer.scaledCanvas = null;
        this.canvas.render();
        this.history.endStroke();
    }

    onMouseMove() {}
    onMouseUp() {}

    colorsEqual(a, b) {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
    }

    floodFill(layer, width, height, startX, startY, targetColor, fillColor) {
        const pixels = layer.pixels;
        const visited = new Uint8Array(width * height);

        const stack = [[startX, startY]];
        const t0 = targetColor[0], t1 = targetColor[1], t2 = targetColor[2], t3 = targetColor[3];
        const f0 = fillColor[0], f1 = fillColor[1], f2 = fillColor[2], f3 = fillColor[3];

        while (stack.length > 0) {
            const [x, y] = stack.pop();
            if (x < 0 || y < 0 || x >= width || y >= height) continue;
            const idx = y * width + x;
            if (visited[idx]) continue;

            const pIdx = idx * 4;
            if (pixels[pIdx] !== t0 || pixels[pIdx+1] !== t1 || pixels[pIdx+2] !== t2 || pixels[pIdx+3] !== t3) continue;

            if (window.app.hasSelection() && !window.app.isPointInSelection(x, y)) {
                continue;
            }

            visited[idx] = 1;
            pixels[pIdx] = f0;
            pixels[pIdx+1] = f1;
            pixels[pIdx+2] = f2;
            pixels[pIdx+3] = f3;

            stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
        }
    }
}
