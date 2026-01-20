import { CONFIG } from '../core/Config.js';

/**
 * SkillSystem - Manages active skills that can be triggered by player
 * Skills are powerful abilities with cooldowns, dropped by bosses (Mystical) or earned through upgrades
 */
export class SkillSystem {
    constructor(game) {
        this.game = game;
        this.activeSkills = []; // Array of equipped skills
        this.maxSkills = 3;
        this.mysticalSkills = []; // Collection of earned mystical skills

        // Skill key bindings
        this.skillKeys = ['Digit1', 'Digit2', 'Digit3'];

        // All available skill definitions
        this.skillDefinitions = {
            // Legendary Skills (Boss Drops)
            BLACK_HOLE: {
                id: 'BLACK_HOLE',
                name: 'Black Hole',
                description: 'Creates a singularity that pulls all enemies and deals damage over time.',
                cooldown: 30,
                damage: 50,
                duration: 3,
                radius: 200,
                color: '#000000',
                rarity: 'LEGENDARY',
                isMystical: true,
                execute: (game, skill) => this.executeBlackHole(game, skill)
            },
            METEOR_SHOWER: {
                id: 'METEOR_SHOWER',
                name: 'Meteor Shower',
                description: 'Rains down meteors dealing massive area damage.',
                cooldown: 25,
                damage: 60,
                count: 5,
                radius: 80,
                color: '#ff8800',
                rarity: 'LEGENDARY',
                isMystical: true,
                execute: (game, skill) => this.executeMeteorShower(game, skill)
            },
            TIME_STOP: {
                id: 'TIME_STOP',
                name: 'Time Stop',
                description: 'Freezes all enemies in place for a short duration.',
                cooldown: 45,
                duration: 2,
                color: '#ffffff',
                rarity: 'LEGENDARY',
                isMystical: true,
                execute: (game, skill) => this.executeTimeStop(game, skill)
            },

            // Epic Skills
            DOOM: {
                id: 'DOOM',
                name: 'Doom',
                description: 'Marks an enemy for death. After delay, deals massive damage.',
                cooldown: 20,
                damage: 200,
                delay: 3,
                color: '#660000',
                rarity: 'EPIC',
                isMystical: true,
                execute: (game, skill) => this.executeDoom(game, skill)
            },
            LIGHTNING_STORM: {
                id: 'LIGHTNING_STORM',
                name: 'Lightning Storm',
                description: 'Calls down random lightning strikes in an area.',
                cooldown: 15,
                damage: 25,
                strikes: 8,
                radius: 300,
                color: '#ffff00',
                rarity: 'EPIC',
                isMystical: true,
                execute: (game, skill) => this.executeLightningStorm(game, skill)
            },
            DIVINE_SHIELD: {
                id: 'DIVINE_SHIELD',
                name: 'Divine Shield',
                description: 'Become completely invulnerable for a short time.',
                cooldown: 60,
                duration: 3,
                color: '#ffff88',
                rarity: 'EPIC',
                isMystical: true,
                execute: (game, skill) => this.executeDivineShield(game, skill)
            },
            SOUL_HARVEST: {
                id: 'SOUL_HARVEST',
                name: 'Soul Harvest',
                description: 'Instantly kills all enemies below 15% HP in range.',
                cooldown: 20,
                threshold: 0.15,
                radius: 200,
                color: '#aa00ff',
                rarity: 'EPIC',
                isMystical: true,
                execute: (game, skill) => this.executeSoulHarvest(game, skill)
            },

            // Rare Skills
            FIREBALL: {
                id: 'FIREBALL',
                name: 'FireBall',
                description: 'Launches a massive fireball that explodes on impact.',
                cooldown: 8,
                damage: 40,
                radius: 100,
                speed: 400,
                color: '#ff4400',
                rarity: 'RARE',
                execute: (game, skill) => this.executeFireball(game, skill)
            },
            ICEBALL: {
                id: 'ICEBALL',
                name: 'Ice Ball',
                description: 'Launches an ice sphere that freezes enemies on impact.',
                cooldown: 12,
                damage: 30,
                freezeDuration: 3,
                radius: 80,
                speed: 350,
                color: '#00ccff',
                rarity: 'RARE',
                execute: (game, skill) => this.executeIceball(game, skill)
            },

            // Uncommon Skills
            POISON_CLOUD: {
                id: 'POISON_CLOUD',
                name: 'Poison Cloud',
                description: 'Creates a toxic cloud that damages enemies over time.',
                cooldown: 10,
                damagePerSec: 15,
                duration: 5,
                radius: 120,
                color: '#00ff00',
                rarity: 'UNCOMMON',
                execute: (game, skill) => this.executePoisonCloud(game, skill)
            },
            SHOCKWAVE: {
                id: 'SHOCKWAVE',
                name: 'Shockwave',
                description: 'Releases a wave that pushes enemies away.',
                cooldown: 6,
                damage: 15,
                knockback: 300,
                radius: 150,
                color: '#88ccff',
                rarity: 'UNCOMMON',
                execute: (game, skill) => this.executeShockwave(game, skill)
            }
        };

        // Active skill effects (for rendering)
        this.activeEffects = [];
    }

