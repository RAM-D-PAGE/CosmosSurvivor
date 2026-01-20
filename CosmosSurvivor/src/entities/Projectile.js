export class Projectile {
    constructor(x, y, angle, speed, damage, isEnemy = false) {
        this.x = x;
        this.y = y;
        this.angle = angle;

        this.speed = speed || 800;
        this.damage = damage || 10;
        this.isEnemy = isEnemy;
        this.radius = 4;
        this.color = isEnemy ? '#aa00ff' : '#ffaa00';

        this.velocity = {
            x: Math.cos(angle) * this.speed,
            y: Math.sin(angle) * this.speed
        };

        this.markedForDeletion = false;
        this.lifeTime = 2.0; // Seconds
        this.timer = 0;
    }

    update(dt) {
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;

        this.timer += dt;
        if (this.timer > this.lifeTime) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Trail effect (simple)
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}
