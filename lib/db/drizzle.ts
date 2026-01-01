/**
 * Drizzle ORM Database Connection Layer with sql.js
 *
 * This module provides the database connection for Drizzle ORM with sql.js.
 * It creates and manages the SQLite database connection and Drizzle instance.
 *
 * Database file: doeit.db (persistent SQLite file)
 * Location: Project root directory
 */

import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import * as schema from "./schema/index.js";

// Database file path - use environment variable or default to local file
const DB_PATH = process.env.DATABASE_PATH || "./doeit.db";

// Singleton instances
let sqliteInstance: SqlJsDatabase | null = null;
let drizzleInstance: any = null;
let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

/**
 * Initialize SQL.js (must be called once before using the database)
 */
async function initializeSqlJs(): Promise<
  Awaited<ReturnType<typeof initSqlJs>>
> {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) => {
        // Return the path to the WASM file
        return require.resolve(`sql.js/dist/${file}`);
      },
    });
  }
  return SQL;
}

/**
 * Get or create the SQLite database instance
 */
async function getOrCreateSqlite(): Promise<SqlJsDatabase> {
  const sql = await initializeSqlJs();

  if (!sqliteInstance) {
    try {
      const fs = require("fs");

      // Try to load existing database file
      if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        sqliteInstance = new sql.Database(buffer);
        console.log("[DB] Loaded existing database from", DB_PATH);
      } else {
        // Create new database
        sqliteInstance = new sql.Database();
        console.log("[DB] Created new database at", DB_PATH);
      }

      // Enable foreign keys
      sqliteInstance.run("PRAGMA foreign_keys = ON");
      sqliteInstance.run("PRAGMA journal_mode = WAL");
      sqliteInstance.run("PRAGMA synchronous = NORMAL");
      sqliteInstance.run("PRAGMA temp_store = MEMORY");
    } catch (error) {
      console.error("[DB] Error initializing SQLite:", error);
      throw error;
    }
  }

  return sqliteInstance;
}

/**
 * Get the Drizzle database instance
 * This is the main export for use in queries
 */
export async function getDatabase(): Promise<any> {
  if (!drizzleInstance) {
    const sqlite = await getOrCreateSqlite();
    // Use drizzle with sql.js - create a custom wrapper
    drizzleInstance = createDrizzleWrapper(sqlite);
  }
  return drizzleInstance;
}

/**
 * Create a Drizzle wrapper for sql.js
 * This provides a minimal Drizzle-like interface for sql.js
 */
function createDrizzleWrapper(sqlite: SqlJsDatabase) {
  return {
    // Select queries
    select: (fields?: any) => {
      const query = {
        from: (table: any) => {
          const queryBuilder = {
            where: (condition: any) => {
              const sqlParts = buildWhereClause(condition);
              const sql = `SELECT ${fields ? Object.keys(fields).join(", ") : "*"} FROM ${table.name} WHERE ${sqlParts.sql}`;
              const stmt = sqlite.prepare(sql);
              stmt.bind(sqlParts.params);
              const results = [];
              while (stmt.step()) {
                results.push(stmt.getAsObject());
              }
              stmt.free();
              return results;
            },
            orderBy: (column: any) => {
              const sql = `SELECT ${fields ? Object.keys(fields).join(", ") : "*"} FROM ${table.name} ORDER BY ${column.name}`;
              const stmt = sqlite.prepare(sql);
              const results = [];
              while (stmt.step()) {
                results.push(stmt.getAsObject());
              }
              stmt.free();
              return results;
            },
            limit: (count: number) => {
              const sql = `SELECT ${fields ? Object.keys(fields).join(", ") : "*"} FROM ${table.name} LIMIT ${count}`;
              const stmt = sqlite.prepare(sql);
              const results = [];
              while (stmt.step()) {
                results.push(stmt.getAsObject());
              }
              stmt.free();
              return results;
            },
          };

          // Execute immediately if no further chaining
          const sql = `SELECT ${fields ? Object.keys(fields).join(", ") : "*"} FROM ${table.name}`;
          const stmt = sqlite.prepare(sql);
          const results = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return {
            where: queryBuilder.where,
            orderBy: queryBuilder.orderBy,
            limit: queryBuilder.limit,
            _results: results,
          };
        },
      };
      return query;
    },

    // Insert queries
    insert: (table: any) => ({
      values: (data: any) => ({
        returning: () => {
          const columns = Object.keys(data).join(", ");
          const placeholders = Object.keys(data)
            .map(() => "?")
            .join(", ");
          const sql = `INSERT INTO ${table.name} (${columns}) VALUES (${placeholders})`;
          const stmt = sqlite.prepare(sql);
          stmt.bind(Object.values(data));
          stmt.step();
          stmt.free();

          // Get the inserted row
          const idResult = sqlite.exec("SELECT last_insert_rowid() as id");
          const id = idResult[0]?.values[0]?.[0];

          // Fetch the inserted row
          const selectStmt = sqlite.prepare(
            `SELECT * FROM ${table.name} WHERE id = ?`,
          );
          selectStmt.bind([id]);
          const result = selectStmt.step() ? selectStmt.getAsObject() : null;
          selectStmt.free();

          return [result].filter(Boolean);
        },
        onConflictDoNothing: () => {
          // For now, just do the insert (can be enhanced later)
          const columns = Object.keys(data).join(", ");
          const placeholders = Object.keys(data)
            .map(() => "?")
            .join(", ");
          const sql = `INSERT OR IGNORE INTO ${table.name} (${columns}) VALUES (${placeholders})`;
          const stmt = sqlite.prepare(sql);
          stmt.bind(Object.values(data));
          stmt.step();
          stmt.free();
          return [];
        },
      }),
    }),

    // Update queries
    update: (table: any) => ({
      set: (data: any) => ({
        where: (condition: any) => ({
          returning: () => {
            const setClause = Object.keys(data)
              .map((key) => `${key} = ?`)
              .join(", ");
            const sqlParts = buildWhereClause(condition);
            const sql = `UPDATE ${table.name} SET ${setClause} WHERE ${sqlParts.sql}`;
            const stmt = sqlite.prepare(sql);
            stmt.bind([...Object.values(data), ...sqlParts.params]);
            stmt.step();
            stmt.free();

            // Return updated rows (simplified)
            return [];
          },
        }),
      }),
    }),

    // Delete queries
    delete: (table: any) => ({
      where: (condition: any) => ({
        returning: () => {
          const sqlParts = buildWhereClause(condition);
          const sql = `DELETE FROM ${table.name} WHERE ${sqlParts.sql}`;
          const stmt = sqlite.prepare(sql);
          stmt.bind(sqlParts.params);
          stmt.step();
          stmt.free();
          return [];
        },
      }),
    }),

    // Raw SQL execution
    execute: (sql: string, params: any[] = []) => {
      const stmt = sqlite.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },
  };
}

