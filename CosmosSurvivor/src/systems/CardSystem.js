/**
 * CardSystem - Manages passive upgrade cards for stat boosts and special abilities
 * Separated from SkillSystem to allow for different upgrade paths
 */
export class CardSystem {
    constructor(game) {
        this.game = game;

        // All card definitions organized by category
        this.cardDefinitions = {
            // === OFFENSIVE CARDS ===
            DAMAGE_UP: {
                id: 'DAMAGE_UP',
                name: 'Power Core',
                category: 'OFFENSIVE',
                description: 'Increases projectile damage.',
                baseValue: 5,
                unit: ' DMG',
                weight: 1.0,
                maxStacks: 10,
                apply: (game, value) => { game.player.damage += value; }
            },
            FIRE_RATE_UP: {
                id: 'FIRE_RATE_UP',
                name: 'Rapid Fire Module',
                category: 'OFFENSIVE',
                description: 'Increases firing speed.',
                baseValue: 0.5,
                unit: ' shots/s',
                weight: 0.8,
                maxStacks: 8,
                apply: (game, value) => { game.player.baseFireRate += value; }
            },
            MULTISHOT: {
                id: 'MULTISHOT',
                name: 'Multishot Array',
                category: 'OFFENSIVE',
                description: 'Fire additional projectiles.',
                baseValue: 1,
                unit: ' projectile',
                weight: 0.15,
                maxStacks: 5,
                apply: (game, value) => { game.player.projectileCount += value; }
            },
            PROJECTILE_SPEED: {
                id: 'PROJECTILE_SPEED',
                name: 'Accelerator',
                category: 'OFFENSIVE',
                description: 'Faster projectiles.',
                baseValue: 50,
                unit: '',
                weight: 0.6,
                maxStacks: 8,
                apply: (game, value) => { game.player.projectileSpeed += value; }
            },
            CRITICAL_STRIKE: {
                id: 'CRITICAL_STRIKE',
                name: 'Critical Module',
                category: 'OFFENSIVE',
                description: 'Chance for 2x damage.',
                baseValue: 5,
                unit: '% crit',
                weight: 0.4,
                maxStacks: 6,
                apply: (game, value) => {
                    game.player.critChance = (game.player.critChance || 0) + value / 100;
                }
            },
            PIERCING: {
                id: 'PIERCING',
                name: 'Piercing Rounds',
                category: 'OFFENSIVE',
                description: 'Projectiles pass through enemies.',
                baseValue: 1,
                unit: ' pierce',
                weight: 0.2,
                maxStacks: 3,
                apply: (game, value) => {
                    game.player.piercing = (game.player.piercing || 0) + value;
                }
            },
            CHAIN_LIGHTNING: {
                id: 'CHAIN_LIGHTNING',
                name: 'Chain Lightning',
                category: 'OFFENSIVE',
                description: 'Damage chains to nearby enemies.',
                baseValue: 2,
                unit: ' chains',
                weight: 0.15,
                maxStacks: 3,
                apply: (game, value) => {
                    game.player.chainCount = (game.player.chainCount || 0) + value;
                }
            },
            RICOCHET: {
                id: 'RICOCHET',
                name: 'Ricochet',
                category: 'OFFENSIVE',
                description: 'Projectiles bounce to new targets.',
                baseValue: 1,
                unit: ' bounce',
                weight: 0.2,
                maxStacks: 3,
                apply: (game, value) => {
                    game.player.ricochet = (game.player.ricochet || 0) + value;
                }
            },
            LIFE_STEAL: {
                id: 'LIFE_STEAL',
                name: 'Vampirism Module',
                category: 'OFFENSIVE',
                description: 'Heal a percentage of damage dealt.',
                baseValue: 3,
                unit: '% lifesteal',
                weight: 0.1, // Rare
                maxStacks: 5,
                apply: (game, value) => {
                    game.player.lifeSteal = (game.player.lifeSteal || 0) + value / 100;
                }
            },
            BERSERKER: {
                id: 'BERSERKER',
                name: 'Berserker Mode',
                category: 'OFFENSIVE',
                description: '+50% damage when below 30% HP.',
                baseValue: 50,
                unit: '% dmg bonus',
                weight: 0.15,
                maxStacks: 1,
                apply: (game, value) => {
                    game.player.hasBerserker = true;
                    game.player.berserkerBonus = value / 100;
                }
            },
            RAM_DAMAGE: {
                id: 'RAM_DAMAGE',
                name: 'Spiked Hull',
                category: 'OFFENSIVE',
                description: 'Deal damage when colliding with enemies.',
                baseValue: 50,
                unit: ' damage',
                weight: 0.2,
                maxStacks: 5,
                apply: (game, value) => {
                    game.player.collisionDamage = (game.player.collisionDamage || 0) + value;
                }
            },

            // === DEFENSIVE CARDS ===
            MAX_HP_UP: {
                id: 'MAX_HP_UP',
                name: 'Hull Plating',
                category: 'DEFENSIVE',
                description: 'Increases max HP.',
                baseValue: 20,
                unit: ' HP',
                weight: 0.7,
                maxStacks: 10,
                apply: (game, value) => {
                    game.player.maxHp += value;
                    game.player.hp += value;
                }
            },
            HP_REGEN: {
                id: 'HP_REGEN',
                name: 'Nanofiber Repair',
                category: 'DEFENSIVE',
                description: 'Passively regenerate HP.',
                baseValue: 1,
                unit: ' HP/s',
                weight: 0.5,
                maxStacks: 8,
                apply: (game, value) => { game.player.hpRegen += value; }
            },
            ARMOR: {
                id: 'ARMOR',
                name: 'Armor Plating',
                category: 'DEFENSIVE',
                description: 'Reduce damage taken.',
                baseValue: 10,
                unit: '% reduction',
                weight: 0.4,
                maxStacks: 5,
                apply: (game, value) => {
                    game.player.armor = (game.player.armor || 0) + value / 100;
                }
            },
            SHIELD_GEN: {
                id: 'SHIELD_GEN',
                name: 'Shield Generator',
                category: 'DEFENSIVE',
                description: 'Absorbs one hit every 10 seconds.',
                baseValue: 1,
                unit: ' shield',
                weight: 0.2,
                maxStacks: 3,
                apply: (game, value) => {
                    game.player.shieldCharges = (game.player.shieldCharges || 0) + value;
                    game.player.shieldCooldown = 10;
                }
            },
            SECOND_WIND: {
                id: 'SECOND_WIND',
                name: 'Second Wind',
                category: 'DEFENSIVE',
                description: 'Revive once with 30% HP.',
                baseValue: 30,
                unit: '% revive HP',
                weight: 0.1,
                maxStacks: 1,
                apply: (game, value) => {
                    game.player.hasSecondWind = true;
                    game.player.secondWindHP = value / 100;
                }
            },

            // === MOBILITY CARDS ===
            SPEED_UP: {
                id: 'SPEED_UP',
                name: 'Turbo Engine',
                category: 'MOBILITY',
                description: 'Increases movement speed.',
                baseValue: 30,
                unit: '',
                weight: 0.6,
                maxStacks: 8,
                apply: (game, value) => { game.player.maxSpeed += value; }
            },
            DASH_COUNT: {
                id: 'DASH_COUNT',
                name: 'Dash Capacitor',
                category: 'MOBILITY',
                description: 'Additional dash charge.',
                baseValue: 1,
                unit: ' dash',
                weight: 0.2,
                maxStacks: 3,
                apply: (game, value) => {
                    game.player.dashCount += value;
                    game.player.dashCharges += value;
                }
            },
            DASH_DISTANCE: {
                id: 'DASH_DISTANCE',
                name: 'Extended Thrusters',
                category: 'MOBILITY',
                description: 'Increases dash distance.',
                baseValue: 25,
                unit: '% distance',
                weight: 0.3,
                maxStacks: 4,
                apply: (game, value) => {
                    game.player.dashSpeed += game.player.dashSpeed * (value / 100);
                }
            },
            DASH_COOLDOWN: {
                id: 'DASH_COOLDOWN',
                name: 'Quick Recovery',
                category: 'MOBILITY',
                description: 'Reduces dash cooldown.',
                baseValue: 0.5,
                unit: 's reduction',
                weight: 0.4,
                maxStacks: 4,
                apply: (game, value) => {
                    game.player.dashCooldown = Math.max(0.5, game.player.dashCooldown - value);
                }
            },

            // === UTILITY CARDS ===
            MAGNET: {
                id: 'MAGNET',
                name: 'Tractor Beam',
                category: 'UTILITY',
                description: 'Increases pickup range.',
                baseValue: 50,
                unit: ' range',
                weight: 0.5,
                maxStacks: 6,
                apply: (game, value) => { game.player.pickupRange += value; }
            },
            DOUBLE_XP: {
                id: 'DOUBLE_XP',
                name: 'Experience Amplifier',
                category: 'UTILITY',
                description: 'Bonus experience gain.',
                baseValue: 25,
                unit: '% XP',
                weight: 0.3,
                maxStacks: 4,
                apply: (game, value) => {
                    game.player.expBonus = (game.player.expBonus || 0) + value / 100;
                }
            },
            LUCKY_STAR: {
                id: 'LUCKY_STAR',
                name: 'Lucky Star',
                category: 'UTILITY',
                description: 'Better rarity chances.',
                baseValue: 10,
                unit: '% luck',
                weight: 0.2,
                maxStacks: 5,
                apply: (game, value) => {
                    game.player.luck = (game.player.luck || 0) + value / 100;
                }
            },
            WEAPON_SLOT: {
                id: 'WEAPON_SLOT',
                name: 'Weapon Bay',
                category: 'UTILITY',
                description: 'Unlock additional weapon slot.',
                baseValue: 1,
                unit: ' slot',
                weight: 0.08,
                maxStacks: 3,
                apply: (game, value) => {
                    game.weaponSystem.maxWeapons += value;
                }
            },

            // === AUTOMATION (MYSTICAL) ===
            AUTO_SHOOT: {
                id: 'AUTO_SHOOT',
                name: 'A.I. Gunner',
                category: 'UTILITY',
                description: 'Your ship fires weapons automatically.',
                baseValue: 1,
                unit: '',
                weight: 0.05,
                maxStacks: 1,
                isMystical: true,
                apply: (game, value) => {
                    game.player.autoShoot = true;
                    game.spawnFloatingText(game.player.x, game.player.y, "AUTO FIRE ONLINE", "#00f0ff");
                }
            },
            AUTO_AIM: {
                id: 'AUTO_AIM',
                name: 'Smart Targeting',
                category: 'UTILITY',
                description: 'Your ship aims at enemies automatically.',
                baseValue: 1,
                unit: '',
                weight: 0.05,
                maxStacks: 1,
                isMystical: true,
                apply: (game, value) => {
                    game.player.autoAim = true;
                    game.spawnFloatingText(game.player.x, game.player.y, "TARGETING ONLINE", "#ff00ea");
                }
            },

            // === CONSUMABLE CARDS ===
            FULL_HEAL: {
                id: 'FULL_HEAL',
                name: 'Nanobot Swarm',
                category: 'CONSUMABLE',
                description: 'Restore 50% HP immediately.',
                baseValue: 50,
                unit: '% heal',
                weight: 0.15,
                maxStacks: 999,
                apply: (game, value) => {
                    const healAmt = game.player.maxHp * (value / 100);
                    game.player.hp = Math.min(game.player.hp + healAmt, game.player.maxHp);
                    game.spawnFloatingText(game.player.x, game.player.y, `+${Math.round(healAmt)} HP`, '#00ff00');
                }
            },
            VACUUM: {
                id: 'VACUUM',
                name: 'Singularity Pulse',
                category: 'CONSUMABLE',
                description: 'Collect all gems on screen.',
                baseValue: 1,
                unit: '',
                weight: 0.1,
                maxStacks: 999,
                apply: (game, value) => {
                    game.gems.forEach(gem => {
                        gem.magnetRange = 99999;
                        gem.speed = 1200;
                    });
                    game.spawnFloatingText(game.player.x, game.player.y, "VACUUM!", '#00f0ff');
                }
            },
            BOMB: {
                id: 'BOMB',
                name: 'Screen Nuke',
                category: 'CONSUMABLE',
                description: 'Damage all enemies on screen.',
                baseValue: 50,
                unit: ' damage',
                weight: 0.08,
                maxStacks: 999,
                apply: (game, value) => {
                    game.enemies.forEach(e => {
                        if (!e.markedForDeletion) {
                            e.takeDamage(value, 'explosive');
                        }
                    });
                    game.spawnFloatingText(game.player.x, game.player.y, "BOOM!", '#ff4400');
                }
            }
        };

        // Rarity definitions
        this.rarities = [
            { name: 'Common', multiplier: 1, color: '#ffffff', weight: 60 },
            { name: 'Uncommon', multiplier: 1.5, color: '#00ff00', weight: 30 },
            { name: 'Rare', multiplier: 2.5, color: '#00ccff', weight: 8 },
            { name: 'Epic', multiplier: 4, color: '#a335ee', weight: 1.8 },
            { name: 'Legendary', multiplier: 10, color: '#ff8000', weight: 0.2 }
        ];

        // Mystical Rarity (Not in standard rotation)
        this.mysticalRarity = { name: 'Mystical', multiplier: 1, color: '#ff00ea' };

        // Player's acquired cards (for stacking)
        this.acquiredCards = {}; // { cardId: stackCount }
    }

