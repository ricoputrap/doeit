import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import fs from "node:fs";
import path from "node:path";

// Database file path - use environment variable or default to local file
const DB_PATH =
  process.env.DATABASE_PATH || path.join(process.cwd(), "doeit.db");

// Singleton database instance
let db: SqlJsDatabase | null = null;
let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

/**
 * Initialize SQL.js (must be called once before using the database)
 */
async function initializeSqlJs(): Promise<void> {
  if (!SQL) {
    SQL = await initSqlJs();
  }
}

/**
 * Get the database instance (singleton pattern)
 * Creates the connection if it doesn't exist
 * NOTE: This must be called after initializeSqlJs() or use getDatabase() which handles this
 */
function getOrCreateDatabase(): SqlJsDatabase {
  if (!SQL) {
    throw new Error("SQL.js not initialized. Call initializeDatabase() first.");
  }

  if (!db) {
    // Try to load existing database file
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      // Create new database
      db = new SQL.Database();
    }

    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON");
  }

  return db;
}

/**
 * Initialize the database (async initialization)
 * Call this once at application startup
 */
export async function initializeDatabase(): Promise<SqlJsDatabase> {
  await initializeSqlJs();
  return getOrCreateDatabase();
}

/**
 * Get the database instance synchronously
 * Will throw if database hasn't been initialized
 */
export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first.",
    );
  }
  return db;
}

/**
 * Save the database to disk
 * Call this after mutations to persist changes
 */
export function saveDatabase(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

/**
 * Close the database connection
 * Useful for cleanup in tests or graceful shutdown
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Get database path (for debugging/logging)
 */
export function getDatabasePath(): string {
  return DB_PATH;
}

/**
 * Set database instance directly (for testing)
 */
export function setDatabase(newDb: SqlJsDatabase): void {
  db = newDb;
}

/**
 * Get the SQL.js instance (for creating test databases)
 */
export function getSqlJs(): typeof SQL {
  return SQL;
}

/**
 * Set the SQL.js instance (for testing)
 */
export function setSqlJs(sqlJs: Awaited<ReturnType<typeof initSqlJs>>): void {
  SQL = sqlJs;
}

// Export types
export type { SqlJsDatabase as Database };
