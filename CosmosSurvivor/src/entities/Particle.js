export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speed = Math.random() * 100 + 50;
        this.angle = Math.random() * Math.PI * 2;
        this.velocity = {
            x: Math.cos(this.angle) * this.speed,
            y: Math.sin(this.angle) * this.speed
        };
        this.lifeTime = Math.random() * 0.5 + 0.3;
        this.life = this.lifeTime;
        this.alpha = 1;
        this.markedForDeletion = false;
    }

    update(dt) {
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;

        this.life -= dt;
        this.alpha = this.life / this.lifeTime;

        if (this.life <= 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
