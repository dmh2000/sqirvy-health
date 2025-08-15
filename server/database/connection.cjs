const Database = require('better-sqlite3');
const path = require('path');

class DatabaseConnection {
    constructor() {
        this.db = null;
    }

    connect() {
        if (!this.db) {
            const dbPath = path.join(__dirname, '../../db/sqirvy-health.db');
            this.db = new Database(dbPath);
            
            // Enable foreign keys
            this.db.pragma('foreign_keys = ON');
            
            console.log('Connected to SQLite database');
        }
        return this.db;
    }

    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log('Database connection closed');
        }
    }

    getDb() {
        if (!this.db) {
            this.connect();
        }
        return this.db;
    }

    // Helper method for transactions
    transaction(fn) {
        const db = this.getDb();
        return db.transaction(fn);
    }

    // Helper method for prepared statements
    prepare(sql) {
        const db = this.getDb();
        return db.prepare(sql);
    }
}

// Singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;