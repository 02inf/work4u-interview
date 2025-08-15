const sqlite3 = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    try {
      const dbPath = path.resolve('./database.sqlite');
      console.log(`Initializing database at: ${dbPath}`);
      
      this.db = new sqlite3(dbPath);
      this.db.pragma('journal_mode = WAL');
      
      console.log('Connected to SQLite database');
      
      // Create tables
      this.createTables();
      console.log('Database initialization complete');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  createTables() {
    // Drop existing table if schema has changed
    try {
      this.db.exec('DROP TABLE IF EXISTS digests');
      console.log('Dropped existing digests table');
    } catch (error) {
      console.log('No existing table to drop');
    }
    
    // Create digests table with sharing support
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS digests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transcript TEXT NOT NULL,
        summary TEXT NOT NULL,
        created_at TEXT NOT NULL,
        public_id TEXT UNIQUE DEFAULT NULL,
        is_public BOOLEAN DEFAULT 0
      )
    `);
    
    // Create index for public_id for faster lookups
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_public_id 
      ON digests(public_id) 
      WHERE public_id IS NOT NULL
    `);
    
    console.log('Digests table ready with updated schema');
  }

  async createDigest(digest) {
    try {
      // Ensure summary is a string
      const summaryToStore = typeof digest.summary === 'string' 
        ? digest.summary 
        : JSON.stringify(digest.summary);
      
      const stmt = this.db.prepare(`
        INSERT INTO digests (transcript, summary, created_at)
        VALUES (?, ?, ?)
      `);
      
      const result = stmt.run(
        digest.transcript,
        summaryToStore,
        digest.created_at || new Date().toISOString()
      );
      
      console.log(`Digest saved with ID: ${result.lastInsertRowid}`);
      return result.lastInsertRowid;
    } catch (error) {
      console.error('Error creating digest:', error);
      throw error;
    }
  }

  async getAllDigests() {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM digests 
        ORDER BY created_at DESC
      `);
      
      const digests = stmt.all();
      
      // Parse summary if it's stored as JSON string
      const parsedDigests = digests.map(digest => {
        try {
          return {
            ...digest,
            summary: typeof digest.summary === 'string' && digest.summary.startsWith('{')
              ? JSON.parse(digest.summary)
              : digest.summary
          };
        } catch {
          return digest;
        }
      });
      
      console.log(`Fetched digests: ${parsedDigests.length}`);
      return parsedDigests;
    } catch (error) {
      console.error('Error fetching digests:', error);
      throw error;
    }
  }

  async getDigestById(id) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM digests 
        WHERE id = ?
      `);
      
      const digest = stmt.get(id);
      
      if (digest) {
        console.log(`Found digest with ID: ${id}`);
      }
      
      return digest;
    } catch (error) {
      console.error('Error fetching digest:', error);
      throw error;
    }
  }

  async makeDigestPublic(id, publicId) {
    try {
      const stmt = this.db.prepare(`
        UPDATE digests 
        SET public_id = ?, is_public = 1 
        WHERE id = ?
      `);
      
      const result = stmt.run(publicId, id);
      
      if (result.changes > 0) {
        console.log(`Made digest ${id} public with ID: ${publicId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error making digest public:', error);
      throw error;
    }
  }

  async getDigestByPublicId(publicId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM digests 
        WHERE public_id = ?
      `);
      
      const digest = stmt.get(publicId);
      
      if (digest) {
        // Parse summary if it's stored as JSON string
        try {
          if (typeof digest.summary === 'string' && digest.summary.startsWith('{')) {
            digest.summary = JSON.parse(digest.summary);
          }
        } catch {
          // Keep as string if parsing fails
        }
        console.log(`Found digest with public_id: ${publicId}`);
      }
      
      return digest;
    } catch (error) {
      console.error('Error fetching digest by public ID:', error);
      throw error;
    }
  }

  async close() {
    if (this.db) {
      this.db.close();
      console.log('Database connection closed');
    }
  }
}

module.exports = Database;