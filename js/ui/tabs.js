export class TabBar {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('tab-bar');
        this.render();
    }

    render() {
        const docs = this.app.documents;
        const activeIdx = this.app.activeDocIndex;

        this.element.innerHTML = docs.map((doc, i) => {
            const active = i === activeIdx ? ' active' : '';
            const dirty = doc.dirty ? ' dirty' : '';
            const title = doc.getTitle();
            return `
                <div class="tab${active}${dirty}" data-index="${i}">
                    <span class="tab-title">${title}</span>
                    <span class="tab-close" data-index="${i}">&times;</span>
                </div>
            `;
        }).join('');

        this.element.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('mousedown', (e) => {
                if (e.target.classList.contains('tab-close')) return;
                const idx = parseInt(tab.dataset.index);
                this.app.switchToDocument(idx);
            });
        });

        this.element.querySelectorAll('.tab-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                this.app.closeDocument(idx);
            });
        });
    }
}
