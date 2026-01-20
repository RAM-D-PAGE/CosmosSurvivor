import { CONFIG } from '../core/Config.js';

export class Boss {
    constructor(game, x, y, type = 'stage_boss') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type; // 'miniboss' or 'stage_boss'

        const diffMult = game.difficultyMult || 1;

        if (this.type === 'miniboss') {
            const cfg = CONFIG.BOSS.MINI;
            this.radius = cfg.RADIUS;
            this.health = cfg.HP_BASE * game.level * diffMult;
            this.maxHealth = this.health;
            this.speed = cfg.SPEED;
            this.color = cfg.COLOR;
            this.value = cfg.VALUE;
            this.damage = cfg.DAMAGE * diffMult;
        } else if (this.type === 'secret') {
            const cfg = CONFIG.BOSS.SECRET;
            this.radius = cfg.RADIUS;
            this.health = cfg.HP_BASE * game.level * diffMult; // Huge health
            this.maxHealth = this.health;
            this.speed = cfg.SPEED;
            this.color = cfg.COLOR;
            this.value = cfg.VALUE;
            this.damage = cfg.DAMAGE * diffMult;
        } else {
            const cfg = CONFIG.BOSS.STAGE;
            this.radius = cfg.RADIUS;
            this.health = cfg.HP_BASE * game.level * diffMult;
            this.maxHealth = this.health;
            this.speed = cfg.SPEED;
            this.color = cfg.COLOR;
            this.value = cfg.VALUE;
            this.damage = cfg.DAMAGE * diffMult;
        }

        this.angle = 0;
        this.markedForDeletion = false;

        // Status Effects
        this.frozen = false;
        this.frozenTimer = 0;
        this.poisoned = false;
        this.poisonDamage = 0;
        this.poisonTimer = 0;
        this.doomed = false;
        this.doomTimer = 0;
        this.doomDamage = 0;
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
                // Handle death in next frame via check or immediate
                this.takeDamage(0); // Trigger death logic
                return;
            }
        }

        if (this.doomed) {
            this.doomTimer -= dt;
            if (this.doomTimer <= 0) {
                this.takeDamage(this.doomDamage);
                this.game.spawnFloatingText(this.x, this.y, "DOOM!", '#660000');
                this.doomed = false;
            }
        }

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
                // Trigger Mystical Drop
                if (this.game.triggerBossReward) {
                    this.game.triggerBossReward();
                }
            } else if (this.type === 'secret') {
                // Trigger Massive Reward
                if (this.game.triggerSecretReward) {
                    this.game.triggerSecretReward();
                }
            } else if (this.type === 'miniboss') {
                // Miniboss drops a guaranteed upgrade chest (just exp for now + maybe direct upgrade?)
                // For now just high XP is fine, maybe a large magnet pickup?
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
    // Status effect methods
    freeze(duration) {
        this.frozen = true;
        this.frozenTimer = duration;
        // Boss resists freeze duration? Maybe half it?
        this.frozenTimer = duration * 0.5;
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
