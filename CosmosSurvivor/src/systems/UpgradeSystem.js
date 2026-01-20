import { CardSystem } from './CardSystem.js';

/**
 * UpgradeSystem - Manages the upgrade menu and choice generation
 * Now uses CardSystem for passive upgrades and works with SkillSystem for active skills
 */
export class UpgradeSystem {
    constructor(game) {
        this.game = game;
        this.cardSystem = new CardSystem(game);
    }

    getChoices(count = 3) {
        const choices = [];

        for (let i = 0; i < count; i++) {
            const rand = Math.random();

            // 30% chance: Weapon upgrade (if weapons exist)
            if (this.game.weaponSystem &&
                this.game.weaponSystem.activeWeapons.length > 0 &&
                rand < 0.3) {
                const weapon = this.game.weaponSystem.activeWeapons[
                    Math.floor(Math.random() * this.game.weaponSystem.activeWeapons.length)
                ];
                choices.push(this.createWeaponUpgrade(weapon));
            }
            // 25% chance: New weapon (if slots available)
            else if (this.game.weaponSystem &&
                this.game.weaponSystem.activeWeapons.length < this.game.weaponSystem.maxWeapons &&
                rand < 0.55) {
                choices.push(this.game.weaponSystem.generateWeapon());
            }
            // 15% chance: Skill (if skill system exists and slots available)
            else if (this.game.skillSystem &&
                this.game.skillSystem.activeSkills.length < this.game.skillSystem.maxSkills &&
                rand < 0.70) {
                const skill = this.game.skillSystem.generateRandomSkill('UNCOMMON');
                if (skill) {
                    choices.push(this.createSkillCard(skill));
                } else {
                    choices.push(this.cardSystem.generateCard());
                }
            }
            // Remaining: Passive card
            else {
                choices.push(this.cardSystem.generateCard());
            }
        }

        return choices;
    }

    createWeaponUpgrade(weapon) {
        return {
            id: `upgrade_${weapon.name}_${Date.now()}`,
            name: `Upgrade: ${weapon.name}`,
            description: `<b>Enhance Weapon Systems</b><br><span style="color:#00ff00">Damage +20% | Fire Rate +10%</span>`,
            color: '#00ff00',
            apply: (g) => {
                weapon.damage *= 1.2;
                weapon.fireRate *= 1.1;
                weapon.name = `+ ${weapon.name}`;
                g.spawnFloatingText(g.player.x, g.player.y, "WEAPON UPGRADED", "#00ff00");

                g.acquiredUpgrades.push({
                    name: `Upgrade: ${weapon.name}`,
                    color: '#00ff00'
                });
            }
        };
    }

    createSkillCard(skillDef) {
        const rarityColors = {
            'UNCOMMON': '#00ff00',
            'RARE': '#00ccff',
            'EPIC': '#a335ee',
            'LEGENDARY': '#ff8000'
        };

        const tierMap = {
            'UNCOMMON': 'I',
            'RARE': 'II',
            'EPIC': 'III',
            'LEGENDARY': 'IV'
        };

        const tier = tierMap[skillDef.rarity] || 'I';

        return {
            id: skillDef.id,
            name: `${skillDef.name} [Tier ${tier}]`,
            description: `<b>${skillDef.rarity} SKILL</b><br>${skillDef.description}<br><span style="color:#888">CD: ${skillDef.cooldown}s</span>`,
            color: rarityColors[skillDef.rarity] || '#ffffff',
            apply: (g) => {
                g.skillSystem.equipSkill(skillDef.id);

                g.acquiredUpgrades.push({
                    name: `Skill: ${skillDef.name} [Tier ${tier}]`,
                    color: skillDef.color
                });
            }
        };
    }

    reset() {
        this.cardSystem.reset();
    }
}
