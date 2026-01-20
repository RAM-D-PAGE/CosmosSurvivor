import { CONFIG } from '../core/Config.js';

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

        // Difficulty & Wave Scaling
        const diffMult = game.difficultyMult || 1;
        const waveMult = game.mapSystem?.getDamageMultiplier() || 1;
        const scale = 1 + (this.game.difficultyMultiplier || 0);

        // Get config for this enemy type
        const typeKey = type.toUpperCase().replace('_', '');
        const cfg = CONFIG.ENEMY[typeKey] || CONFIG.ENEMY.CHASER;

        // Apply base stats with scaling
        this.radius = cfg.RADIUS || 20;
        this.color = cfg.COLOR || '#ff0055';
        this.speed = (cfg.SPEED || 100) * (1 + scale * 0.1);
        this.health = (cfg.HP || 10) * scale * diffMult;
        this.maxHealth = this.health;
        this.value = cfg.VALUE || 10;
        this.contactDamage = (cfg.DAMAGE || 10) * waveMult * diffMult;

        // Status Effects
        this.frozen = false;
        this.frozenTimer = 0;
        this.poisoned = false;
        this.poisonDamage = 0;
        this.poisonTimer = 0;
        this.doomed = false;
        this.doomTimer = 0;
        this.doomDamage = 0;

        // Type-specific properties
        this.initTypeSpecific(type, cfg, scale);
    }

    initTypeSpecific(type, cfg, scale) {
        switch (type) {
            case 'shooter':
                this.shootTimer = 0;
                this.shootInterval = 2.5 / scale;
                break;

            case 'duplicator':
                this.hasDuplicated = false;
                this.duplicateThreshold = 0.5; // Duplicate at 50% HP
                break;

            case 'adaptive':
                this.lastDamageType = null;
                this.resistances = {};
                this.adaptTimer = 0;
                break;

            case 'bomber':
                this.explosionRadius = 80;
                this.explosionDamage = 30 * scale;
                break;

            case 'teleporter':
                this.teleportTimer = 0;
                this.teleportInterval = 2.0;
                break;

            case 'shielder':
                this.shieldMax = cfg.SHIELD || 30;
                this.shield = this.shieldMax;
                this.shieldRegenTimer = 0;
                break;

            case 'healer':
                this.healRadius = 150;
                this.healRate = cfg.HEAL_RATE || 5;
                this.healTimer = 0;
                break;

            case 'swarm_mother':
                this.spawnTimer = 0;
                this.spawnInterval = 5.0;
                this.maxSpawns = 3;
                break;

            case 'ghost':
                this.evasionChance = cfg.EVASION || 0.5;
                this.phaseTimer = 0;
                this.isPhased = false;
                break;
        }
    }

    update(dt) {
        // Status effect processing
        if (this.frozen) {
            this.frozenTimer -= dt;
            if (this.frozenTimer <= 0) {
                this.frozen = false;
            }
            return; // Can't move while frozen
        }

        if (this.poisoned) {
            this.poisonTimer -= dt;
            this.health -= this.poisonDamage * dt;
            if (this.poisonTimer <= 0) {
                this.poisoned = false;
            }
            if (this.health <= 0) {
                this.die();
                return;
            }
        }

        if (this.doomed) {
            this.doomTimer -= dt;
            if (this.doomTimer <= 0) {
                this.takeDamage(this.doomDamage, 'doom');
                this.doomed = false;
            }
        }

        const player = this.game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.angle = Math.atan2(dy, dx);

        // Type-specific behavior
        this.updateBehavior(dt, player, dx, dy, dist);
    }

    updateBehavior(dt, player, dx, dy, dist) {
        switch (this.type) {
            case 'shooter':
                this.updateShooter(dt, dx, dy, dist);
                break;

            case 'duplicator':
                this.updateDuplicator(dt, dx, dy, dist);
                break;

            case 'adaptive':
                this.updateAdaptive(dt, dx, dy, dist);
                break;

            case 'bomber':
                this.updateBomber(dt, dx, dy, dist);
                break;

            case 'teleporter':
                this.updateTeleporter(dt, dx, dy, dist);
                break;

            case 'shielder':
                this.updateShielder(dt, dx, dy, dist);
                break;

            case 'healer':
                this.updateHealer(dt, dx, dy, dist);
                break;

            case 'swarm_mother':
                this.updateSwarmMother(dt, dx, dy, dist);
                break;

            case 'ghost':
                this.updateGhost(dt, dx, dy, dist);
                break;

            default:
                // Default chaser behavior
                if (dist > 0) {
                    this.x += (dx / dist) * this.speed * dt;
                    this.y += (dy / dist) * this.speed * dt;
                }
        }
    }

    updateShooter(dt, dx, dy, dist) {
        const maintainDist = 300;
        if (dist > maintainDist) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        } else if (dist < maintainDist - 50) {
            this.x -= (dx / dist) * this.speed * dt;
            this.y -= (dy / dist) * this.speed * dt;
        }

        this.shootTimer += dt;
        if (this.shootTimer > this.shootInterval) {
            this.game.spawnProjectile(this.x, this.y, this.angle, 300, 10, true);
            this.shootTimer = 0;
        }
    }

    updateDuplicator(dt, dx, dy, dist) {
        // Chase player
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        // Duplicate at threshold
        if (!this.hasDuplicated && this.health <= this.maxHealth * this.duplicateThreshold) {
            this.hasDuplicated = true;
            this.duplicate();
        }
    }

    duplicate() {
        // Spawn 2 smaller copies
        for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const offset = 30;
            const newX = this.x + Math.cos(angle) * offset;
            const newY = this.y + Math.sin(angle) * offset;

            const clone = new Enemy(this.game, newX, newY, 'swarmer');
            clone.health = this.health * 0.3;
            clone.maxHealth = clone.health;
            clone.value = Math.floor(this.value * 0.3);
            this.game.enemies.push(clone);
        }
        this.game.spawnFloatingText(this.x, this.y, "SPLIT!", "#ff88ff");
    }

    updateAdaptive(dt, dx, dy, dist) {
        // Chase player
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        // Cycle colors to show adaptation
        if (this.lastDamageType) {
            this.adaptTimer += dt;
            if (this.adaptTimer > 0.5) {
                this.color = this.getAdaptColor();
            }
        }
    }

    getAdaptColor() {
        const colors = {
            'fire': '#ff4400',
            'ice': '#00ccff',
            'poison': '#00ff00',
            'physical': '#888888'
        };
        return colors[this.lastDamageType] || '#88ffff';
    }

    updateBomber(dt, dx, dy, dist) {
        // Rush towards player
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        // Explode on contact (handled in collision, but visual warning)
        if (dist < 50) {
            this.color = '#ff0000'; // Flash red when close
        }
    }

    updateTeleporter(dt, dx, dy, dist) {
        this.teleportTimer += dt;

        if (this.teleportTimer >= this.teleportInterval) {
            this.teleport();
            this.teleportTimer = 0;
        }

        // Slow movement between teleports
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * 0.3 * dt;
            this.y += (dy / dist) * this.speed * 0.3 * dt;
        }
    }

    teleport() {
        const player = this.game.player;
        const angle = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 150;

        this.x = player.x + Math.cos(angle) * dist;
        this.y = player.y + Math.sin(angle) * dist;

        this.game.spawnParticles(this.x, this.y, 5, '#8800ff');
    }

    updateShielder(dt, dx, dy, dist) {
        // Slow chase
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        // Regenerate shield
        if (this.shield < this.shieldMax) {
            this.shieldRegenTimer += dt;
            if (this.shieldRegenTimer >= 3.0) {
                this.shield = Math.min(this.shieldMax, this.shield + 5 * dt);
            }
        }
    }

    updateHealer(dt, dx, dy, dist) {
        // Stay at medium range
        const idealDist = 200;
        if (dist > idealDist + 50) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        } else if (dist < idealDist - 50) {
            this.x -= (dx / dist) * this.speed * dt;
            this.y -= (dy / dist) * this.speed * dt;
        }

        // Heal nearby allies
        this.healTimer += dt;
        if (this.healTimer >= 1.0) {
            this.healNearbyAllies();
            this.healTimer = 0;
        }
    }

    healNearbyAllies() {
        this.game.enemies.forEach(e => {
            if (e === this || e.markedForDeletion) return;

            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.healRadius && e.health < e.maxHealth) {
                e.health = Math.min(e.maxHealth, e.health + this.healRate);
                this.game.spawnFloatingText(e.x, e.y, `+${this.healRate}`, '#00ff88');
            }
        });
    }

    updateSwarmMother(dt, dx, dy, dist) {
        // Slow chase
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        // Spawn swarmers
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnSwarmers();
            this.spawnTimer = 0;
        }
    }

    spawnSwarmers() {
        for (let i = 0; i < this.maxSpawns; i++) {
            const angle = (Math.PI * 2 / this.maxSpawns) * i;
            const offset = this.radius + 20;
            const newX = this.x + Math.cos(angle) * offset;
            const newY = this.y + Math.sin(angle) * offset;

            this.game.enemies.push(new Enemy(this.game, newX, newY, 'swarmer'));
        }
        this.game.spawnFloatingText(this.x, this.y, "SWARM!", "#ffff00");
    }

    updateGhost(dt, dx, dy, dist) {
        // Faster chase
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        // Phase effect
        this.phaseTimer += dt;
        this.isPhased = Math.sin(this.phaseTimer * 3) > 0.5;

        // Visual alpha change
        this.alpha = this.isPhased ? 0.3 : 0.8;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Apply freeze visual
        if (this.frozen) {
            ctx.filter = 'hue-rotate(180deg)';
        }

        // Apply ghost alpha
        if (this.type === 'ghost') {
            ctx.globalAlpha = this.alpha || 0.8;
        }

        // Pulse effect
        const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
        ctx.scale(pulse, pulse);

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();

        // Shape based on type
        this.drawShape(ctx);

        ctx.stroke();
        ctx.fillStyle = this.color + '44';
        ctx.fill();

        // Draw shield for shielder
        if (this.type === 'shielder' && this.shield > 0) {
            ctx.strokeStyle = '#0088ff88';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2 * (this.shield / this.shieldMax));
            ctx.stroke();
        }

        // Draw doom mark
        if (this.doomed) {
            ctx.strokeStyle = '#660000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();

        // Draw health bar
        if (this.maxHealth > 0) {
            const barWidth = this.radius * 2;
            const barHeight = 4;
            const pct = Math.max(0, this.health / this.maxHealth);

            ctx.fillStyle = '#330000';
            ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth, barHeight);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth * pct, barHeight);
        }
    }

    drawShape(ctx) {
        switch (this.type) {
            case 'shooter':
                ctx.moveTo(15, 0);
                ctx.lineTo(-10, 10);
                ctx.lineTo(-10, -10);
                ctx.closePath();
                break;

            case 'dasher':
                ctx.moveTo(10, 0);
                ctx.lineTo(-10, 5);
                ctx.lineTo(-10, -5);
                ctx.closePath();
                break;

            case 'tank':
                ctx.rect(-this.radius / 2, -this.radius / 2, this.radius, this.radius);
                break;

            case 'swarmer':
                ctx.moveTo(8, 0);
                ctx.lineTo(-5, 4);
                ctx.lineTo(-5, -4);
                ctx.closePath();
                break;

            case 'duplicator':
                // Diamond shape
                ctx.moveTo(0, -this.radius);
                ctx.lineTo(this.radius, 0);
                ctx.lineTo(0, this.radius);
                ctx.lineTo(-this.radius, 0);
                ctx.closePath();
                break;

            case 'adaptive':
                // Hexagon
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const rx = Math.cos(angle) * this.radius;
                    const ry = Math.sin(angle) * this.radius;
                    if (i === 0) ctx.moveTo(rx, ry);
                    else ctx.lineTo(rx, ry);
                }
                ctx.closePath();
                break;

            case 'bomber':
                // Spiky circle
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI / 4) * i;
                    const r = i % 2 === 0 ? this.radius : this.radius * 0.6;
                    const rx = Math.cos(angle) * r;
                    const ry = Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(rx, ry);
                    else ctx.lineTo(rx, ry);
                }
                ctx.closePath();
                break;

            case 'teleporter':
                // Star shape
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                    const rx = Math.cos(angle) * this.radius;
                    const ry = Math.sin(angle) * this.radius;
                    if (i === 0) ctx.moveTo(rx, ry);
                    else ctx.lineTo(rx, ry);
                }
                ctx.closePath();
                break;

            case 'shielder':
                // Pentagon
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                    const rx = Math.cos(angle) * this.radius;
                    const ry = Math.sin(angle) * this.radius;
                    if (i === 0) ctx.moveTo(rx, ry);
                    else ctx.lineTo(rx, ry);
                }
                ctx.closePath();
                break;

            case 'healer':
                // Plus sign
                const w = this.radius * 0.4;
                ctx.rect(-w, -this.radius, w * 2, this.radius * 2);
                ctx.rect(-this.radius, -w, this.radius * 2, w * 2);
                break;

            case 'swarm_mother':
                // Large circle with inner circles
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                break;

            case 'ghost':
                // Wavy ghost shape
                ctx.moveTo(0, -this.radius);
                ctx.quadraticCurveTo(this.radius, -this.radius / 2, this.radius, 0);
                ctx.quadraticCurveTo(this.radius, this.radius, 0, this.radius);
                ctx.quadraticCurveTo(-this.radius, this.radius, -this.radius, 0);
                ctx.quadraticCurveTo(-this.radius, -this.radius / 2, 0, -this.radius);
                break;

            default:
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        }
    }

    takeDamage(amount, damageType = 'physical') {
        // Ghost evasion
        if (this.type === 'ghost' && this.isPhased && Math.random() < this.evasionChance) {
            this.game.spawnFloatingText(this.x, this.y - 20, "MISS", '#ffffff88');
            return;
        }

        // Shield absorption for shielder
        if (this.type === 'shielder' && this.shield > 0) {
            const shieldDamage = Math.min(this.shield, amount);
            this.shield -= shieldDamage;
            amount -= shieldDamage;
            this.shieldRegenTimer = 0;

            if (amount <= 0) {
                this.game.spawnFloatingText(this.x, this.y - 20, "BLOCKED", '#0088ff');
                return;
            }
        }

        // Adaptive resistance
        if (this.type === 'adaptive' && this.resistances[damageType]) {
            amount *= (1 - this.resistances[damageType]);
        }

        this.health -= amount;
        this.game.spawnFloatingText(this.x, this.y - 20, Math.round(amount), '#ffffff');
        this.game.audio.playHit();

        // Build resistance for adaptive
        if (this.type === 'adaptive') {
            this.lastDamageType = damageType;
            this.resistances[damageType] = Math.min(0.5, (this.resistances[damageType] || 0) + 0.1);
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.markedForDeletion = true;

        // Apply wave EXP multiplier
        const expMult = this.game.mapSystem?.getExpMultiplier() || 1;
        const finalValue = Math.floor(this.value * expMult);

        this.game.spawnGem(this.x, this.y, finalValue);
        this.game.audio.playExplosion();

        // Special death effects
        if (this.type === 'bomber') {
            this.explode();
        }
    }

    explode() {
        // Damage player if in range
        const player = this.game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.explosionRadius && !player.isInvulnerable) {
            player.hp -= this.explosionDamage;
            this.game.spawnFloatingText(player.x, player.y, `-${this.explosionDamage}`, '#ff4400');
        }

        // Visual explosion
        this.game.spawnParticles(this.x, this.y, 20, '#ff4400');
        this.game.spawnFloatingText(this.x, this.y, "BOOM!", '#ff4400');
    }

    // Status effect methods
    freeze(duration) {
        this.frozen = true;
        this.frozenTimer = duration;
        this.game.audio.playFreeze();
    }

    poison(damagePerSec, duration) {
        this.poisoned = true;
        this.poisonDamage = damagePerSec;
        this.poisonTimer = duration;
    }

    markForDoom(damage, delay) {
        this.doomed = true;
        this.doomDamage = damage;
        this.doomTimer = delay;
    }
}
