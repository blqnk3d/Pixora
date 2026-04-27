export class MagicSelectTool {
    constructor(canvas, state, history) {
        this.canvas = canvas;
        this.state = state;
        this.history = history;
        this.selection = null;
    }

    activate() {
        this.canvas.element.style.cursor = 'crosshair';
        this.updateToleranceVisibility(true);
    }

    deactivate() {
        this.updateToleranceVisibility(false);
    }

    onMouseDown(pos) {
        const layer = this.canvas.state.get('layers')[this.canvas.state.get('activeLayer')];
        if (!layer) return;

        const idx = (pos.y * this.canvas.width + pos.x) * 4;
        const targetColor = [
            layer.pixels[idx],
            layer.pixels[idx + 1],
            layer.pixels[idx + 2],
            layer.pixels[idx + 3]
        ];

        this.selection = this.getMagicSelection(layer, pos, targetColor, this.state.get('magicWandTolerance'));
        this.canvas.render();
    }

    onMouseMove(pos) {}

    onMouseUp() {}

    getMagicSelection(layer, startPos, targetColor, tolerance) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const visited = new Uint8Array(width * height);
        const mask = new Uint8Array(width * height);
        const stack = [startPos];

        const result = { x1: startPos.x, y1: startPos.y, x2: startPos.x, y2: startPos.y, mask: null };
        const toleranceSq = tolerance * tolerance;

        while (stack.length > 0) {
            const pos = stack.pop();
            const key = pos.y * width + pos.x;
            if (visited[key]) continue;
            visited[key] = 1;

            const idx = (pos.y * width + pos.x) * 4;
            const r = layer.pixels[idx], g = layer.pixels[idx+1], b = layer.pixels[idx+2], a = layer.pixels[idx+3];

            if (this.colorDistance(targetColor, [r, g, b, a]) > toleranceSq) continue;

            mask[key] = 1;
            result.x1 = Math.min(result.x1, pos.x);
            result.x2 = Math.max(result.x2, pos.x);
            result.y1 = Math.min(result.y1, pos.y);
            result.y2 = Math.max(result.y2, pos.y);

            const neighbors = [
                { x: pos.x - 1, y: pos.y },
                { x: pos.x + 1, y: pos.y },
                { x: pos.x, y: pos.y - 1 },
                { x: pos.x, y: pos.y + 1 }
            ];

            for (const n of neighbors) {
                if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height && !visited[n.y * width + n.x]) {
                    stack.push(n);
                }
            }
        }

        result.mask = mask;
        return result;
    }

    colorDistance(c1, c2) {
        const dr = c1[0] - c2[0];
        const dg = c1[1] - c2[1];
        const db = c1[2] - c2[2];
        const da = c1[3] - c2[3];
        return dr * dr + dg * dg + db * db + da * da * 0.25;
    }

    drawSelection() {
        if (!this.selection) return;
        const zoom = this.canvas.zoom;
        const ctx = this.canvas.ctx;
        const width = this.canvas.width;
        const { x1, y1, x2, y2, mask } = this.selection;

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.strokeRect(x1 * zoom, y1 * zoom, (x2 - x1 + 1) * zoom, (y2 - y1 + 1) * zoom);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x1 * zoom, y1 * zoom, (x2 - x1 + 1) * zoom, (y2 - y1 + 1) * zoom);
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let y = y1; y <= y2; y++) {
            for (let x = x1; x <= x2; x++) {
                if (mask[y * width + x]) {
                    ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
                }
            }
        }
    }

    getSelectedPixels() {
        if (!this.selection) return null;
        const { x1, y1, x2, y2, mask } = this.selection;
        const width = x2 - x1 + 1;
        const height = y2 - y1 + 1;
        const pixels = new Uint8ClampedArray(width * height * 4);
        const layer = this.canvas.state.get('layers')[this.canvas.state.get('activeLayer')];

        for (let y = y1; y <= y2; y++) {
            for (let x = x1; x <= x2; x++) {
                if (mask[y * this.canvas.width + x]) {
                    const srcIdx = (y * this.canvas.width + x) * 4;
                    const dstIdx = ((y - y1) * width + (x - x1)) * 4;
                    pixels[dstIdx] = layer.pixels[srcIdx];
                    pixels[dstIdx+1] = layer.pixels[srcIdx+1];
                    pixels[dstIdx+2] = layer.pixels[srcIdx+2];
                    pixels[dstIdx+3] = layer.pixels[srcIdx+3];
                }
            }
        }
        return { pixels, x: x1, y: y1, width, height };
    }

    updateToleranceVisibility(show) {
        const container = document.getElementById('tolerance-container');
        if (container) container.style.display = show ? 'block' : 'none';
    }
}
