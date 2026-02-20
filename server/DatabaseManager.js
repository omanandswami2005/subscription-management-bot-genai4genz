import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

/**
 * DatabaseManager handles all SQLite database operations
 * Provides connection management and query execution methods
 */
class DatabaseManager {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  /**
   * Initialize database connection and create tables if needed
   */
  async initialize() {
    try {
      // Ensure data directory exists
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Create database connection
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          throw new Error(`Failed to connect to database: ${err.message}`);
        }
      });

      // Promisify database methods
      this.db.run = promisify(this.db.run);
      this.db.get = promisify(this.db.get);
      this.db.all = promisify(this.db.all);

      // Enable foreign keys
      await this.execute('PRAGMA foreign_keys = ON');

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Execute a SELECT query and return all results
   * @param {string} sql - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Query results
   */
  async query(sql, params = []) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      return await this.db.all(sql, params);
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  /**
   * Execute a SELECT query and return first result
   * @param {string} sql - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|undefined>} First result or undefined
   */
  async queryOne(sql, params = []) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      return await this.db.get(sql, params);
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  /**
   * Execute an INSERT, UPDATE, or DELETE statement
   * @param {string} sql - SQL statement
   * @param {Array} params - Statement parameters
   * @returns {Promise<Object>} Result with lastID and changes
   */
  async execute(sql, params = []) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      const result = await this.db.run(sql, params);
      return {
        lastID: result?.lastID,
        changes: result?.changes
      };
    } catch (error) {
      console.error('Execute error:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      });
    }
  }
}

export default DatabaseManager;