/**
 * Build WHERE clause from Drizzle conditions
 */
function buildWhereClause(condition: any): { sql: string; params: any[] } {
  if (!condition) return { sql: "1=1", params: [] };

  // Handle simple equality conditions like eq(table.column, value)
  if (
    condition.type === "eq" &&
    condition.column &&
    condition.value !== undefined
  ) {
    return {
      sql: `${condition.column} = ?`,
      params: [condition.value],
    };
  }

  // Handle AND conditions
  if (condition.type === "and" && condition.conditions) {
    const clauses = condition.conditions.map(buildWhereClause);
    return {
      sql: clauses.map((c) => `(${c.sql})`).join(" AND "),
      params: clauses.flatMap((c) => c.params),
    };
  }

  // Default fallback
  return { sql: "1=1", params: [] };
}

/**
 * Initialize the database (async initialization)
 * Call this once at application startup
 */
export async function initializeDatabase(): Promise<any> {
  await getOrCreateSqlite();
  return getDatabase();
}

/**
 * Get the database instance synchronously
 * Will throw if database hasn't been initialized
 */
export function getDatabaseSync(): any {
  if (!drizzleInstance) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first.",
    );
  }
  return drizzleInstance;
}

/**
 * Save the database to disk
 * Call this after mutations to persist changes
 */
export function saveDatabase(): void {
  if (sqliteInstance) {
    try {
      const fs = require("fs");
      const data = sqliteInstance.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    } catch (error) {
      console.error("[DB] Error saving database:", error);
      throw error;
    }
  }
}

/**
 * Close the database connection
 * Useful for cleanup in tests or graceful shutdown
 */
export function closeDatabase(): void {
  if (sqliteInstance) {
    sqliteInstance.close();
    sqliteInstance = null;
    drizzleInstance = null;
    console.log("[DB] Database connection closed");
  }
}

/**
 * Reset database connection
 * Useful for testing or when database file has changed
 */
export function resetConnection(): void {
  closeDatabase();
  console.log("[DB] Database connection reset");
}

/**
 * Get database configuration and connection info
 */
export const dbConfig = {
  path: DB_PATH,
  isConnected: () => sqliteInstance !== null,
};

/**
 * Check if database file exists
 */
export function databaseExists(): boolean {
  try {
    const fs = require("fs");
    return fs.existsSync(DB_PATH);
  } catch {
    return false;
  }
}

/**
 * Get database file size in bytes
 */
export function getDatabaseSize(): number {
  try {
    const fs = require("fs");
    if (databaseExists()) {
      const stats = fs.statSync(DB_PATH);
      return stats.size;
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Execute raw SQL query
 * Use with caution - bypasses Drizzle ORM safety
 */
export function executeRaw(sql: string, params: any[] = []): any {
  if (!sqliteInstance) {
    throw new Error("Database not initialized");
  }

  try {
    const stmt = sqliteInstance.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error("[DB] Raw SQL execution failed:", error);
    throw error;
  }
}

/**
 * Check if database has been initialized with schema
 * Returns true if tables exist
 */
export function isDatabaseInitialized(): boolean {
  if (!sqliteInstance) {
    return false;
  }

  try {
    const result = sqliteInstance.exec(`
      SELECT COUNT(*) as count FROM sqlite_master
      WHERE type='table' AND name='wallets'
    `);

    return result.length > 0 && result[0].values[0][0] > 0;
  } catch {
    return false;
  }
}

/**
 * Get database schema version
 * Returns the current migration version if tracked
 */
export function getSchemaVersion(): number {
  // For sql.js, we track this manually or use a simple table check
  try {
    const result = sqliteInstance?.exec(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='__drizzle_migrations'
    `);

    if (!result || result.length === 0) {
      return 0; // No migrations table = version 0
    }

    // If we had migrations tracking, we'd get the latest version here
    return 1; // For now, return 1 if migrations table exists
  } catch {
    return 0;
  }
}

// For backward compatibility, also export the raw sql.js instance
export { sqliteInstance };

// Default export for convenience
export default getDatabaseSync;

// Handle graceful shutdown
process.on("SIGINT", () => {
  if (sqliteInstance) {
    console.log("[DB] Received SIGINT, saving database...");
    saveDatabase();
    closeDatabase();
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  if (sqliteInstance) {
    console.log("[DB] Received SIGTERM, saving database...");
    saveDatabase();
    closeDatabase();
  }
  process.exit(0);
});
