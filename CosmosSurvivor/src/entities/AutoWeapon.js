export class AutoWeapon {
    constructor(game, parent, config) {
        this.game = game;
        this.parent = parent; // usually player
        this.config = config; // { type, damage, fireRate, range, color, name }

        this.angle = 0;
        this.distance = 50; // Distance from parent
        this.shootTimer = 0;

        // Procedural stats
        this.fireInterval = 1 / (config.fireRate || 1);
        this.damage = config.damage || 5;
        this.range = config.range || 300;
        this.color = config.color || '#ffffff';
        this.type = config.type || 'ORBITAL'; // ORBITAL, TURRET
        this.name = config.name || 'Unknown Weapon';
    }

    update(dt) {
        // Position Logic
        if (this.type === 'ORBITAL') {
            this.angle += 2 * dt; // Rotate speed
            this.x = this.parent.x + Math.cos(this.angle) * this.distance;
            this.y = this.parent.y + Math.sin(this.angle) * this.distance;
        } else if (this.type === 'TURRET') {
            // Fixed offset aiming forward or just stuck to ship
            // Let's make it float nearby
            this.x = this.parent.x + Math.cos(this.parent.angle + Math.PI / 2) * 20;
            this.y = this.parent.y + Math.sin(this.parent.angle + Math.PI / 2) * 20;
        }

        // Firing Logic
        this.shootTimer += dt;
        if (this.shootTimer >= this.fireInterval) {
            this.attemptShoot();
        }
    }

    attemptShoot() {
        // Find closest enemy
        let closest = null;
        let minDist = Infinity;

        this.game.enemies.forEach(e => {
            if (e.markedForDeletion) return;
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.range && dist < minDist) {
                minDist = dist;
                closest = e;
            }
        });

        if (closest) {
            const angle = Math.atan2(closest.y - this.y, closest.x - this.x);
            this.game.spawnProjectile(this.x, this.y, angle, 600, this.damage);
            this.shootTimer = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = this.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;

        if (this.type === 'ORBITAL') {
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(-4, -4, 8, 8);
        }

        ctx.restore();
    }
}
