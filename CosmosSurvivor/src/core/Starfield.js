export class Starfield {
    constructor(game) {
        this.game = game;
        this.stars = [];
        this.starCount = 100;
        this.initParams();
        this.resize(); // Generate stars
    }

    initParams() {
        this.colors = ['#ffffff', '#ffe9c4', '#d4fbff'];
    }

    resize() {
        this.stars = [];
        for (let i = 0; i < this.starCount; i++) {
            this.stars.push({
                x: Math.random() * this.game.canvas.width,
                y: Math.random() * this.game.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.5 + 0.1,
                alpha: Math.random(),
                flickerSpeed: Math.random() * 0.05 + 0.01
            });
        }
    }

    update(dt, camera) {
        if (!camera) return;

        // Parallax effect: Stars move opposite to camera movement
        // Actually, we just render stars shifted by camera position % canvas size
        // But for distinct layers we can just move them.

        // Simpler approach for infinite scrolling starfield:
        // Update star positions relative to camera? 
        // Or just let them be background.

        // Let's make them static in world space but wrap around the camera view?
        // Or pure parallax.

        // Let's do simple parallax scrolling.
        // We need velocity from player to drift them, OR just use camera pos (offset).

        // Let's use internal offset based on camera.
        this.offsetX = -camera.x * 0.5; // 0.5 parallax factor
        this.offsetY = -camera.y * 0.5;
    }

    draw(ctx) {
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

        this.stars.forEach(star => {
            // Calculate position with wrapping
            // (star.x + offsetX) % width
            let x = (star.x + this.offsetX) % this.game.canvas.width;
            let y = (star.y + this.offsetY) % this.game.canvas.height;

            if (x < 0) x += this.game.canvas.width;
            if (y < 0) y += this.game.canvas.height;

            ctx.globalAlpha = Math.abs(star.alpha);
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(x, y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }
}
