export class FillTool {
    constructor(canvas, state) {
        this.canvas = canvas;
        this.state = state;
    }

    activate() {
        this.canvas.element.style.cursor = 'copy';
    }

    deactivate() {}

    onMouseDown(pos) {
        const color = this.state.get('currentColor');
        const targetColor = this.canvas.getPixel(pos.x, pos.y);
        if (this.colorsEqual(targetColor, color)) return;

        window.app.history.beginStroke();
        this.floodFill(pos.x, pos.y, targetColor, color);
        this.canvas.render();
        window.app.history.endStroke();
    }

    onMouseMove() {}
    onMouseUp() {}

    colorsEqual(a, b) {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
    }

    floodFill(startX, startY, targetColor, fillColor) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const visited = new Uint8Array(width * height);

        const stack = [[startX, startY]];

        while (stack.length > 0) {
            const [x, y] = stack.pop();
            if (x < 0 || y < 0 || x >= width || y >= height) continue;
            const idx = y * width + x;
            if (visited[idx]) continue;

            const currentColor = this.canvas.getPixel(x, y);
            if (!this.colorsEqual(currentColor, targetColor)) continue;

            visited[idx] = 1;
            this.canvas.setPixel(x, y, fillColor);

            stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
        }
    }
}
