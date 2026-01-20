import { Boss } from '../entities/Boss.js';

export class MapSystem {
    constructor(game) {
        this.game = game;
        this.timer = 0;
        this.zoneCount = 0;

        // State
        this.bossSpawned = false;
        this.miniBossSpawned = false;
        this.waitingForKill = false;
        this.hazardTimer = 0;
        this.totalTime = 0; // Track total survival time

        // Procedural Pools
        this.prefixes = [
            { name: 'Deep', color: '#000000', stars: '#ffffff' },
            { name: 'Crimson', color: '#100005', stars: '#ff0000' },
            { name: 'Frozen', color: '#000510', stars: '#00f0ff' },
            { name: 'Toxic', color: '#051000', stars: '#00ff00' },
            { name: 'Golden', color: '#100500', stars: '#ffaa00' },
            { name: 'Void', color: '#000000', stars: '#aa00ff' },
            { name: 'Nebula', color: '#050010', stars: '#ff00aa' }
        ];

        this.roots = ['Sector', 'Expanse', 'Hive', 'Belt', 'Field', 'Zone', 'Nursery', 'Graveyard'];

        this.hazards = [
            { type: 'NONE', weight: 4 },
            { type: 'SLOW', weight: 2 },
            { type: 'CORROSION', weight: 1 },
            { type: 'INTERFERENCE', weight: 1 }
        ];

        // Seed first zone
        this.currentZone = this.generateZone(0);
        this.nextZone = this.generateZone(1);
    }

    generateZone(depth) {
        // 1. Pick Name & Visuals
        const prefix = this.prefixes[Math.floor(Math.random() * this.prefixes.length)];
        const root = this.roots[Math.floor(Math.random() * this.roots.length)];
        const name = `${prefix.name} ${root}`;

        // 2. Pick Hazard
        let hazard = 'NONE';
        const hazardRoll = Math.random() * 8; // Sum of weights
        let cumWeight = 0;
        for (const h of this.hazards) {
            cumWeight += h.weight;
            if (hazardRoll <= cumWeight) {
                hazard = h.type;
                break;
            }
        }
        // Force NONE for first zone
        if (depth === 0) hazard = 'NONE';

        // 3. Generate Spawn Table based on Depth/Difficulty
        // Base weights - expanded for new enemy types
        let weights = {
            'chaser': 10,
            'shooter': 0,
            'dasher': 0,
            'tank': 0,
            'swarmer': 0,
            'duplicator': 0,
            'adaptive': 0,
            'bomber': 0,
            'teleporter': 0,
            'shielder': 0,
            'healer': 0,
            'swarm_mother': 0,
            'ghost': 0
        };

        // Progressive difficulty scaling - unlock new enemies per zone
        if (depth > 0) {
            weights['shooter'] += depth * 2;
            weights['swarmer'] += depth * 2;
        }
        if (depth > 1) {
            weights['dasher'] += depth * 2;
            weights['bomber'] += depth * 1.5;
        }
        if (depth > 2) {
            weights['tank'] += depth * 1.5;
            weights['teleporter'] += depth * 1.5;
            weights['ghost'] += depth * 1;
        }
        if (depth > 3) {
            weights['duplicator'] += depth * 1.5;
            weights['shielder'] += depth * 1;
        }
        if (depth > 4) {
            weights['adaptive'] += depth * 1;
            weights['healer'] += depth * 0.8;
        }
        if (depth > 5) {
            weights['swarm_mother'] += depth * 0.5;
        }

        // Normalize
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        const spawnTable = {};
        for (const k in weights) {
            spawnTable[k] = weights[k] / total;
        }

        return {
            name: name,
            duration: 60, // Fixed 60s for now, could variable
            bgColor: prefix.color,
            starColor: prefix.stars,
            debuff: hazard,
            spawnTable: spawnTable
        };
    }

