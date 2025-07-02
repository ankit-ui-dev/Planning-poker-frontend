const { Pool } = require('pg');

const config = {
  user: process.env.USER || 'ankitpandey', // Use system username
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'planning_poker',
  // No password needed for local development on Mac
  port: parseInt(process.env.PGPORT || '5432', 10),
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(config);

// Function to test database connection with retries
const testConnection = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('Successfully connected to database');
      
      // Test if tables exist
      const tableTest = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'rooms'
        );
      `);
      
      if (!tableTest.rows[0].exists) {
        console.log('Tables do not exist. Please run the migrations.');
      }
      
      client.release();
      return true;
    } catch (err) {
      console.error(`Database connection attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('Failed to connect to database after multiple attempts');
  return false;
};

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit the process, just log the error
  console.log('Attempting to recover from pool error...');
});

// Export both pool and test function
module.exports = {
  pool,
  testConnection
}; 