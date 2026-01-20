import { CONFIG } from '../core/Config.js';

export class Player {
    constructor(game) {
        this.game = game;
        this.x = game.canvas.width / 2;
        this.y = game.canvas.height / 2;
        this.radius = 15;
        this.color = '#00f0ff';

        // Physics
        this.velocity = { x: 0, y: 0 };
        this.acceleration = 1500;
        this.friction = 0.92;
        this.maxSpeed = CONFIG.PLAYER.BASE_SPEED;

        // Combat Stats
        this.baseFireRate = CONFIG.PLAYER.BASE_FIRE_RATE;
        this.fireRate = this.baseFireRate;
        this.damage = CONFIG.PLAYER.BASE_DAMAGE;
        this.projectileCount = 1;
        this.projectileSpeed = 800;
        this.shootTimer = 0;
        this.fireRateMultiplier = 1.0;

        // Dash Stats
        this.dashSpeed = CONFIG.PLAYER.DASH_SPEED;
        this.dashDuration = CONFIG.PLAYER.DASH_DURATION;
        this.dashCooldown = CONFIG.PLAYER.DASH_COOLDOWN;
        this.dashTimer = 0;
        this.dashCooldownTimer = 0;
        this.isDashing = false;
        this.isInvulnerable = false;

        // Health & Energy
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.maxEnergy = 100;
        this.energy = this.maxEnergy;
        this.energyRegen = 20; // per second
        this.pickupRange = 150; // Base Magnet Range
        this.hpRegen = 0; // Base HP Regen
        this.dashCount = 1; // Number of dash charges
        this.dashCharges = this.dashCount; // Current available dashes

        // Stats
        this.angle = 0;

        // Skill System
        this.skills = {}; // { 'damage': { level: 0, rarityVal: 1.0, count: 0 } }
        this.baseStats = {
            damage: CONFIG.PLAYER.BASE_DAMAGE,
            fireRate: CONFIG.PLAYER.BASE_FIRE_RATE,
            maxSpeed: CONFIG.PLAYER.BASE_SPEED,
            projectileSpeed: 800,
            projectileCount: 1,
            maxHp: 100,
            pickupRange: 150,
            hpRegen: 0
        };
    }

    addSkill(id, val, rarityMultiplier) {
        if (!this.skills[id]) {
            this.skills[id] = { val: 0, count: 0, rarityMult: 0 };
        }

        // Stack Logic
        if (this.skills[id].count < 5) {
            this.skills[id].count++;
        }

        // Rarity Logic (Always take highest rarity multiplier seen)
        if (rarityMultiplier > this.skills[id].rarityMult) {
            this.skills[id].rarityMult = rarityMultiplier;
        }

        // Raw Value Accumulation (Simplification for now: Pre-calculated value passed in)
        // Wait, to support "Upgrade", we need base value.
        // Let's stick to the prompt: "Card Upgrade (Common -> Epic)" replaces old.
        // Value = BaseAmt * Rarity * Stacks?
        // Or just allow direct add, but if Rarity Upgrade, we boost the previous stacks?
        // Complex. Let's do: Value += val.
        // But if Upgrade, we add extra?

        // Simpler implementation for now:
        // Just apply value. Rarity Upgrade will inject a BIG value difference.
        // e.g. If you have Common (+5), and find Epic (+20), logic in UpgradeSystem handles the diff?
        // No, user said: "Upgrade to Epic immediately".
        // That means retrieving the skill, checking current rarity, and applying diff.

        // Let's just track the value modifications directly on properties for now to be safe,
        // and let UpgradeSystem handle the math.

        // Helper for UpgradeSystem to check current state
    }

    update(dt) {
        // Regen Energy
        if (this.energy < this.maxEnergy) {
            this.energy += this.energyRegen * dt;
            if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;
        }

        // Regen HP
        if (this.hpRegen && this.hp < this.maxHp) {
            this.hp += this.hpRegen * dt;
            if (this.hp > this.maxHp) this.hp = this.maxHp;
        }

        this.fireRate = this.baseFireRate * this.fireRateMultiplier;
        const input = this.game.input;

        // Calculate Movement Input
        let ax = 0;
        let ay = 0;
        if (input.isKeyPressed('KeyW') || input.isKeyPressed('ArrowUp')) ay = -1;
        if (input.isKeyPressed('KeyS') || input.isKeyPressed('ArrowDown')) ay = 1;
        if (input.isKeyPressed('KeyA') || input.isKeyPressed('ArrowLeft')) ax = -1;
        if (input.isKeyPressed('KeyD') || input.isKeyPressed('ArrowRight')) ax = 1;

        // Dash Input (Uses Energy)
        if (input.isKeyPressed('Space') && this.dashCharges > 0 && !this.isDashing && this.energy >= 30) {
            this.energy -= 30;
            this.dashCharges--;
            this.startDash(input);
        }

        // Manage Dash State
        if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;

        if (this.isDashing) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.isInvulnerable = false;
                this.velocity.x *= 0.5; // Slow down after dash
                this.velocity.y *= 0.5;
            } else {
                // Create trail effect
                if (Math.random() > 0.5) {
                    this.game.spawnParticles(this.x, this.y, 1, '#00f0ff');
                }
                this.isInvulnerable = false; // Reset invulnerability
            }
            // Move fast in dashDir
            this.velocity.x = this.dashDir.x * this.dashSpeed;
            this.velocity.y = this.dashDir.y * this.dashSpeed;

