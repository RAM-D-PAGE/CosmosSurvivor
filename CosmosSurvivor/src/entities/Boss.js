export class Boss {
    constructor(game, x, y, type = 'stage_boss') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type; // 'miniboss' or 'stage_boss'

        if (this.type === 'miniboss') {
            this.radius = 60;
            this.health = 500 * game.level; // Scales with player level
            this.maxHealth = this.health;
            this.speed = 80;
            this.color = '#ff00aa';
            this.value = 500;
        } else {
            this.radius = 120;
            this.health = 2000 * game.level;
            this.maxHealth = this.health;
            this.speed = 40;
            this.color = '#ff0000';
            this.value = 2000;
        }

        this.angle = 0;
        this.markedForDeletion = false;

        // Ensure Boss Bar exists in DOM or create it?
        // Ideally Game.js manages the DOM, but for now let's just use a simple approach or add it to index.html later.
        // For this iteration, we'll just be a big enemy.
    }

    update(dt) {
        // Move towards player
        const player = this.game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.angle = Math.atan2(dy, dx);

        if (dist > 1) {
            this.x += Math.cos(this.angle) * this.speed * dt;
            this.y += Math.sin(this.angle) * this.speed * dt;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.game.spawnFloatingText(this.x, this.y - this.radius, Math.round(amount), '#fff');

        if (this.health <= 0) {
            this.markedForDeletion = true;
            this.game.spawnGem(this.x, this.y, this.value);
            this.game.spawnParticles(this.x, this.y, 50, this.color);
            this.game.audio.playExplosion();

            if (this.type === 'stage_boss') {
                this.game.mapSystem.bossDefeated();
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle); // Rotate to face player

        // Draw Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        if (this.type === 'miniboss') {
            // Triangle shape
            ctx.moveTo(this.radius, 0);
            ctx.lineTo(-this.radius, this.radius);
            ctx.lineTo(-this.radius, -this.radius);
        } else {
            // Hexagon or complex shape
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const rx = Math.cos(angle) * this.radius;
                const ry = Math.sin(angle) * this.radius;
                if (i === 0) ctx.moveTo(rx, ry);
                else ctx.lineTo(rx, ry);
            }
        }
        ctx.closePath();
        ctx.fill();

        // Inner Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();

        // Health Bar (Floating above head)
        const barWidth = this.radius * 2;
        const barHeight = 10;
        const pct = Math.max(0, this.health / this.maxHealth);

        ctx.fillStyle = '#550000';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 20, barWidth, barHeight);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 20, barWidth * pct, barHeight);
    }
}