    generateCard() {
        // Roll rarity
        const luck = this.game.player.luck || 0;
        const rarity = this.rollRarity(luck);

        // Pick a card based on weights
        const cardList = Object.values(this.cardDefinitions).filter(c => !c.isMystical); // Exclude Mystical from standard pool
        const totalWeight = cardList.reduce((sum, c) => sum + c.weight, 0);

        let roll = Math.random() * totalWeight;
        let selectedCard = cardList[0];

        for (const card of cardList) {
            roll -= card.weight;
            if (roll <= 0) {
                selectedCard = card;
                break;
            }
        }

        // Check max stacks
        const currentStacks = this.acquiredCards[selectedCard.id] || 0;
        if (currentStacks >= selectedCard.maxStacks && selectedCard.category !== 'CONSUMABLE') {
            // Reroll if maxed
            return this.generateCard();
        }

        // Calculate value with rarity multiplier
        const variance = 0.8 + Math.random() * 0.4;
        let value = selectedCard.baseValue * rarity.multiplier * variance;

        // Round nicely
        if (selectedCard.baseValue >= 1 && !selectedCard.unit.includes('%')) {
            value = Math.round(value);
        } else {
            value = Math.round(value * 10) / 10;
        }

        // Map Rarity to Tier
        const tierMap = {
            'Common': 'I',
            'Uncommon': 'II',
            'Rare': 'III',
            'Epic': 'IV',
            'Legendary': 'V'
        };
        const tier = tierMap[rarity.name] || 'I';

        return {
            ...selectedCard,
            rarity: rarity,
            value: value,
            tier: tier,
            displayName: `${rarity.name} ${selectedCard.name} [Tier ${tier}]`,
            apply: (game) => {
                selectedCard.apply(game, value);

                if (selectedCard.category !== 'CONSUMABLE') {
                    this.acquiredCards[selectedCard.id] = (this.acquiredCards[selectedCard.id] || 0) + 1;
                }

                // Log to upgrade history
                game.acquiredUpgrades.push({
                    name: `${rarity.name} ${selectedCard.name} [Tier ${tier}]`,
                    color: rarity.color
                });
            }
        };
    }

