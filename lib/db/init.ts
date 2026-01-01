import { initializeDatabase, closeDatabase, getDatabase } from "./index";
import {
  initializeSchema,
  isDatabaseInitialized,
  seedDefaultCategories,
} from "./schema";

/**
 * Initialize the database on app startup
 * This should be called once when the application starts
 */
export async function initDatabase(): Promise<void> {
  // Initialize SQL.js and get database connection
  await initializeDatabase();

  // Check if schema already exists
  if (!isDatabaseInitialized()) {
    console.log("[DB] Initializing database schema...");
    initializeSchema();
    seedDefaultCategories();
    console.log("[DB] Database initialized with default categories");
  } else {
    // Ensure schema is up to date (idempotent)
    initializeSchema();
    console.log("[DB] Database connected");
  }
}

/**
 * Gracefully shutdown the database connection
 */
export function shutdownDatabase(): void {
  closeDatabase();
  console.log("[DB] Database connection closed");
}

/**
 * Ensure database is ready before operations
 * This is a helper that can be called in API routes
 * Returns a promise that resolves when the database is ready
 */
export async function ensureDatabase(): Promise<void> {
  try {
    // Try to get the database - if it throws, we need to initialize
    getDatabase();
  } catch {
    await initDatabase();
  }
}

// Export for convenience
export {
  initializeSchema,
  isDatabaseInitialized,
  seedDefaultCategories,
} from "./schema";
export {
  getDatabase,
  closeDatabase,
  getDatabasePath,
  initializeDatabase,
  saveDatabase,
} from "./index";
