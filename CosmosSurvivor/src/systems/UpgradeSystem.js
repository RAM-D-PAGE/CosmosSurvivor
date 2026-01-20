export class UpgradeSystem {
    constructor(game) {
        this.game = game;

        // Base definitions for procedural generation
        this.statTypes = [
            { id: 'damage', name: 'Damage', baseAmt: 5, unit: '', weight: 1.0, description: 'Increases projectile damage.' },
            { id: 'fireRate', name: 'Fire Rate', baseAmt: 0.5, unit: ' shots/s', weight: 0.8, description: 'Increases firing speed.' },
            { id: 'maxSpeed', name: 'Speed', baseAmt: 20, unit: '', weight: 0.7, description: 'Increases flight speed.' },
            { id: 'projectileSpeed', name: 'Proj. Speed', baseAmt: 50, unit: '', weight: 0.7, description: 'Faster projectiles.' },
            { id: 'projectileCount', name: 'Multishot', baseAmt: 1, unit: ' projectiles', weight: 0.1, description: 'Adds more projectiles.' },
            { id: 'maxHp', name: 'Hull Plating', baseAmt: 20, unit: ' HP', weight: 0.6, description: 'Increases Max HP and repairs hull.' },
            { id: 'pickupRange', name: 'Tractor Beam', baseAmt: 50, unit: 'px', weight: 0.6, description: 'Increases item collection range.' },
            { id: 'hpRegen', name: 'Nanofiber Repair', baseAmt: 1, unit: ' HP/s', weight: 0.5, description: 'Passively repairs hull over time.' },

            // SPECIAL: Weapon Slot (Handled manually in generation but defined here for weights?)
            // No, let's keep separate logic for Special Cards or inject them into "statTypes" with low weight
            { id: 'weaponSlot', name: 'Weapon Bay', baseAmt: 1, unit: ' Slot', weight: 0.05, description: 'Unlocks an additional weapon slot.' }
        ];

        this.rarities = [
            { name: 'Common', multiplier: 1, color: '#ffffff', weight: 60 },
            { name: 'Uncommon', multiplier: 1.5, color: '#00ff00', weight: 30 },
            { name: 'Rare', multiplier: 2.5, color: '#00ccff', weight: 8 },
            { name: 'Epic', multiplier: 4, color: '#a335ee', weight: 1.8 },
            { name: 'Legendary', multiplier: 10, color: '#ff8000', weight: 0.2 }
        ];

        this.adjectives = {
            'damage': ['Strong', 'Violent', 'Deadly', 'Atomic', 'Cosmic'],
            'fireRate': ['Fast', 'Rapid', 'Gatling', 'Turbo', 'Lightspeed'],
            'maxSpeed': ['Quick', 'Agile', 'Swift', 'Supersonic', 'Warp'],
            'projectileSpeed': ['Sniping', 'Accelerated', 'Railgun', 'Hyper', 'Instant'],
            'projectileCount': ['Double', 'Triple', 'Swarm', 'Army', 'Legion']
        };
    }

    generateSkill() {
        // 1. Pick Rarity
        const totalRarityWeight = this.rarities.reduce((sum, r) => sum + r.weight, 0);
        let randomVal = Math.random() * totalRarityWeight;
        let selectedRarity = this.rarities[0];
        for (const r of this.rarities) {
            randomVal -= r.weight;
            if (randomVal <= 0) {
                selectedRarity = r;
                break;
            }
        }

        // 2. Pick Stat Type
        const totalStatWeight = this.statTypes.reduce((sum, s) => sum + s.weight, 0);
        let randomStat = Math.random() * totalStatWeight;
        let selectedStat = this.statTypes[0];
        for (const s of this.statTypes) {
            randomStat -= s.weight;
            if (randomStat <= 0) {
                selectedStat = s;
                break;
            }
        }

        // ADVANCED LOGIC: Check matches
        // For now, simple value calc
        const variance = 0.8 + Math.random() * 0.4;
        let val = selectedStat.baseAmt * selectedRarity.multiplier * variance;

        if (selectedStat.id === 'projectileCount') val = Math.max(1, Math.round(val));
        else val = Math.round(val * 10) / 10;

        // CHECK EXISTING PLAYER SKILL
        // We need to inject 'game' into generateSkill or accessing it via this.game
        const player = this.game.player;
        let isUpgrade = false;
        let upgradeMsg = "";

        // If player already has this skill
        // Note: Player.skills needs to be implemented fully to track this.
        // For now, we simulate "Upgrade" visual if we detect high rarity

        // 5% Chance for Special Consumables (Overwrites standard generation if hit)
        if (Math.random() < 0.05) {
            const specials = [
                {
                    id: 'full_heal',
                    name: 'Nanobot Swarm',
                    description: '<b>REPAIR PROTOCOL</b><br><span style="color:#00ff00">Restores 50% HP immediately.</span>',
                    color: '#00ff00',
                    apply: (g) => {
                        const healAmt = g.player.maxHp * 0.5;
                        g.player.hp = Math.min(g.player.hp + healAmt, g.player.maxHp);
                        g.spawnFloatingText(g.player.x, g.player.y, `REPAIRED +${Math.round(healAmt)}`, "#00ff00");
                    }
                },
                {
                    id: 'vacuum',
                    name: 'Singularity',
                    description: '<b>GRAVITY PULSE</b><br><span style="color:#00f0ff">Collects all Gems on map.</span>',
                    color: '#00f0ff',
                    apply: (g) => {
                        g.gems.forEach(gem => { gem.magnetRange = 99999; gem.speed = 1200; });
                        g.spawnFloatingText(g.player.x, g.player.y, "VACUUM ACTIVATED", "#00f0ff");
                    }
                }
            ];
            const special = specials[Math.floor(Math.random() * specials.length)];
            return special;
        }

        // 4. Generate Name
        const adjList = this.adjectives[selectedStat.id] || ['Advanced', 'Tactical', 'Heavy', 'Quantum'];
        const adj = adjList[Math.floor(Math.random() * adjList.length)];
        let fullName = `${selectedRarity.name} ${adj} Module`;

        return {
            id: `${selectedStat.id}_${Date.now()}_${Math.random()}`,
            name: fullName,
            description: `<b>${selectedStat.name} +${val}${selectedStat.unit}</b> <br> <span style="color:${selectedRarity.color}; font-size: 0.8em;">(${selectedRarity.name})</span>`,
            color: selectedRarity.color,
            apply: (game) => {
                if (game.player[selectedStat.id] !== undefined) {
                    game.player[selectedStat.id] += val;
                    if (selectedStat.id === 'maxHp') {
                        game.player.hp += val;
                        game.spawnFloatingText(game.player.x, game.player.y, `+${val} HP`, '#00ff00');
                    }
                }
                // Log Upgrade
                game.acquiredUpgrades.push({
                    name: fullName,
                    color: selectedRarity.color
                });
            }
        };
    }

    getChoices(count = 3) {
        const choices = [];
        for (let i = 0; i < count; i++) {
            const rand = Math.random();

            if (this.game.weaponSystem && this.game.weaponSystem.activeWeapons.length > 0 && rand < 0.4) {
                // Try to Upgrade Existing
                const weapon = this.game.weaponSystem.activeWeapons[Math.floor(Math.random() * this.game.weaponSystem.activeWeapons.length)];
                // Generate Upgrade Card
                choices.push({
                    id: `upgrade_${weapon.id}_${Date.now()}`,
                    name: `Upgrade: ${weapon.name}`,
                    description: `<b>Enhance Weapon Systems</b><br><span style="color:#00ff00">Damage +20% | Fire Rate +10%</span>`,
                    color: '#00ff00', // Green for upgrade
                    apply: (g) => {
                        weapon.damage *= 1.2;
                        weapon.fireRate *= 1.1;
                        weapon.name = `+ ${weapon.name}`; // Visual indicator
                        g.spawnFloatingText(g.player.x, g.player.y, "WEAPON UPGRADED", "#00ff00");

                        // Log Upgrade
                        g.acquiredUpgrades.push({
                            name: `Upgrade: ${weapon.name}`,
                            color: '#00ff00'
                        });
                    }
                });
            } else if (this.game.weaponSystem &&
                this.game.weaponSystem.activeWeapons.length < this.game.weaponSystem.maxWeapons &&
                rand < 0.3) {
                choices.push(this.game.weaponSystem.generateWeapon());
            } else {
                choices.push(this.generateSkill());
            }
        }
        return choices;
    }
}