    update(dt) {
        // Update cooldowns
        this.activeSkills.forEach(skill => {
            if (skill.currentCooldown > 0) {
                skill.currentCooldown -= dt;
            }
        });

        // Update active effects
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.timer -= dt;
            if (effect.update) effect.update(dt, this.game);
            return effect.timer > 0;
        });

        // Check skill key inputs
        const input = this.game.input;
        this.skillKeys.forEach((key, index) => {
            if (input.isKeyPressed(key) && this.activeSkills[index]) {
                this.tryActivateSkill(index);
            }
        });
    }

    tryActivateSkill(index) {
        const skill = this.activeSkills[index];
        if (!skill || skill.currentCooldown > 0) return;

        // Execute skill
        const def = this.skillDefinitions[skill.id];
        if (def && def.execute) {
            def.execute(this.game, skill);
            skill.currentCooldown = skill.cooldown;
            this.game.audio.playSkill();

            if (skill.isMystical) {
                this.game.audio.playMystical();
            }
        }
    }

    equipSkill(skillId) {
        if (this.activeSkills.length >= this.maxSkills) {
            this.game.spawnFloatingText(this.game.player.x, this.game.player.y, "Skill Slots Full!", "#ff0000");
            return false;
        }

        const def = this.skillDefinitions[skillId];
        if (!def) return false;

        const skill = {
            ...def,
            currentCooldown: 0
        };

        this.activeSkills.push(skill);

        if (def.isMystical && !this.mysticalSkills.includes(skillId)) {
            this.mysticalSkills.push(skillId);
        }

        this.game.spawnFloatingText(this.game.player.x, this.game.player.y, `${def.name} Equipped!`, def.color);
        return true;
    }

    generateBossSkillDrop() {
        // Filter mystical skills not yet owned
        const available = Object.keys(this.skillDefinitions).filter(id => {
            const def = this.skillDefinitions[id];
            return def.isMystical && !this.mysticalSkills.includes(id);
        });

        if (available.length === 0) {
            // All skills owned, give random rare skill
            return this.generateRandomSkill('RARE');
        }

        const randomId = available[Math.floor(Math.random() * available.length)];
        return this.skillDefinitions[randomId];
    }

    generateRandomSkill(minRarity = 'UNCOMMON') {
        const rarityOrder = ['UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
        const minIndex = rarityOrder.indexOf(minRarity);

        const available = Object.values(this.skillDefinitions).filter(def => {
            const index = rarityOrder.indexOf(def.rarity);
            return index >= minIndex;
        });

        return available[Math.floor(Math.random() * available.length)];
    }

    getTargetPosition(game) {
        const mouse = game.input.getMousePosition();
        const camX = game.camera ? game.camera.x : 0;
        const camY = game.camera ? game.camera.y : 0;
        return { x: mouse.x + camX, y: mouse.y + camY };
    }

    // Skill Execution Methods
    executeBlackHole(game, skill) {
        const center = this.getTargetPosition(game);

        this.activeEffects.push({
            type: 'BLACK_HOLE',
            x: center.x,
            y: center.y,
            radius: skill.radius,
            damage: skill.damage,
            timer: skill.duration,
            update: (dt, g) => {
                // Pull enemies towards center
                g.enemies.forEach(e => {
                    if (e.markedForDeletion) return;
                    const dx = center.x - e.x;
                    const dy = center.y - e.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < skill.radius && dist > 0) {
                        const force = 200 * dt;
                        e.x += (dx / dist) * force;
                        e.y += (dy / dist) * force;
                        e.takeDamage(skill.damage * dt, 'void');
                    }
                });
            }
        });
    }

    executeMeteorShower(game, skill) {
        const center = this.getTargetPosition(game);

        for (let i = 0; i < skill.count; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 200;
                const x = center.x + Math.cos(angle) * dist;
                const y = center.y + Math.sin(angle) * dist;

                // Impact effect
                game.spawnParticles(x, y, 15, skill.color);

                // Damage enemies in radius
                game.enemies.forEach(e => {
                    if (e.markedForDeletion) return;
                    const dx = e.x - x;
                    const dy = e.y - y;
                    const d = Math.sqrt(dx * dx + dy * dy);

                    if (d < skill.radius) {
                        e.takeDamage(skill.damage, 'fire');
                    }
                });
            }, i * 200);
        }
    }

    executeTimeStop(game, skill) {
        game.enemies.forEach(e => {
            if (!e.markedForDeletion) {
                e.freeze(skill.duration);
            }
        });

        game.spawnFloatingText(game.player.x, game.player.y, "TIME STOP!", "#ffffff");
    }

    executeDoom(game, skill) {
        // Find closest enemy to MOUSE cursor
        const target = this.getTargetPosition(game);
        let closest = null;
        let minDist = Infinity;

        game.enemies.forEach(e => {
            if (e.markedForDeletion) return;
            const dx = e.x - target.x;
            const dy = e.y - target.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Search radius around cursor (e.g., 300px)
            if (dist < 300 && dist < minDist) {
                minDist = dist;
                closest = e;
            }
        });

        if (closest) {
            closest.markForDoom(skill.damage, skill.delay);
            game.spawnFloatingText(closest.x, closest.y, "DOOMED!", skill.color);
        } else {
            // Visual feedback if missed
            game.spawnFloatingText(target.x, target.y, "NO TARGET", "#888");
        }
    }

    executeLightningStorm(game, skill) {
        const center = this.getTargetPosition(game);

        for (let i = 0; i < skill.strikes; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * skill.radius;
                const x = center.x + Math.cos(angle) * dist;
                const y = center.y + Math.sin(angle) * dist;

                // Lightning effect
                game.spawnParticles(x, y, 5, skill.color);

                // Damage enemies near strike
                game.enemies.forEach(e => {
                    if (e.markedForDeletion) return;
                    const dx = e.x - x;
                    const dy = e.y - y;
                    const d = Math.sqrt(dx * dx + dy * dy);

                    if (d < 50) {
                        e.takeDamage(skill.damage, 'lightning');
                    }
                });
            }, i * 100);
        }
    }

    executeDivineShield(game, skill) {
        game.player.isInvulnerable = true;
        game.spawnFloatingText(game.player.x, game.player.y, "DIVINE SHIELD!", skill.color);

        this.activeEffects.push({
            type: 'DIVINE_SHIELD',
            timer: skill.duration,
            update: (dt, g) => {
                // Visual effect handled in draw
            }
        });

        setTimeout(() => {
            game.player.isInvulnerable = false;
        }, skill.duration * 1000);
    }

    executeSoulHarvest(game, skill) {
        const center = this.getTargetPosition(game);
        let kills = 0;

        // Visual feedback for area
        game.spawnParticles(center.x, center.y, 20, skill.color);

        game.enemies.forEach(e => {
            if (e.markedForDeletion) return;
            const dx = e.x - center.x;
            const dy = e.y - center.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < skill.radius) {
                const hpPercent = e.health / e.maxHealth;
                if (hpPercent <= skill.threshold) {
                    e.takeDamage(e.health + 1, 'soul');
                    kills++;
                }
            }
        });

        game.spawnFloatingText(player.x, player.y, `HARVESTED ${kills}!`, skill.color);
    }

    executeFireball(game, skill) {
        const player = game.player;
        const mouse = game.input.getMousePosition();
        const camX = game.camera ? game.camera.x : 0;
        const camY = game.camera ? game.camera.y : 0;

        const targetX = mouse.x + camX;
        const targetY = mouse.y + camY;
        const angle = Math.atan2(targetY - player.y, targetX - player.x);

        this.activeEffects.push({
            type: 'FIREBALL',
            x: player.x,
            y: player.y,
            angle: angle,
            speed: skill.speed,
            radius: 20,
            explosionRadius: skill.radius,
            damage: skill.damage,
            timer: 3,
            color: skill.color,
            update: (dt, g) => {
                const effect = this.activeEffects.find(e => e.type === 'FIREBALL');
                if (!effect) return;

                effect.x += Math.cos(effect.angle) * effect.speed * dt;
                effect.y += Math.sin(effect.angle) * effect.speed * dt;

                // Check collision with enemies
                g.enemies.forEach(e => {
                    if (e.markedForDeletion) return;
                    const dx = e.x - effect.x;
                    const dy = e.y - effect.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < effect.radius + e.radius) {
                        // Explode!
                        this.explodeFireball(g, effect);
                        effect.timer = 0;
                    }
                });
            }
        });
    }

    explodeFireball(game, effect) {
        game.spawnParticles(effect.x, effect.y, 20, effect.color);

        game.enemies.forEach(e => {
            if (e.markedForDeletion) return;
            const dx = e.x - effect.x;
            const dy = e.y - effect.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < effect.explosionRadius) {
                e.takeDamage(effect.damage, 'fire');
            }
        });
    }

    executeIceball(game, skill) {
        const player = game.player;
        const mouse = game.input.getMousePosition();
        const camX = game.camera ? game.camera.x : 0;
        const camY = game.camera ? game.camera.y : 0;

        const targetX = mouse.x + camX;
        const targetY = mouse.y + camY;
        const angle = Math.atan2(targetY - player.y, targetX - player.x);

        this.activeEffects.push({
            type: 'ICEBALL',
            x: player.x,
            y: player.y,
            angle: angle,
            speed: skill.speed,
            radius: 15,
            explosionRadius: skill.radius,
            damage: skill.damage,
            freezeDuration: skill.freezeDuration,
            timer: 3,
            color: skill.color,
            update: (dt, g) => {
                const effect = this.activeEffects.find(e => e.type === 'ICEBALL');
                if (!effect) return;

                effect.x += Math.cos(effect.angle) * effect.speed * dt;
                effect.y += Math.sin(effect.angle) * effect.speed * dt;

                // Check collision
                g.enemies.forEach(e => {
                    if (e.markedForDeletion) return;
                    const dx = e.x - effect.x;
                    const dy = e.y - effect.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < effect.radius + e.radius) {
                        this.explodeIceball(g, effect);
                        effect.timer = 0;
                    }
                });
            }
        });
    }

    explodeIceball(game, effect) {
        game.spawnParticles(effect.x, effect.y, 15, effect.color);

        game.enemies.forEach(e => {
            if (e.markedForDeletion) return;
            const dx = e.x - effect.x;
            const dy = e.y - effect.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < effect.explosionRadius) {
                e.takeDamage(effect.damage, 'ice');
                e.freeze(effect.freezeDuration);
            }
        });
    }

    executePoisonCloud(game, skill) {
        const center = this.getTargetPosition(game);

        this.activeEffects.push({
            type: 'POISON_CLOUD',
            x: center.x,
            y: center.y,
            radius: skill.radius,
            damagePerSec: skill.damagePerSec,
            timer: skill.duration,
            color: skill.color,
            update: (dt, g) => {
                const effect = this.activeEffects.find(e => e.type === 'POISON_CLOUD');
                if (!effect) return;

                g.enemies.forEach(e => {
                    if (e.markedForDeletion) return;
                    const dx = e.x - effect.x;
                    const dy = e.y - effect.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < effect.radius) {
                        e.poison(effect.damagePerSec, 1);
                    }
                });
            }
        });
    }

    executeShockwave(game, skill) {
        const player = game.player;

        game.spawnParticles(player.x, player.y, 20, skill.color);

        game.enemies.forEach(e => {
            if (e.markedForDeletion) return;
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < skill.radius && dist > 0) {
                e.takeDamage(skill.damage, 'physical');
                // Knockback
                e.x += (dx / dist) * skill.knockback;
                e.y += (dy / dist) * skill.knockback;
            }
        });
    }

    draw(ctx) {
        // Draw active effects
        this.activeEffects.forEach(effect => {
            ctx.save();

            switch (effect.type) {
                case 'BLACK_HOLE':
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fill();
                    ctx.strokeStyle = '#aa00ff';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    break;

                case 'POISON_CLOUD':
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                    ctx.fill();
                    break;

                case 'FIREBALL':
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                    ctx.fillStyle = effect.color;
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = effect.color;
                    ctx.fill();
                    break;

                case 'ICEBALL':
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                    ctx.fillStyle = effect.color;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = '#00ffff';
                    ctx.fill();
                    break;

                case 'DIVINE_SHIELD':
                    ctx.beginPath();
                    ctx.arc(this.game.player.x, this.game.player.y, 40, 0, Math.PI * 2);
                    ctx.strokeStyle = '#ffff88';
                    ctx.lineWidth = 3;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = '#ffff00';
                    ctx.stroke();
                    break;
            }

            ctx.restore();
        });
    }

    reset() {
        this.activeSkills = [];
        this.activeEffects = [];
        // Keep mysticalSkills for persistence
    }
}
