export class Enemy {
    constructor(game, x, y, type = 'chaser') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.type = type;
        this.markedForDeletion = false;

        // Base Stats
        this.angle = 0;

        // Difficulty Scaling
        const scale = 1 + (this.game.difficultyMultiplier || 0);

        // Type Specific stats
        if (this.type === 'chaser') {
            this.radius = 20;
            this.color = '#ff0055';
            this.speed = 100 * (1 + scale * 0.1); // 10% faster per difficulty level roughly
            this.health = 10 * scale;
            this.value = 10;
        } else if (this.type === 'shooter') {
            this.radius = 25;
            this.color = '#aa00ff';
            this.speed = 0; // Stationary-ish or slow?
            this.health = 5 * scale;
            this.value = 20;
            this.shootTimer = 0;
            this.shootInterval = 3;
        } else if (this.type === 'dasher') {
            this.radius = 15;
            this.color = '#ffaa00';
            this.speed = 250;
            this.health = 5;
            this.value = 15;
            // Dasher moves in bursts? Or just fast?
            // Let's make it just fast / weak for now for simplicity
        } else if (this.type === 'tank') {
            this.radius = 40;
            this.color = '#00ff00';
            this.speed = 40;
            this.health = 50;
            this.value = 50;
        } else if (this.type === 'swarmer') {
            this.radius = 10;
            this.color = '#00ffff';
            this.speed = 180;
            this.health = 2;
            this.value = 5;
        }
    }

    update(dt) {
        const player = this.game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.angle = Math.atan2(dy, dx);

        if (this.type === 'shooter') {
            // Shooters maintain distance
            const maintainDist = 300;
            if (dist > maintainDist) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            } else if (dist < maintainDist - 50) {
                // Backup if too close
                this.x -= (dx / dist) * this.speed * dt;
                this.y -= (dy / dist) * this.speed * dt;
            }

            // Shooting Logic
            this.shootTimer += dt;
            if (this.shootTimer > this.shootInterval) {
                // Shoot at player
                // Using Game's projectile system but marking as enemy bullet?
                // For simplicity, let's just spawn a normal projectile towards player but with distinct look?
                // Or we need EnemyProjectile class.
                // Let's reuse projectile but add 'isEnemy' flag if we had it.
                // For now, let's just make shooters 'spawn' a bullet that hurts player. 
                // Wait, Projectile.js doesn't distinguish owner. We need to add that.

                // Let's skip shooter bullet implementation for a split second to check Projectile.js
                // I'll add 'isEnemy' param to spawnProjectile in Game.js later.
                this.game.spawnProjectile(this.x, this.y, this.angle, 300, 10, true);
                this.shootTimer = 0;
            }

        } else {
            // Chaser / Dasher
            if (dist > 0) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Pulse effect
        const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
        ctx.scale(pulse, pulse);

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Shape based on type
        if (this.type === 'shooter') {
            ctx.moveTo(15, 0); ctx.lineTo(-10, 10); ctx.lineTo(-10, -10); ctx.closePath();
        } else if (this.type === 'dasher') {
            ctx.moveTo(10, 0); ctx.lineTo(-10, 5); ctx.lineTo(-10, -5); ctx.closePath();
        } else if (this.type === 'tank') {
            ctx.rect(-this.radius / 2, -this.radius / 2, this.radius, this.radius);
        } else if (this.type === 'swarmer') {
            ctx.moveTo(8, 0); ctx.lineTo(-5, 4); ctx.lineTo(-5, -4); ctx.closePath();
        } else {
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        }

        ctx.stroke();
        ctx.fillStyle = this.color + '44'; // Hex alpha
        ctx.fill();

        ctx.restore();
    }

    takeDamage(amount) {
        this.health -= amount;
        this.game.spawnFloatingText(this.x, this.y - 20, Math.round(amount), '#ffffff');
        this.game.audio.playHit();

        if (this.health <= 0) {
            this.markedForDeletion = true;
            this.game.spawnGem(this.x, this.y, this.value);
            this.game.audio.playExplosion();
        }
    }
}