            // Invulnerable during dash? Optional.
            // Create trail effect
            if (Math.random() > 0.5) {
                this.game.spawnParticles(this.x, this.y, 1, '#00f0ff');
            }
        } else {
            // Normal Movement
            if (ax !== 0 || ay !== 0) {
                // Normalize
                const len = Math.sqrt(ax * ax + ay * ay);
                ax /= len;
                ay /= len;

                this.velocity.x += ax * this.acceleration * dt;
                this.velocity.y += ay * this.acceleration * dt;
            }

            // Apply Friction (Always apply to ensure we stop)
            // Using time-corrected friction: result = vel * friction^(dt * 60)
            const frictionFactor = Math.pow(this.friction, dt * 60);
            this.velocity.x *= frictionFactor;
            this.velocity.y *= frictionFactor;

            // Stop completely if very slow
            if (Math.abs(this.velocity.x) < 10) this.velocity.x = 0;
            if (Math.abs(this.velocity.y) < 10) this.velocity.y = 0;
        }

        // Dash Cooldown
        if (this.dashCharges < this.dashCount) {
            this.dashCooldownTimer -= dt;
            if (this.dashCooldownTimer <= 0) {
                this.dashCharges++;
                this.dashCooldownTimer = this.dashCooldown; // Reset timer
            }
        }

        // Apply Speed Cap
        const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (currentSpeed > this.maxSpeed) {
            const scale = this.maxSpeed / currentSpeed;
            this.velocity.x *= scale;
            this.velocity.y *= scale;
        }

        // Safety check for NaN
        if (isNaN(this.velocity.x)) this.velocity.x = 0;
        if (isNaN(this.velocity.y)) this.velocity.y = 0;

        // Apply Position
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;

        // Rotation (Aiming)
        const mouse = input.getMousePosition();

        // Auto Aim Logic
        if (this.autoAim) {
            let closest = null;
            let minDist = 600;

            this.game.enemies.forEach(e => {
                if (e.markedForDeletion) return;
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < minDist) {
                    minDist = d;
                    closest = e;
                }
            });

            if (closest) {
                const dx = closest.x - this.x;
                const dy = closest.y - this.y;
                this.angle = Math.atan2(dy, dx);
            } else if (input.mouseMoved) {
                const camX = this.game.camera ? this.game.camera.x : 0;
                const camY = this.game.camera ? this.game.camera.y : 0;
                const dx = mouse.x - (this.x - camX);
                const dy = mouse.y - (this.y - camY);
                this.angle = Math.atan2(dy, dx);
            }
        } else {
            // Standard Mouse Aim
            const camX = this.game.camera ? this.game.camera.x : 0;
            const camY = this.game.camera ? this.game.camera.y : 0;
            const dx = mouse.x - (this.x - camX);
            const dy = mouse.y - (this.y - camY);
            this.angle = Math.atan2(dy, dx);
        }

        // Shooting
        this.fireTimer = (this.fireTimer || 0) + dt;
        const fireInterval = 1 / Math.max(0.1, (this.baseFireRate * this.fireRateMultiplier));
        const isFiring = input.isMouseDown() || this.autoShoot;

        if (isFiring && this.fireTimer >= fireInterval) {
            this.fireTimer = 0;
            this.shoot();
        }
    }

    startDash(input) {
        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.isInvulnerable = true;

        // Determine Dash Direction
        let dx = 0;
        let dy = 0;
        if (input.isKeyPressed('KeyW') || input.isKeyPressed('ArrowUp')) dy = -1;
        if (input.isKeyPressed('KeyS') || input.isKeyPressed('ArrowDown')) dy = 1;
        if (input.isKeyPressed('KeyA') || input.isKeyPressed('ArrowLeft')) dx = -1;
        if (input.isKeyPressed('KeyD') || input.isKeyPressed('ArrowRight')) dx = 1;

        if (dx === 0 && dy === 0) {
            // Dash in facing direction
            this.dashDir = { x: Math.cos(this.angle), y: Math.sin(this.angle) };
        } else {
            // Normalize
            const len = Math.sqrt(dx * dx + dy * dy);
            this.dashDir = { x: dx / len, y: dy / len };
        }

        this.game.spawnParticles(this.x, this.y, 10, '#00f0ff');
        this.game.audio.playDash();
    }

    shoot() {
        // Basic projectile
        const damage = this.damage;
        const speed = this.projectileSpeed;

        // Multishot logic
        const totalShots = this.projectileCount;
        const spread = 0.2; // Radians

        for (let i = 0; i < totalShots; i++) {
            const angleOffset = totalShots > 1 ? (i - (totalShots - 1) / 2) * spread : 0;
            this.game.spawnProjectile(this.x, this.y, this.angle + angleOffset, speed, damage);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Player Triangle
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, -10);
        ctx.closePath();
        ctx.fill();

        // Spiked Hull Visual
        if (this.collisionDamage > 0) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(20, 0);
            ctx.lineTo(10, 5); // Spike
            ctx.stroke();
        }

        ctx.restore();
    }
}
