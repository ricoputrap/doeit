import {
  initializeDatabase,
  closeDatabase,
  saveDatabase,
  getDatabaseSync,
  isDatabaseInitialized,
} from "./drizzle";
import { seedDefaultCategories } from "./seed";

/**
 * Initialize the database on app startup
 * This should be called once when the application starts
 */
export async function initDatabase(): Promise<void> {
  // Initialize SQL.js and Drizzle ORM
  await initializeDatabase();

  // Check if schema already exists
  if (!isDatabaseInitialized()) {
    console.log("[DB] Initializing database schema...");

    // Run migrations if available (in future)
    // For now, the database is already initialized with the existing schema

    // Seed default categories using Drizzle
    const db = await getDatabaseSync();
    await seedDefaultCategories(db);

    console.log("[DB] Database initialized with default categories");
  } else {
    console.log("[DB] Database connected");
  }

  // Save initial state
  saveDatabase();
}

/**
 * Gracefully shutdown the database connection
 * Call this when the application is shutting down
 */
export function shutdownDatabase(): void {
  saveDatabase();
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
    getDatabaseSync();
  } catch {
    console.log("[DB] Database not initialized, initializing now...");
    await initDatabase();
  }
}

// Export for convenience
export {
  initializeDatabase,
  closeDatabase,
  saveDatabase,
  getDatabaseSync,
} from "./drizzle";
