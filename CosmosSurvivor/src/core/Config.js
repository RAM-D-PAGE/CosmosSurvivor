export const CONFIG = {
    GAME: {
        DIFFICULTY_SCALING_PER_MINUTE: 0.5,
        ENEMY_SPAWN_INTERVAL: 2.0,
        MAX_WEAPONS: 10
    },
    PLAYER: {
        BASE_SPEED: 400,
        BASE_FIRE_RATE: 5,
        BASE_DAMAGE: 10,
        BASE_HP: 100, // Not fully implemented in logic yet, but good to have
        DASH_SPEED: 1000,
        DASH_DURATION: 0.2,
        DASH_COOLDOWN: 3.0
    },
    ENEMY: {
        CHASER: { SPEED: 100, HP: 10, VALUE: 10, COLOR: '#ff0055', RADIUS: 20 },
        SHOOTER: { SPEED: 0, HP: 15, VALUE: 20, COLOR: '#aa00ff', RADIUS: 25 },
        DASHER: { SPEED: 250, HP: 5, VALUE: 15, COLOR: '#ffaa00', RADIUS: 15 },
        TANK: { SPEED: 40, HP: 50, VALUE: 50, COLOR: '#00ff00', RADIUS: 40 },
        SWARMER: { SPEED: 180, HP: 2, VALUE: 5, COLOR: '#00ffff', RADIUS: 10 },
        SCALE_FACTOR_PER_LEVEL: 0.1
    },
    BOSS: {
        MINI: {
            HP_BASE: 500,
            SPEED: 80,
            VALUE: 500,
            COLOR: '#ff00aa',
            RADIUS: 60,
            SPAWN_TIME_PCT: 0.5 // Spawns at 50% of zone duration
        },
        STAGE: {
            HP_BASE: 2000,
            SPEED: 40,
            VALUE: 2000,
            COLOR: '#ff0000',
            RADIUS: 120,
            SPAWN_TIME_PCT: 1.0 // Spawns at 100% of zone duration
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
    }
};
