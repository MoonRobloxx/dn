// HTMLCraft - браузерная строительная игра
class HTMLCraft {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Блоки с оригинальными текстурами
        this.blocks = {
            dirt: { color: '#8B7355', name: 'Грязь' },
            grass: { color: '#2D5016', name: 'Трава' },
            stone: { color: '#808080', name: 'Камень' },
            wood: { color: '#A0522D', name: 'Дерево' },
            sand: { color: '#F4A460', name: 'Песок' },
            water: { color: '#1E90FF', name: 'Вода' },
            leaves: { color: '#228B22', name: 'Листья' },
            ore: { color: '#FFD700', name: 'Руда' }
        };
        
        this.selectedBlock = 'grass';
        this.world = new Map();
        this.camera = { x: 0, y: 0, zoom: 40 };
        this.player = { x: 5, y: 5 };
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        
        this.setupEventListeners();
        this.generateWorld();
        this.createInventory();
        this.gameLoop();
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 100;
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight - 100;
        });
    }
    
    setupEventListeners() {
        // Клавиатура
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Мышь
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            if (e.button === 0) { // ЛКМ - поместить
                this.placeBlock();
            } else if (e.button === 2) { // ПКМ - удалить
                this.removeBlock();
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
        
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    generateWorld() {
        // Генерируем процедурный мир
        for (let x = -20; x < 20; x++) {
            for (let y = -20; y < 20; y++) {
                const key = `${x},${y}`;
                
                // Простой шум для разнообразия
                const noise = Math.sin(x * 0.5) * Math.cos(y * 0.5) + Math.sin(x * y * 0.1);
                const rand = Math.random() + noise;
                
                if (y > 0) {
                    if (rand > 0.3) this.world.set(key, 'grass');
                    else if (rand > 0.1) this.world.set(key, 'dirt');
                    else this.world.set(key, 'sand');
                } else if (y === 0) {
                    this.world.set(key, 'stone');
                } else {
                    if (rand > 0.5) this.world.set(key, 'stone');
                    else if (rand > 0.2) this.world.set(key, 'ore');
                    else this.world.set(key, 'dirt');
                }
            }
        }
    }
    
    createInventory() {
        const inventory = document.getElementById('inventory');
        inventory.innerHTML = '';
        
        Object.entries(this.blocks).forEach(([key, block]) => {
            const item = document.createElement('div');
            item.className = 'block-item';
            if (key === this.selectedBlock) item.classList.add('selected');
            item.style.backgroundColor = block.color;
            item.title = block.name;
            item.textContent = block.name[0];
            
            item.addEventListener('click', () => {
                this.selectedBlock = key;
                this.createInventory();
            });
            
            inventory.appendChild(item);
        });
    }
    
    update() {
        const speed = 0.15;
        
        if (this.keys['w'] || this.keys['arrowup']) this.camera.y -= speed;
        if (this.keys['s'] || this.keys['arrowdown']) this.camera.y += speed;
        if (this.keys['a'] || this.keys['arrowleft']) this.camera.x -= speed;
        if (this.keys['d'] || this.keys['arrowright']) this.camera.x += speed;
        
        // Зум (Q/E)
        if (this.keys['q']) this.camera.zoom *= 0.98;
        if (this.keys['e']) this.camera.zoom *= 1.02;
        this.camera.zoom = Math.max(10, Math.min(100, this.camera.zoom));
        
        // Обновляем координаты
        document.getElementById('coords').textContent = 
            `X: ${Math.round(this.camera.x)} Y: ${Math.round(this.camera.y)}`;
    }
    
    getBlockAtMouse() {
        const blockSize = this.camera.zoom;
        const worldX = Math.floor((this.mouse.x - this.canvas.width / 2) / blockSize + this.camera.x);
        const worldY = Math.floor((this.mouse.y - this.canvas.height / 2) / blockSize + this.camera.y);
        return { x: worldX, y: worldY, key: `${worldX},${worldY}` };
    }
    
    placeBlock() {
        const block = this.getBlockAtMouse();
        this.world.set(block.key, this.selectedBlock);
    }
    
    removeBlock() {
        const block = this.getBlockAtMouse();
        this.world.delete(block.key);
    }
    
    draw() {
        // Небо
        this.ctx.fillStyle = 'linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Сетка мира
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 0.5;
        
        const blockSize = this.camera.zoom;
        const startX = Math.floor(this.camera.x - this.canvas.width / (2 * blockSize));
        const startY = Math.floor(this.camera.y - this.canvas.height / (2 * blockSize));
        const endX = Math.ceil(this.camera.x + this.canvas.width / (2 * blockSize));
        const endY = Math.ceil(this.camera.y + this.canvas.height / (2 * blockSize));
        
        // Рисуем блоки
        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                const key = `${x},${y}`;
                const blockType = this.world.get(key);
                
                if (blockType) {
                    const screenX = (x - this.camera.x) * blockSize + this.canvas.width / 2;
                    const screenY = (y - this.camera.y) * blockSize + this.canvas.height / 2;
                    
                    // Основной цвет блока
                    this.ctx.fillStyle = this.blocks[blockType].color;
                    this.ctx.fillRect(screenX, screenY, blockSize, blockSize);
                    
                    // Тень для глубины
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                    this.ctx.fillRect(screenX, screenY + blockSize - 2, blockSize, 2);
                    
                    // Граница
                    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(screenX, screenY, blockSize, blockSize);
                }
            }
        }
        
        // Указатель на блок под мышью
        const hovered = this.getBlockAtMouse();
        const screenX = (hovered.x - this.camera.x) * blockSize + this.canvas.width / 2;
        const screenY = (hovered.y - this.camera.y) * blockSize + this.canvas.height / 2;
        
        this.ctx.strokeStyle = '#FFFF00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(screenX, screenY, blockSize, blockSize);
        
        // Координаты блока
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`[${hovered.x}, ${hovered.y}]`, screenX + 5, screenY + 15);
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Запуск игры
window.addEventListener('DOMContentLoaded', () => {
    new HTMLCraft();
});