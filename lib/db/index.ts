import {
  initializeDatabase as initDrizzleDatabase,
  closeDatabase as closeDrizzleDatabase,
  saveDatabase as saveDrizzleDatabase,
  getDatabaseSync,
  dbConfig,
  isDatabaseInitialized,
} from "./drizzle";

// Database file path - use environment variable or default to local file
const DB_PATH = dbConfig.path;

/**
 * Initialize the database (async initialization)
 * Call this once at application startup
 */
export async function initializeDatabase() {
  return await initDrizzleDatabase();
}

/**
 * Get the database instance synchronously
 * Will throw if database hasn't been initialized
 */
export function getDatabase() {
  return getDatabaseSync();
}

/**
 * Save the database to disk
 * Call this after mutations to persist changes
 */
export function saveDatabase() {
  return saveDrizzleDatabase();
}

/**
 * Close the database connection
 * Useful for cleanup in tests or graceful shutdown
 */
export function closeDatabase() {
  return closeDrizzleDatabase();
}

/**
 * Get database path (for debugging/logging)
 */
export function getDatabasePath(): string {
  return DB_PATH;
}

/**
 * Check if database has been initialized with schema
 */
export { isDatabaseInitialized };

/**
 * Get the Drizzle database instance (for advanced usage)
 * This provides access to the full Drizzle ORM capabilities
 */
export async function getDrizzleDatabase() {
  return await initDrizzleDatabase();
}