    update(dt) {
        this.totalTime += dt; // Always track total time

        if (this.waitingForKill) return;

        this.timer += dt;

        // Calculate wave-based multipliers
        this.waveExpMultiplier = 1 + (this.zoneCount * 0.15); // +15% per zone
        this.waveDamageMultiplier = 1 + (this.zoneCount * 0.1); // +10% per zone

        // Apply Debuffs using currentZone (preserve upgrades)
        const baseSpeed = this.game.player.baseStats?.maxSpeed || 400;
        if (this.currentZone.debuff === 'SLOW') {
            this.game.player.maxSpeed = Math.max(150, this.game.player.maxSpeed * 0.5);
        }

        if (this.currentZone.debuff === 'CORROSION') {
            this.hazardTimer += dt;
            if (this.hazardTimer > 1.0) {
                this.game.player.fireRateMultiplier = 0.5;
                this.hazardTimer = 0;
            }
        } else {
            this.game.player.fireRateMultiplier = 1.0;
        }

        // Secret Boss Spawn Logic (Dynamic Probability)
        // Base 0.05% + increasing by time (guarantees spawn eventually)
        const spawnChance = 0.0005 + (this.totalTime * 0.0001);

        if (!this.secretBossSpawned && this.game.level >= 5 && Math.random() < spawnChance) {
            this.spawnSecretBoss();
        }
        // MiniBoss at 50%
        if (!this.miniBossSpawned && this.timer > this.currentZone.duration * 0.5) {
            this.spawnBoss('miniboss');
            this.miniBossSpawned = true;
            this.game.spawnFloatingText(this.game.player.x, this.game.player.y - 150, "WARNING: MINI-BOSS DETECTED", "#ff00aa");
        }

        // Zone Transition / Stage Boss
        if (this.timer > this.currentZone.duration && !this.bossSpawned) {
            this.spawnBoss('stage_boss');
            this.bossSpawned = true;
            this.waitingForKill = true;
            this.game.spawnFloatingText(this.game.player.x, this.game.player.y - 150, "WARNING: STAGE BOSS DETECTED", "#ff0000");
        }
    }

    getExpMultiplier() {
        return this.waveExpMultiplier || 1;
    }

    getDamageMultiplier() {
        return this.waveDamageMultiplier || 1;
    }

    spawnBoss(type) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 600;
        const x = this.game.player.x + Math.cos(angle) * dist;
        const y = this.game.player.y + Math.sin(angle) * dist;
        this.game.enemies.push(new Boss(this.game, x, y, type));
    }

    spawnSecretBoss() {
        this.secretBossSpawned = true;
        this.spawnBoss('secret');
        this.game.spawnFloatingText(this.game.player.x, this.game.player.y - 200, "WARNING: ANOMALY DETECTED", "#bf00ff");
    }

    bossDefeated() {
        if (this.waitingForKill) {
            // Next Zone
            this.waitingForKill = false;
            this.timer = 0;
            this.zoneCount++;

            // Generate next
            this.currentZone = this.nextZone;
            this.nextZone = this.generateZone(this.zoneCount + 1);

            this.bossSpawned = false;
            this.miniBossSpawned = false;

            this.game.spawnFloatingText(this.game.player.x, this.game.player.y - 100, `WARP: ${this.currentZone.name}`, '#00f0ff');
            // TODO: Trigger background color transition in Starfield if possible
        }
    }

    getCurrentZone() {
        return this.currentZone;
    }

    getSpawnType() {
        const table = this.currentZone.spawnTable;
        const roll = Math.random();
        let cumulative = 0;
        for (const [type, weight] of Object.entries(table)) {
            cumulative += weight;
            if (roll <= cumulative) return type;
        }
        return 'chaser';
    }

    reset() {
        this.timer = 0;
        this.totalTime = 0;
        this.zoneCount = 0;
        this.bossSpawned = false;
        this.miniBossSpawned = false;
        this.secretBossSpawned = false; // Reset secret boss state
        this.waitingForKill = false;
        this.hazardTimer = 0;

        // Reset to first zone or generate fresh
        this.currentZone = this.generateZone(0);
        this.nextZone = this.generateZone(1);
    }
}
