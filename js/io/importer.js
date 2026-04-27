export class Importer {
    constructor(app) {
        this.app = app;
        this.fileInput = null;
    }

    openFile() {
        if (!this.fileInput) {
            this.fileInput = document.createElement('input');
            this.fileInput.type = 'file';
            this.fileInput.accept = 'image/png,image/jpeg,image/gif';
            this.fileInput.onchange = (e) => this.loadFile(e.target.files[0]);
        }
        this.fileInput.click();
    }

    loadFile(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const width = img.naturalWidth || img.width;
                const height = img.naturalHeight || img.height;

                this.app.state.initCanvas(width, height);

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = width;
                tempCanvas.height = height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(img, 0, 0, width, height);

                const imageData = tempCtx.getImageData(0, 0, width, height);
                const layer = this.app.state.get('layers')[0];
                layer.pixels = new Uint8ClampedArray(imageData.data);
                layer.dirty = true;
                layer.scaledCanvas = null;

                this.app.canvas.render();
                this.app.layersPanel.render();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    removeBackground() {
        const layers = this.app.state.get('layers');
        const activeIdx = this.app.state.get('activeLayer');
        const layer = layers[activeIdx];
        const width = this.app.canvas.width;
        const height = this.app.canvas.height;

        const floodFill = (startX, startY, visited) => {
            const stack = [[startX, startY]];
            const bgColor = [layer.pixels[(startY * width + startX) * 4],
                            layer.pixels[(startY * width + startX) * 4 + 1],
                            layer.pixels[(startY * width + startX) * 4 + 2]];

            while (stack.length > 0) {
                const [x, y] = stack.pop();
                if (x < 0 || y < 0 || x >= width || y >= height) continue;
                const idx = y * width + x;
                if (visited[idx]) continue;

                const pIdx = idx * 4;
                if (Math.abs(layer.pixels[pIdx] - bgColor[0]) > 10 ||
                    Math.abs(layer.pixels[pIdx+1] - bgColor[1]) > 10 ||
                    Math.abs(layer.pixels[pIdx+2] - bgColor[2]) > 10) continue;

                visited[idx] = 1;
                layer.pixels[pIdx+3] = 0;

                stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
            }
        };

        const visited = new Uint8Array(width * height);
        const corners = [
            [0, 0], [width-1, 0], [0, height-1], [width-1, height-1]
        ];

        corners.forEach(([x, y]) => {
            if (!visited[y * width + x]) {
                floodFill(x, y, visited);
            }
        });

        this.app.canvas.render();
    }
}
