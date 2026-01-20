export const CONFIG = {
    GAME: {
        DIFFICULTY_SCALING_PER_MINUTE: 0.5,
        ENEMY_SPAWN_INTERVAL: 2.0,
        MAX_WEAPONS: 10
    },
    DIFFICULTY: {
        EASY: { name: 'Easy', mult: 1.0, color: '#00ff00', spawnRate: 1.2, expMult: 1.5 },
        NORMAL: { name: 'Normal', mult: 1.5, color: '#ffff00', spawnRate: 1.0, expMult: 1.0 },
        HARD: { name: 'Hard', mult: 2.0, color: '#ff8800', spawnRate: 0.8, expMult: 0.8 },
        ABYSS: { name: 'Abyss', mult: 3.0, color: '#ff0088', spawnRate: 0.6, expMult: 0.6 },
        HELL: { name: 'Hell', mult: 5.0, color: '#ff0000', spawnRate: 0.4, expMult: 0.5 },
        IMPOSSIBLE: { name: 'Impossible', mult: 10.0, color: '#aa00ff', spawnRate: 0.3, expMult: 0.4 }
    },
    PLAYER: {
        BASE_SPEED: 400,
        BASE_FIRE_RATE: 5,
        BASE_DAMAGE: 10,
        BASE_HP: 100,
        DASH_SPEED: 1000,
        DASH_DURATION: 0.2,
        DASH_COOLDOWN: 3.0,
        DASH_COUNT: 1
    },
    ENEMY: {
        CHASER: { SPEED: 100, HP: 10, VALUE: 10, COLOR: '#ff0055', RADIUS: 20, DAMAGE: 10 },
        SHOOTER: { SPEED: 60, HP: 15, VALUE: 20, COLOR: '#aa00ff', RADIUS: 25, DAMAGE: 8 },
        DASHER: { SPEED: 250, HP: 8, VALUE: 15, COLOR: '#ffaa00', RADIUS: 15, DAMAGE: 15 },
        TANK: { SPEED: 40, HP: 50, VALUE: 50, COLOR: '#00ff00', RADIUS: 40, DAMAGE: 20 },
        SWARMER: { SPEED: 180, HP: 3, VALUE: 5, COLOR: '#00ffff', RADIUS: 10, DAMAGE: 5 },
        DUPLICATOR: { SPEED: 80, HP: 20, VALUE: 25, COLOR: '#ff88ff', RADIUS: 22, DAMAGE: 8 },
        ADAPTIVE: { SPEED: 100, HP: 35, VALUE: 40, COLOR: '#88ffff', RADIUS: 25, DAMAGE: 12 },
        BOMBER: { SPEED: 150, HP: 8, VALUE: 20, COLOR: '#ff4400', RADIUS: 18, DAMAGE: 30 },
        TELEPORTER: { SPEED: 60, HP: 15, VALUE: 25, COLOR: '#8800ff', RADIUS: 20, DAMAGE: 10 },
        SHIELDER: { SPEED: 50, HP: 25, VALUE: 35, COLOR: '#0088ff', RADIUS: 28, DAMAGE: 8, SHIELD: 30 },
        HEALER: { SPEED: 70, HP: 18, VALUE: 30, COLOR: '#00ff88', RADIUS: 22, DAMAGE: 5, HEAL_RATE: 5 },
        SWARM_MOTHER: { SPEED: 30, HP: 80, VALUE: 100, COLOR: '#ffff00', RADIUS: 45, DAMAGE: 15 },
        GHOST: { SPEED: 120, HP: 12, VALUE: 20, COLOR: '#ffffff88', RADIUS: 18, DAMAGE: 8, EVASION: 0.5 },
        SCALE_FACTOR_PER_LEVEL: 0.1
    },
    BOSS: {
        MINI: {
            HP_BASE: 500,
            SPEED: 80,
            VALUE: 500,
            COLOR: '#ff00aa',
            RADIUS: 60,
            SPAWN_TIME_PCT: 0.5,
            DAMAGE: 25
        },
        STAGE: {
            HP_BASE: 2000,
            SPEED: 40,
            VALUE: 2000,
            COLOR: '#ff0000',
            RADIUS: 120,
            SPAWN_TIME_PCT: 1.0,
            DAMAGE: 40
        },
        SECRET: {
            HP_BASE: 50000,
            SPEED: 90,
            VALUE: 100000,
            COLOR: '#000000', // Uses special drawing
            RADIUS: 150,
            DAMAGE: 100
        }
    },
    CHARACTERS: {
        VANGUARD: {
            NAME: 'Vanguard',
            DESCRIPTION: 'Balanced fighter equipped with an auto-turret.',
            STATS: { SPEED: 400, HP: 100, FIRE_RATE: 5 },
            STARTING_WEAPON: 'TURRET'
        },
        SPECTRE: {
            NAME: 'Spectre',
            DESCRIPTION: 'Fast and stealthy, uses orbital defenses.',
            STATS: { SPEED: 550, HP: 60, FIRE_RATE: 8 },
            STARTING_WEAPON: 'ORBITAL'
        }
    },
    MAP: {
        ZONE_DURATION: 60,
        SPAWN_DIST: 600
    },
    WEAPON: {
        ORBITAL_SPEED: 2,
        TURRET_RANGE: 300
    },
    SKILLS: {
        BLACK_HOLE: { name: 'Black Hole', cooldown: 30, damage: 50, duration: 3, color: '#bf00ff', rarity: 'LEGENDARY' },
        DOOM: { name: 'Doom', cooldown: 20, damage: 200, delay: 3, color: '#660000', rarity: 'EPIC' },
        FIREBALL: { name: 'FireBall', cooldown: 8, damage: 40, radius: 100, color: '#ff4400', rarity: 'RARE' },
        ICEBALL: { name: 'Ice Ball', cooldown: 12, damage: 30, freezeDuration: 3, color: '#00ccff', rarity: 'RARE' },
        POISON_CLOUD: { name: 'Poison Cloud', cooldown: 10, damagePerSec: 15, duration: 5, color: '#00ff00', rarity: 'UNCOMMON' },
        LIGHTNING_STORM: { name: 'Lightning Storm', cooldown: 15, damage: 25, strikes: 8, color: '#ffff00', rarity: 'EPIC' },
        METEOR_SHOWER: { name: 'Meteor Shower', cooldown: 25, damage: 60, count: 5, color: '#ff8800', rarity: 'LEGENDARY' },
        TIME_STOP: { name: 'Time Stop', cooldown: 45, duration: 2, color: '#ffffff', rarity: 'LEGENDARY' },
        DIVINE_SHIELD: { name: 'Divine Shield', cooldown: 60, duration: 3, color: '#ffff88', rarity: 'EPIC' },
        SOUL_HARVEST: { name: 'Soul Harvest', cooldown: 20, threshold: 0.15, radius: 200, color: '#aa00ff', rarity: 'EPIC' }
    }
};
