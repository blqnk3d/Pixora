export class ColorPanel {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('color-panel');
        this.hue = 0;
        this.saturation = 100;
        this.lightness = 50;
        this.updateHSLFromRGB();
        this.render();
    }

    updateHSLFromRGB() {
        const [r, g, b] = this.app.state.get('currentColor');
        const rgb = [r/255, g/255, b/255];
        const max = Math.max(...rgb);
        const min = Math.min(...rgb);
        this.lightness = (max + min) / 2 * 100;
        if (max === min) {
            this.hue = this.saturation = 0;
        } else {
            const d = max - min;
            this.saturation = this.lightness > 50 ? d / (2 - max - min) * 100 : d / (max + min) * 100;
            switch (max) {
                case rgb[0]: this.hue = ((rgb[1] - rgb[2]) / d + (rgb[1] < rgb[2] ? 6 : 0)) * 60; break;
                case rgb[1]: this.hue = ((rgb[2] - rgb[0]) / d + 2) * 60; break;
                case rgb[2]: this.hue = ((rgb[0] - rgb[1]) / d + 4) * 60; break;
            }
        }
    }

    hslToRgb(h, s, l) {
        s /= 100; l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); };
        return [Math.round(f(0)*255), Math.round(f(8)*255), Math.round(f(4)*255)];
    }

    render() {
        const color = this.app.state.get('currentColor');
        const hex = this.rgbToHex(color);
        const palette = this.app.state.get('palette');
        const recent = this.app.state.get('recentColors');

        this.element.innerHTML = `
            <div class="panel-title">Color</div>
            <div class="color-picker-row">
                <div class="color-preview" id="color-preview" style="background:${hex}"></div>
                <div class="color-inputs">
                    <div class="color-input-row">
                        <label>R</label>
                        <input type="number" id="color-r" value="${color[0]}" min="0" max="255">
                        <label>G</label>
                        <input type="number" id="color-g" value="${color[1]}" min="0" max="255">
                        <label>B</label>
                        <input type="number" id="color-b" value="${color[2]}" min="0" max="255">
                    </div>
                    <div class="color-input-row">
                        <label>A</label>
                        <input type="number" id="color-a" value="${color[3]}" min="0" max="255">
                        <label>#</label>
                        <input type="text" id="color-hex" value="${hex}" style="flex:2">
                    </div>
                </div>
            </div>
            <div class="panel-title">HSL Picker</div>
            <div class="hsl-picker">
                <div class="hue-slider-container">
                    <label>Hue</label>
                    <input type="range" id="hue-slider" min="0" max="360" value="${Math.round(this.hue)}">
                </div>
                <div class="sat-light-container">
                    <label>Sat/Light</label>
                    <canvas id="sat-light-canvas" width="200" height="150"></canvas>
                    <input type="range" id="light-slider" min="0" max="100" value="${Math.round(this.lightness)}">
                </div>
            </div>
            <div class="panel-title">Palette</div>
            <div class="palette" id="palette-grid">
                ${palette.map(c => `<div class="palette-color" data-color="${c.join(',')}" style="background:${this.rgbToHex(c)}"></div>`).join('')}
            </div>
            ${recent.length > 0 ? `
            <div class="panel-title" style="margin-top:8px">Recent</div>
            <div class="palette" id="recent-colors">
                ${recent.map(c => `<div class="palette-color" data-color="${c.join(',')}" style="background:${this.rgbToHex(c)}"></div>`).join('')}
            </div>
            ` : ''}
            <div style="margin-top:8px">
                <button class="btn" id="import-palette" style="width:100%;font-size:11px">Import Palette</button>
            </div>
        `;

        this.renderSatLightCanvas();
        this.bindEvents();
    }

    renderSatLightCanvas() {
        const canvas = document.getElementById('sat-light-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const s = x / w * 100;
                const l = (1 - y / h) * 100;
                const [r, g, b] = this.hslToRgb(this.hue, s, l);
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    bindEvents() {
        const updateColor = () => {
            const r = parseInt(document.getElementById('color-r').value) || 0;
            const g = parseInt(document.getElementById('color-g').value) || 0;
            const b = parseInt(document.getElementById('color-b').value) || 0;
            const a = parseInt(document.getElementById('color-a').value) || 255;
            const color = [r, g, b, a];
            this.app.state.set('currentColor', color);
            this.app.state.addRecentColor(color);
            this.updateColorPreview();
            this.updateHSLFromRGB();
            this.renderSatLightCanvas();
        };

        ['color-r', 'color-g', 'color-b', 'color-a'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', updateColor);
        });

        const hexInput = document.getElementById('color-hex');
        if (hexInput) {
            hexInput.addEventListener('change', () => {
                const color = this.hexToRgb(hexInput.value);
                if (color) {
                    this.app.state.set('currentColor', color);
                    this.app.state.addRecentColor(color);
                    this.render();
                }
            });
        }

        const hueSlider = document.getElementById('hue-slider');
        if (hueSlider) {
            hueSlider.addEventListener('input', () => {
                this.hue = parseInt(hueSlider.value);
                this.renderSatLightCanvas();
                const [r, g, b] = this.hslToRgb(this.hue, this.saturation, this.lightness);
                const color = [r, g, b, this.app.state.get('currentColor')[3]];
                this.app.state.set('currentColor', color);
                this.app.state.addRecentColor(color);
                this.updateColorPreview();
            });
        }

        const lightSlider = document.getElementById('light-slider');
        if (lightSlider) {
            lightSlider.addEventListener('input', () => {
                this.lightness = parseInt(lightSlider.value);
                const [r, g, b] = this.hslToRgb(this.hue, this.saturation, this.lightness);
                const color = [r, g, b, this.app.state.get('currentColor')[3]];
                this.app.state.set('currentColor', color);
                this.app.state.addRecentColor(color);
                this.updateColorPreview();
            });
        }

        const satLightCanvas = document.getElementById('sat-light-canvas');
        if (satLightCanvas) {
            satLightCanvas.addEventListener('click', (e) => {
                const rect = satLightCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.saturation = x / satLightCanvas.width * 100;
                this.lightness = (1 - y / satLightCanvas.height) * 100;
                const [r, g, b] = this.hslToRgb(this.hue, this.saturation, this.lightness);
                const color = [r, g, b, this.app.state.get('currentColor')[3]];
                this.app.state.set('currentColor', color);
                this.app.state.addRecentColor(color);
                this.updateColorPreview();
            });
        }

        document.querySelectorAll('.palette-color').forEach(el => {
            el.addEventListener('click', () => {
                const color = el.dataset.color.split(',').map(Number);
                this.app.state.set('currentColor', color);
                this.app.state.addRecentColor(color);
                this.render();
            });
        });

        const importBtn = document.getElementById('import-palette');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importPalette());
        }
    }

    updateColorPreview() {
        const color = this.app.state.get('currentColor');
        const preview = document.getElementById('color-preview');
        const hexInput = document.getElementById('color-hex');
        if (preview) preview.style.background = this.rgbToHex(color);
        if (hexInput) hexInput.value = this.rgbToHex(color);
        ['color-r', 'color-g', 'color-b', 'color-a'].forEach((id, i) => {
            const el = document.getElementById(id);
            if (el) el.value = color[i] || 0;
        });
    }

    importPalette() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.png,.jpg,.jpeg,.gif,.hex,.txt';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.name.endsWith('.hex') || file.name.endsWith('.txt')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const text = ev.target.result;
                    const colors = text.match(/#?[0-9a-fA-F]{6}/g) || [];
                    const palette = colors.slice(0, 64).map(c => {
                        const hex = c.replace('#', '');
                        return [
                            parseInt(hex.substr(0,2),16),
                            parseInt(hex.substr(2,2),16),
                            parseInt(hex.substr(4,2),16),
                            255
                        ];
                    });
                    if (palette.length > 0) {
                        this.app.state.set('palette', palette);
                        this.render();
                    }
                };
                reader.readAsText(file);
            } else {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = Math.min(img.width, 256);
                        canvas.height = Math.min(img.height, 256);
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                        const colorSet = new Set();
                        const palette = [];
                        for (let i = 0; i < data.length && palette.length < 64; i += 4) {
                            const key = `${data[i]},${data[i+1]},${data[i+2]}`;
                            if (!colorSet.has(key)) {
                                colorSet.add(key);
                                palette.push([data[i], data[i+1], data[i+2], 255]);
                            }
                        }
                        this.app.state.set('palette', palette);
                        this.render();
                    };
                    img.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    rgbToHex(color) {
        return '#' + color.slice(0, 3).map(c => c.toString(16).padStart(2, '0')).join('');
    }

    hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        if (hex.length === 6) {
            return [
                parseInt(hex.substr(0, 2), 16),
                parseInt(hex.substr(2, 2), 16),
                parseInt(hex.substr(4, 2), 16),
                255
            ];
        }
        return null;
    }
}