    generateMysticalCard(typeId = null) {
        let cardDef = null;
        if (typeId && this.cardDefinitions[typeId]) {
            cardDef = this.cardDefinitions[typeId];
        } else {
            const mysticalCards = Object.values(this.cardDefinitions).filter(c => c.isMystical);
            cardDef = mysticalCards[Math.floor(Math.random() * mysticalCards.length)];
        }

        return {
            ...cardDef,
            rarity: this.mysticalRarity,
            value: cardDef.baseValue,
            displayName: `Mystical ${cardDef.name}`,
            apply: (game) => {
                cardDef.apply(game, cardDef.baseValue);
                this.acquiredCards[cardDef.id] = (this.acquiredCards[cardDef.id] || 0) + 1;
                game.acquiredUpgrades.push({
                    name: `Mystical ${cardDef.name}`,
                    color: this.mysticalRarity.color
                });
            }
        };
    }

    generateRandomUpgrade(count = 1) {
        // Used for secret boss reward
        let rewards = [];
        for (let i = 0; i < count; i++) {
            // Mix of Mystical Cards and High Tier Skills
            if (Math.random() < 0.5) {
                rewards.push(this.generateMysticalCard());
            } else {
                // Or we could delegate to Game.js to get boss skill drop. 
                // For now let's just use mystical cards here
                rewards.push(this.generateMysticalCard());
            }
        }
        return rewards;
    }

    rollRarity(luckBonus = 0) {
        // Adjust weights based on luck
        const adjustedRarities = this.rarities.map(r => ({
            ...r,
            weight: r.name === 'Common' ? r.weight * (1 - luckBonus) : r.weight * (1 + luckBonus)
        }));

        const totalWeight = adjustedRarities.reduce((sum, r) => sum + r.weight, 0);
        let roll = Math.random() * totalWeight;

        for (const rarity of adjustedRarities) {
            roll -= rarity.weight;
            if (roll <= 0) return rarity;
        }

        return this.rarities[0];
    }

    getCardsByCategory(category) {
        return Object.values(this.cardDefinitions).filter(c => c.category === category);
    }

    reset() {
        this.acquiredCards = {};
    }
}
