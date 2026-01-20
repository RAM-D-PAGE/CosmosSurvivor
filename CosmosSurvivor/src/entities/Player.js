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
        this.energy = this.maxEnergy;
        this.energy = this.maxEnergy;
        this.energyRegen = 20; // per second
        this.pickupRange = 150; // Base Magnet Range
        this.hpRegen = 0; // Base HP Regen

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

        // Dash Input (Uses Energy)
        if (input.isKeyPressed('Space') && this.dashCooldownTimer <= 0 && !this.isDashing && this.energy >= 30) {
            this.energy -= 30;
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
            }
        }

        // Input Handling (Normal Movement)
        if (!this.isDashing) {
            let dx = 0;
            let dy = 0;

            if (input.isKeyPressed('KeyW')) dy = -1;
            if (input.isKeyPressed('KeyS')) dy = 1;
            if (input.isKeyPressed('KeyA')) dx = -1;
            if (input.isKeyPressed('KeyD')) dx = 1;

            // Normalize input vector
            if (dx !== 0 || dy !== 0) {
                const length = Math.sqrt(dx * dx + dy * dy);
                dx /= length;
                dy /= length;
            }

            // Apply Acceleration
            this.velocity.x += dx * this.acceleration * dt;
            this.velocity.y += dy * this.acceleration * dt;

            // Apply Friction
            this.velocity.x *= Math.pow(this.friction, dt * 60);
            this.velocity.y *= Math.pow(this.friction, dt * 60);
        }

        // Safety check for NaN
        if (isNaN(this.velocity.x)) this.velocity.x = 0;
        if (isNaN(this.velocity.y)) this.velocity.y = 0;

        // Position Update
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;

        // No Boundary Constraint for Infinite World
        // if (this.x < 0) ... removed

        // Rotation (Look at mouse)
        const mouse = input.getMousePosition();

        // Player Position in Screen Space
        // If camera exists, subtract camera pos. If not (early frame), use 0.
        const camX = this.game.camera ? this.game.camera.x : 0;
        const camY = this.game.camera ? this.game.camera.y : 0;

        const playerScreenX = this.x - camX;
        const playerScreenY = this.y - camY;

        this.angle = Math.atan2(mouse.y - playerScreenY, mouse.x - playerScreenX);

        // Shooting
        this.handleShooting(dt, input);
    }

    startDash(input) {
        this.isDashing = true;
        this.isInvulnerable = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldownTimer = this.dashCooldown;

        // Dash direction
        let dx = 0;
        let dy = 0;
        if (input.isKeyPressed('KeyW')) dy = -1;
        if (input.isKeyPressed('KeyS')) dy = 1;
        if (input.isKeyPressed('KeyA')) dx = -1;
        if (input.isKeyPressed('KeyD')) dx = 1;

        if (dx === 0 && dy === 0) {
            // Dash towards mouse (Screen Space math)
            const mouse = input.getMousePosition();
            const camX = this.game.camera ? this.game.camera.x : 0;
            const camY = this.game.camera ? this.game.camera.y : 0;
            const playerScreenX = this.x - camX;
            const playerScreenY = this.y - camY;

            const angle = Math.atan2(mouse.y - playerScreenY, mouse.x - playerScreenX);
            dx = Math.cos(angle);
            dy = Math.sin(angle);
        } else {
            // Normalize
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        this.velocity.x = dx * this.dashSpeed;
        this.velocity.y = dy * this.dashSpeed;

        // Dash Sound?
        // Check if Game implies audio exists? Game.js has specific methods
        // But Player doesn't have direct access to game.audio unless we assume this.game exposes it.
        // It does: using this.game.audio.
        if (this.game.audio) this.game.audio.playDash();
    }

    handleShooting(dt, input) {
        if (this.shootTimer > 0) this.shootTimer -= dt;

        if (input.isMouseDown() && this.shootTimer <= 0) {
            this.shoot();
            this.shootTimer = 1 / this.fireRate;
        }
    }

    shoot() {
        const spread = 0.1; // Radians
        const startAngle = this.angle - (spread * (this.projectileCount - 1)) / 2;

        for (let i = 0; i < this.projectileCount; i++) {
            const angle = startAngle + i * spread;
            this.game.spawnProjectile(this.x, this.y, angle, this.projectileSpeed, this.damage);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw Ship Body (Triangle)
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';

        ctx.beginPath();
        ctx.moveTo(20, 0); // Nose
        ctx.lineTo(-15, 15); // Back Right
        ctx.lineTo(-5, 0); // Engine
        ctx.lineTo(-15, -15); // Back Left
        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}
