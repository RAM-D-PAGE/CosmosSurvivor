export class Gem {
    constructor(game, x, y, value) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = 6;
        this.color = '#00ffaa';
        this.markedForDeletion = false;

        this.magnetRange = 150;
        this.speed = 400;
        this.velocity = { x: 0, y: 0 };
    }

    update(dt) {
        const player = this.game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;

        // Magnetic Pull
        const range = player.pickupRange || 150;
        if (distSq < range * range) {
            const dist = Math.sqrt(distSq);
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
