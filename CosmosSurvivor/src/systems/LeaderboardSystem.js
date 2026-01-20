import { SUPABASE_CONFIG } from '../core/Env.js';

export class LeaderboardSystem {
    constructor(game) {
        this.game = game;
        this.storageKey = 'cosmos_survivor_scores';
        this.maxScores = 10;

        // Init Supabase
        this.supabase = null;
        if (window.supabase) {
            try {
                this.supabase = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);
                console.log('Supabase initialized');
            } catch (e) {
                console.error('Supabase init failed. Using Offline Mode.', e);
            }
        }
    }

    async saveScore(scoreData) {
        // Online Save
        if (this.supabase && !SUPABASE_CONFIG.URL.includes('YOUR_SUPABASE')) {
            try {
                const { error } = await this.supabase
                    .from('leaderboard')
                    .insert([
                        {
                            name: scoreData.name,
                            score: scoreData.score,
                            level: scoreData.level
                        }
                    ]);

                if (error) throw error;
                console.log('Score saved to Cloud');
            } catch (e) {
                console.error('Failed to save to Cloud', e);
                this.saveLocal(scoreData);
            }
        } else {
            this.saveLocal(scoreData);
        }
    }

    saveLocal(scoreData) {
        const scores = this.loadLocal();
        scores.push(scoreData);
        scores.sort((a, b) => b.score - a.score);
        if (scores.length > this.maxScores) scores.length = this.maxScores;
        localStorage.setItem(this.storageKey, JSON.stringify(scores));
    }

    loadLocal() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    }

    async getHighScores() {
        // Try Online Fetch
        if (this.supabase && !SUPABASE_CONFIG.URL.includes('YOUR_SUPABASE')) {
            try {
                const { data, error } = await this.supabase
                    .from('leaderboard')
                    .select('*')
                    .order('score', { ascending: false })
                    .limit(this.maxScores);

                if (error) throw error;
                return data;
            } catch (e) {
                console.error('Failed to fetch from Cloud', e);
                return this.loadLocal();
            }
        }

        return this.loadLocal();
    }
}
