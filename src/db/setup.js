const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'planning_poker',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

const setupDatabase = async () => {
  try {
    // Drop existing tables if they exist
    await pool.query('DROP TABLE IF EXISTS cards CASCADE');
    await pool.query('DROP TABLE IF EXISTS players CASCADE');
    await pool.query('DROP TABLE IF EXISTS rooms CASCADE');

    // Create rooms table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        room_code VARCHAR(6) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active'
      );
    `);

    // Create players table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id),
        name VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT false,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(room_id, name)
      );
    `);

    // Create cards table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id),
        player_id INTEGER REFERENCES players(id),
        value VARCHAR(50) NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_revealed BOOLEAN DEFAULT false
      );
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
};

module.exports = { pool, setupDatabase }; 