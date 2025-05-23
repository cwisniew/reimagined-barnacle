import sqlite3 from 'sqlite3';
import path from 'path';

// Path to the database file (e.g., in the project root or a dedicated data folder)
const dbPath = path.resolve(__dirname, '../../legocollection.db'); // Places DB in backend root

// Create a new database instance (or open if exists)
// Use verbose mode for more detailed stack traces in case of errors
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_VERBOSE, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Successfully connected to SQLite database at', dbPath);
    initializeDatabase();
  }
});

// Function to initialize the database (create tables if they don't exist)
const initializeDatabase = () => {
  db.serialize(() => { // serialize ensures statements run in order
    db.run(`
      CREATE TABLE IF NOT EXISTS legosets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        setNumber TEXT NOT NULL UNIQUE, // Assuming set numbers should be unique
        description TEXT,
        pictures TEXT, // Store as JSON string or comma-separated
        numberOfPieces INTEGER NOT NULL DEFAULT 0,
        numberOfMinifigs INTEGER NOT NULL DEFAULT 0,
        quantityOwned INTEGER NOT NULL DEFAULT 1,
        storageLocation TEXT,
        isBuilt BOOLEAN NOT NULL DEFAULT 0, // 0 for false, 1 for true
        status TEXT NOT NULL DEFAULT 'Owned' // Owned, Wishlist, Ordered
      )
    `, (err) => {
      if (err) {
        console.error('Error creating legosets table:', err.message);
      } else {
        console.log('Table "legosets" is ready or already exists.');
        // You could add initial data insertion here for testing if needed,
        // but be careful not to duplicate on every server start.
      }
    });
  });
};

// Export the database instance for use in other modules
export default db;
