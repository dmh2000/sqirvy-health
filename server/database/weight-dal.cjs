const dbConnection = require('./connection.cjs');

class WeightDAL {
    constructor() {
        this.db = dbConnection;
    }

    // Weight entries operations
    getAllWeightEntries() {
        const stmt = this.db.prepare('SELECT * FROM weight_entries ORDER BY date DESC');
        return stmt.all();
    }

    getWeightEntryByDate(date) {
        const stmt = this.db.prepare('SELECT * FROM weight_entries WHERE date = ?');
        return stmt.get(date);
    }

    addWeightEntry(date, weight) {
        const stmt = this.db.prepare('INSERT OR REPLACE INTO weight_entries (date, weight) VALUES (?, ?)');
        return stmt.run(date, weight);
    }

    deleteWeightEntry(date) {
        const stmt = this.db.prepare('DELETE FROM weight_entries WHERE date = ?');
        return stmt.run(date);
    }

    // Weight goals operations
    getCurrentGoal() {
        const stmt = this.db.prepare('SELECT * FROM weight_goals WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1');
        return stmt.get();
    }

    setGoal(goalWeight) {
        const transaction = this.db.transaction(() => {
            // Deactivate current goals
            this.db.prepare('UPDATE weight_goals SET is_active = 0').run();
            
            // Add new goal
            const stmt = this.db.prepare('INSERT INTO weight_goals (goal_weight, is_active) VALUES (?, 1)');
            return stmt.run(goalWeight);
        });

        return transaction();
    }

    // Save entire weight data (for compatibility with existing API)
    saveWeightData(weightData) {
        const transaction = this.db.transaction(() => {
            // Clear existing data
            this.db.prepare('DELETE FROM weight_entries').run();
            this.db.prepare('DELETE FROM weight_goals').run();

            // Insert weight goal
            if (weightData.weight && weightData.weight.goal) {
                const goalStmt = this.db.prepare('INSERT INTO weight_goals (goal_weight, is_active) VALUES (?, 1)');
                goalStmt.run(weightData.weight.goal);
            }

            // Insert weight entries
            if (weightData.weight && weightData.weight.daily) {
                const entryStmt = this.db.prepare('INSERT INTO weight_entries (date, weight) VALUES (?, ?)');
                weightData.weight.daily.forEach(entry => {
                    entryStmt.run(entry.date, entry.weight);
                });
            }
        });

        transaction();
    }

    // Get weight data in original JSON format (for compatibility with existing API)
    getWeightData() {
        const goal = this.getCurrentGoal();
        const daily = this.getAllWeightEntries().map(entry => ({
            date: entry.date,
            weight: entry.weight
        }));

        return {
            weight: {
                goal: goal ? goal.goal_weight : 0,
                daily
            }
        };
    }
}

module.exports = new WeightDAL();