import { Input } from './Input.js';
import { Player } from '../entities/Player.js';
import { Starfield } from './Starfield.js';
import { Projectile } from '../entities/Projectile.js';
import { Enemy } from '../entities/Enemy.js';
import { Gem } from '../entities/Gem.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { Particle } from '../entities/Particle.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { FloatingText } from '../entities/FloatingText.js';
import { MapSystem } from '../systems/MapSystem.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { CONFIG } from './Config.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.input = new Input();

        // Bind methods
        this.resize = this.resize.bind(this);
        this.loop = this.loop.bind(this);

        // Setup resize listener
        window.addEventListener('resize', this.resize);
        this.resize(); // Initial resize

        // Systems
        this.audio = new AudioSystem();
        this.upgradeSystem = new UpgradeSystem(this);
        this.mapSystem = new MapSystem(this);
        this.weaponSystem = new WeaponSystem(this);

        // Entities
        this.starfield = new Starfield(this);
        this.player = new Player(this);
        this.projectiles = [];
        this.enemies = [];
        this.gems = [];
        this.particles = [];
        this.floatingTexts = [];

        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = CONFIG.GAME.ENEMY_SPAWN_INTERVAL;

        // Progression
        this.exp = 0;
        this.level = 1;
        this.expToNextLevel = 100;
        this.isPaused = true; // Start paused for menu

        this.difficultyMultiplier = 0;

        this.lastTime = 0;
        this.accumulator = 0;
        this.step = 1 / 60; // Fixed time step

        // UI Elements
        this.uiExpBar = document.getElementById('exp-bar-fill');
        this.uiExpText = document.getElementById('exp-text');
        this.uiGameTimer = document.getElementById('game-timer');
        this.uiZoneBar = document.getElementById('zone-progress-bar');
        this.uiZoneLabel = document.getElementById('zone-progress-label');

        this.uiHpBar = document.getElementById('hp-bar-fill');
        this.uiHpText = document.getElementById('hp-text');
        this.uiEnergyBar = document.getElementById('energy-bar-fill');

        this.uiUpgradeMenu = document.getElementById('upgrade-menu');
        this.uiCardContainer = document.getElementById('card-container');
        this.uiMainMenu = document.getElementById('main-menu');
        this.uiGameOver = document.getElementById('game-over-screen');

        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());

        // Start Interaction for Audio Context (usually needs user gesture)
        document.addEventListener('click', () => {
            if (this.audio.ctx.state === 'suspended') {
                this.audio.ctx.resume();
            }
        }, { once: true });

        this.gameState = 'MENU';

        // Camera (x,y is top-left corner of view)
        this.camera = { x: 0, y: 0 };

        // Init UI Logic
        this.acquiredUpgrades = []; // Log for Tab Menu

        // Pause Button
        const pBtn = document.getElementById('pause-btn');
        if (pBtn) pBtn.addEventListener('click', () => this.togglePause());

        // Resume Button
        const rBtn = document.getElementById('resume-btn');
        if (rBtn) rBtn.addEventListener('click', () => this.togglePause());

        // Key Listeners for UI (Tab)
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Tab') {
                e.preventDefault(); // Stop focus cycling
                if (this.gameState === 'PLAYING') {
                    this.togglePause();
                }
            }
        });

        // Tooltip Logic
        this.tooltip = document.getElementById('tooltip');
    }

    togglePause() {
        if (this.gameState !== 'PLAYING') return;

        this.isPaused = !this.isPaused;
        const menu = document.getElementById('skills-menu');

        if (this.isPaused) {
            menu.classList.remove('hidden');
            this.updateSkillsMenu();
        } else {
            menu.classList.add('hidden');
        }
    }

    updateSkillsMenu() {
        // Redesign for Two-Column Layout
        // Check if structure exists, if not recreate
        let contentDiv = document.querySelector('.skills-content');
        if (!contentDiv) return;

        contentDiv.innerHTML = ''; // Clear old

        // Column 1: Ship Status
        const col1 = document.createElement('div');
        col1.className = 'column';
        col1.innerHTML = '<h3>SHIP STATUS</h3>';
        const statsUl = document.createElement('ul');
        statsUl.id = 'skills-list-stats';

        const stats = [
            { label: 'Damage', val: Math.round(this.player.damage) },
            { label: 'Fire Rate', val: `${this.player.fireRate.toFixed(1)}/s` },
            { label: 'Multishot', val: this.player.projectileCount },
            { label: 'Max HP', val: Math.round(this.player.maxHp) },
            { label: 'HP Regen', val: `${this.player.hpRegen.toFixed(1)}/s` },
            { label: 'Magnet', val: `${Math.round(this.player.pickupRange)}px` }
        ];

        stats.forEach(s => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${s.label}</span> <span style="color:var(--primary-color); font-weight:bold;">${s.val}</span>`;
            li.style.borderLeftColor = '#fff';
            statsUl.appendChild(li);
        });
        col1.appendChild(statsUl);

        // Column 2: Upgrade Log
        const col2 = document.createElement('div');
        col2.className = 'column';
        col2.innerHTML = '<h3>UPGRADE LOG</h3>';
        const logUl = document.createElement('ul');
        logUl.id = 'skills-list-log';

        [...this.acquiredUpgrades].reverse().forEach(upg => {
            const li = document.createElement('li');
            li.innerHTML = `<span style="color:${upg.color}">${upg.name}</span>`;
            li.style.borderLeftColor = upg.color;
            logUl.appendChild(li);
        });
        col2.appendChild(logUl);

        contentDiv.appendChild(col1);
        contentDiv.appendChild(col2);
    }

    showTooltip(e, text) {
        this.tooltip.innerHTML = text;
        this.tooltip.style.left = e.clientX + 15 + 'px';
        this.tooltip.style.top = e.clientY + 15 + 'px';
        this.tooltip.classList.remove('hidden');
    }

    hideTooltip() {
        this.tooltip.classList.add('hidden');
    }

    startGame() {
        this.gameState = 'PLAYING';
        this.isPaused = false;

        // Hide Menu, Show HUD/Stats
        this.uiMainMenu.classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden'); // Show HUD
        this.uiGameOver.classList.add('hidden');

        if (this.audio.ctx.state === 'suspended') this.audio.ctx.resume();

        // Ensure we have a starter weapon if none exists
        if (this.weaponSystem.activeWeapons.length === 0) {
            const startingWep = this.weaponSystem.createConfig('ORBITAL', 5, 1.0, 300, '#00f0ff', 'Plasma Drone'); // Use Plasma Drone as default
            this.weaponSystem.installWeapon(startingWep);
        }

        this.lastTime = performance.now();
        this.updateUI();
    }

    spawnProjectile(x, y, angle, speed, damage, isEnemy = false) {
        this.projectiles.push(new Projectile(x, y, angle, speed, damage, isEnemy));
        if (!isEnemy) this.audio.playShoot();
    }

    spawnParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    spawnFloatingText(x, y, text, color) {
        this.floatingTexts.push(new FloatingText(x, y, text, color));
    }

    spawnEnemy() {
        // Spawn relative to Player's World Position
        const angle = Math.random() * Math.PI * 2;
        // Distance: Outside current screen view (approx 800-1000px)
        const dist = 900 + Math.random() * 200;

        const x = this.player.x + Math.cos(angle) * dist;
        const y = this.player.y + Math.sin(angle) * dist;

        // Type from MapSystem
        const type = this.mapSystem.getSpawnType();

        this.enemies.push(new Enemy(this, x, y, type));
    }

    spawnGem(x, y, value) {
        this.gems.push(new Gem(this, x, y, value));
    }

    addExp(amount) {
        this.exp += amount;
        this.audio.playGem();
        if (this.exp >= this.expToNextLevel) {
            this.levelUp();
        }
        this.updateUI();
    }

    levelUp() {
        this.exp -= this.expToNextLevel;
        this.level++;
        this.expToNextLevel = Math.floor(this.expToNextLevel * 1.2);
        this.updateUI(); // Ensure bar resets visually

        this.audio.playLevelUp();
        this.isPaused = true;
        this.showUpgradeMenu();
    }

    showUpgradeMenu() {
        // Clear previous cards
        this.uiCardContainer.innerHTML = '';

        const choices = this.upgradeSystem.getChoices(3);

        choices.forEach(choice => {
            const card = document.createElement('div');
            card.className = 'skill-card';
            card.innerHTML = `
                <h3 style="color:${choice.color}">${choice.name}</h3>
                <p>${choice.description}</p>
            `;

            // Dynamic Rarity Border
            card.style.borderColor = choice.color;
            card.style.boxShadow = `0 0 5px ${choice.color}40`; // Low alpha glow

            card.addEventListener('mouseenter', () => {
                card.style.boxShadow = `0 0 20px ${choice.color}`;
                card.style.transform = 'translateY(-5px)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.boxShadow = `0 0 5px ${choice.color}40`;
                card.style.transform = 'translateY(0)';
            });

            card.addEventListener('click', () => {
                choice.apply(this);
                this.closeUpgradeMenu();
            });

            this.uiCardContainer.appendChild(card);
        });

        // Add Reroll Button
        if (!document.getElementById('reroll-btn-container')) {
            const container = document.createElement('div');
            container.id = 'reroll-btn-container';
            container.style.marginTop = '20px';

            const btn = document.createElement('button');
            btn.className = 'glow-btn';
            btn.innerText = 'REROLL';
            btn.style.fontSize = '18px';
            btn.style.padding = '10px 30px';

            btn.onclick = () => {
                this.audio.playClick();
                this.showUpgradeMenu(); // Refresh
            };

            container.appendChild(btn);
            this.uiUpgradeMenu.appendChild(container);
        }

        this.uiUpgradeMenu.classList.remove('hidden');
    }

    closeUpgradeMenu() {
        this.uiUpgradeMenu.classList.add('hidden');
        this.isPaused = false;
    }

    updateUI() {
        // Helper to update text only if changed
        const setText = (el, txt) => { if (el && el.innerText !== txt) el.innerText = txt; };

        setText(this.uiExpText, `LVL ${this.level} [${Math.floor(this.exp)} / ${this.expToNextLevel} XP]`);

        // Timer
        const totalSeconds = Math.floor(this.mapSystem.totalTime || 0);
        setText(this.uiGameTimer, totalSeconds);

        // Zone Progress
        if (this.mapSystem.currentZone) {
            const zoneTime = this.mapSystem.timer;
            const zoneDuration = this.mapSystem.currentZone.duration;
            const zonePct = Math.min((zoneTime / zoneDuration) * 100, 100);
            this.uiZoneBar.style.width = `${zonePct}% `;

            let label = "ZONE PROGRESS";
            let color = "white";
            if (this.mapSystem.waitingForKill) {
                label = "STAGE BOSS DETECTED";
                color = "#ff0000";
            } else if (this.mapSystem.miniBossSpawned && zonePct < 100 && zonePct > 50) {
                label = "MINI BOSS ACTIVE";
                color = "#ff00aa";
            }
            setText(this.uiZoneLabel, label);
            this.uiZoneLabel.style.color = color;
        }

        // Stats
        if (this.player) {
            // HP & Energy
            const hpPct = (this.player.hp / this.player.maxHp) * 100;
            this.uiHpBar.style.width = `${Math.max(0, hpPct)}% `;
            setText(this.uiHpText, `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`);

            const enPct = (this.player.energy / this.player.maxEnergy) * 100;
            this.uiEnergyBar.style.width = `${Math.max(0, enPct)}%`;
        }

        // Inventory (Optimized)
        if (this.weaponSystem) {
            const panel = document.getElementById('inventory-panel');
            // Ensure slots exist
            const currentSlots = panel.children.length;
            if (this.weaponSystem.maxWeapons > currentSlots) {
                for (let i = currentSlots; i < this.weaponSystem.maxWeapons; i++) {
                    const div = document.createElement('div');
                    div.className = 'inv-slot';
                    div.id = `slot-${i}`;
                    panel.appendChild(div);
                }
            }

            for (let i = 0; i < this.weaponSystem.maxWeapons; i++) {
                let slot = document.getElementById(`slot-${i}`);
                if (!slot) continue;

                // Check state
                const wep = this.weaponSystem.activeWeapons[i];
                const type = wep ? wep.type : 'empty';
                const currentType = slot.getAttribute('data-type');

                if (currentType !== type) {
                    slot.setAttribute('data-type', type);

                    if (wep) {
                        slot.classList.add('filled');
                        slot.innerHTML = wep.type === 'ORBITAL' ? 'Orb' : 'Trt';
                        slot.style.borderColor = wep.color;
                        slot.style.boxShadow = `0 0 10px ${wep.color}`;
                    } else {
                        slot.classList.remove('filled');
                        slot.innerHTML = '';
                        slot.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        slot.style.boxShadow = 'none';
                    }
                }

                // ALWAYS renew events if weapon exists to prevent stale data
                if (wep) {
                    slot.onmouseenter = (e) => this.showTooltip(e, `<b>${wep.name}</b><br>Type: ${wep.type}<br>Dmg: ${Math.round(wep.damage)}<br>Rate: ${wep.fireRate.toFixed(1)}/s`);
                    slot.onmouseleave = () => this.hideTooltip();
                    slot.onmousemove = (e) => {
                        this.tooltip.style.left = e.clientX + 15 + 'px';
                        this.tooltip.style.top = e.clientY + 15 + 'px';
                    };
                } else {
                    slot.onmouseenter = null;
                    slot.onmouseleave = null;
                    slot.onmousemove = null;
                }
            }
        }
    }


    gameOver() {
        this.isPaused = true;
        document.getElementById('game-over-screen').classList.remove('hidden');
    }

    restart() {
        // Reset Stats
        this.exp = 0;
        this.level = 1;
        this.expToNextLevel = 100;
        this.isPaused = false;

        // Reset Entities
        this.player = new Player(this);
        this.projectiles = [];
        this.enemies = [];
        this.gems = [];
        this.particles = [];
        this.floatingTexts = [];

        // Reset Steps
        this.mapSystem.reset();
        this.weaponSystem.reset();

        // Add Default Weapon (so user isn't empty)
        const startingWep = this.weaponSystem.createConfig('ORBITAL', 5, 1.0, 300, '#00f0ff', 'Plasma Drone');
        this.weaponSystem.installWeapon(startingWep);

        // Reset UI
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('upgrade-menu').classList.add('hidden'); // Fix persistence
        document.getElementById('hud').classList.remove('hidden');
        this.updateUI();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.starfield) this.starfield.resize();
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
    }

    loop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (!this.isPaused) {
            this.update(deltaTime);
        }
        this.draw();

        // Critical: Update UI every frame for Timer, Energy, HP
        this.updateUI();

        requestAnimationFrame(this.loop);
    }

    update(dt) {
        // Update Camera (Deadzone Implementation 90/5/5)
        // Margins: 5% of screen size on each side (90% free in middle)
        const marginX = this.canvas.width * 0.05;
        const marginY = this.canvas.height * 0.05;

        // Player position in screen space (if camera were static)
        // We want ScreenPos = WorldPos - CameraPos
        const screenX = this.player.x - this.camera.x;
        const screenY = this.player.y - this.camera.y;

        // Push Camera Left
        if (screenX < marginX) {
            this.camera.x = this.player.x - marginX;
        }
        // Push Camera Right
        else if (screenX > this.canvas.width - marginX) {
            this.camera.x = this.player.x - (this.canvas.width - marginX);
        }

        // Push Camera Up
        if (screenY < marginY) {
            this.camera.y = this.player.y - marginY;
        }
        // Push Camera Down
        else if (screenY > this.canvas.height - marginY) {
            this.camera.y = this.player.y - (this.canvas.height - marginY);
        }

        // --- RESTORED UPDATE CALLS ---
        this.mapSystem.update(dt);
        this.player.update(dt);
        if (this.weaponSystem) this.weaponSystem.update(dt);

        // Difficulty Scaling
        this.difficultyMultiplier += (dt / 60) * 0.5;
        // -----------------------------

        // Update Starfield (Pass Camera)
        this.starfield.update(dt, this.camera);

        // Update Projectiles
        this.projectiles.forEach(p => p.update(dt));
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);

        // Update Enemies
        this.enemies.forEach(e => e.update(dt));
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);

        // Update Gems
        this.gems.forEach(g => g.update(dt));
        this.gems = this.gems.filter(g => !g.markedForDeletion);

        // Update Particles
        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => !p.markedForDeletion);

        // Update FloatingText
        this.floatingTexts.forEach(t => t.update(dt));
        this.floatingTexts = this.floatingTexts.filter(t => !t.markedForDeletion);

        // Spawn Enemies
        this.enemySpawnTimer += dt;
        if (this.enemySpawnTimer > this.enemySpawnInterval) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }

        this.checkCollisions();
    }

    checkCollisions() {
        // Projectiles vs Enemies/Player
        this.projectiles.forEach(p => {
            if (p.markedForDeletion) return;

            if (p.isEnemy) {
                // Enemy Projectile hitting Player
                const dx = p.x - this.player.x;
                const dy = p.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < p.radius + this.player.radius) {
                    // Player Hit by Enemy Projectile
                    if (!this.player.isInvulnerable) {
                        this.player.hp -= p.damage;
                        this.updateUI(); // Immediate UI update
                        this.spawnFloatingText(this.player.x, this.player.y, `-${p.damage}`, '#ff0000');

                        if (this.player.hp <= 0) {
                            this.gameOver();
                        }
                    }
                    p.markedForDeletion = true;
                }
            } else {
                // Player Projectile hitting Enemy
                this.enemies.forEach(e => {
                    if (e.markedForDeletion) return;

                    const dx = p.x - e.x;
                    const dy = p.y - e.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < p.radius + e.radius) {
                        e.takeDamage(p.damage);
                        p.markedForDeletion = true;
                        this.spawnParticles(p.x, p.y, 3, '#ffaa00');

                        if (e.markedForDeletion) {
                            this.spawnParticles(e.x, e.y, 10, '#ff0055');
                        }
                    }
                });
            }
        });

        // Enemies vs Player
        this.enemies.forEach(e => {
            const dx = e.x - this.player.x;
            const dy = e.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < e.radius + this.player.radius) {
                if (!this.player.isInvulnerable) {
                    // Body Collision Damage
                    const collisionDmg = 10; // Fixed touch damage
                    this.player.hp -= collisionDmg;
                    this.updateUI();
                    this.spawnFloatingText(this.player.x, this.player.y, `-${collisionDmg}`, '#ff0000');

                    // Knockback?
                    const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
                    this.player.velocity.x += Math.cos(angle) * 500;
                    this.player.velocity.y += Math.sin(angle) * 500;

                    if (this.player.hp <= 0) {
                        this.gameOver();
                    }
                }
            }
        });

        // Gems vs Player
        this.gems.forEach(g => {
            const dx = g.x - this.player.x;
            const dy = g.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < g.radius + this.player.radius) {
                this.addExp(g.value);
                g.markedForDeletion = true;
            }
        });
    }

    draw() {
        // Draw Background (Screen Space / Parallax handled in Starfield)
        this.starfield.draw(this.ctx);

        // --- WORLD SPACE RENDERING ---
        this.ctx.save();
        // Translate context by negative camera position
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Draw Entities
        this.gems.forEach(g => g.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.player.draw(this.ctx);
        this.particles.forEach(p => p.draw(this.ctx));
        this.floatingTexts.forEach(t => t.draw(this.ctx)); // Text in world space

        if (this.weaponSystem) this.weaponSystem.draw(this.ctx);

        this.ctx.restore();
        // --- END WORLD SPACE ---

        // Draw Mouse Cursor Overlay (Screen Space)
        const mouse = this.input.getMousePosition();
        this.ctx.strokeStyle = '#00f0ff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2);
        this.ctx.moveTo(mouse.x - 12, mouse.y);
        this.ctx.lineTo(mouse.x + 12, mouse.y);
        this.ctx.moveTo(mouse.x, mouse.y - 12);
        this.ctx.lineTo(mouse.x, mouse.y + 12);
        this.ctx.stroke();
    }
}
