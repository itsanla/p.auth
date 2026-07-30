import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.SQLITE_DB_PATH || "/data/p-auth.sqlite";

// Ensure directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    try {
        fs.mkdirSync(dbDir, { recursive: true });
    } catch (err) {
        console.error("Failed to create DB directory:", err);
    }
}

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
    if (!dbInstance) {
        dbInstance = new Database(DB_PATH);
        // Optimize for concurrent access and safety
        dbInstance.pragma("journal_mode = WAL");
        dbInstance.pragma("synchronous = NORMAL");

        // Initialize table
        dbInstance.exec(`
            CREATE TABLE IF NOT EXISTS credentials (
                email TEXT PRIMARY KEY,
                secret_key TEXT NOT NULL,
                backup_codes TEXT
            )
        `);
    }
    return dbInstance;
}

export interface DbCredential {
    email: string;
    secret_key: string;
    backup_codes: string; // Comma separated list of backup codes
}

export function getDbCredentials(): DbCredential[] {
    try {
        const db = getDb();
        return db.prepare("SELECT * FROM credentials").all() as DbCredential[];
    } catch (error) {
        console.error("Failed to fetch credentials from SQLite:", error);
        return [];
    }
}

export function insertDbCredential(email: string, key: string, backupCodes: string) {
    const db = getDb();
    db.prepare(
        "INSERT OR REPLACE INTO credentials (email, secret_key, backup_codes) VALUES (?, ?, ?)"
    ).run(email, key, backupCodes);
}

export function deleteDbCredential(email: string) {
    const db = getDb();
    db.prepare("DELETE FROM credentials WHERE email = ?").run(email);
}
