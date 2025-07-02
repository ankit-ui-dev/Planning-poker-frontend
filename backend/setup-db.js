const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const config = {
  user: 'postgres',
  host: 'localhost',
  password: 'postgres',
  port: 5432,
};

async function setupDatabase() {
  const client = new Client(config);

  try {
    // Connect to PostgreSQL server
    await client.connect();
    console.log('Connected to PostgreSQL server');

    // Check if database exists
    const dbCheckResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'planning_poker'"
    );

    if (dbCheckResult.rows.length === 0) {
      // Disconnect from default database
      await client.end();

      // Create planning_poker database
      const tempClient = new Client(config);
      await tempClient.connect();
      await tempClient.query('CREATE DATABASE planning_poker');
      await tempClient.end();
      console.log('Created planning_poker database');
    }

    // Connect to planning_poker database
    const dbClient = new Client({
      ...config,
      database: 'planning_poker',
    });
    await dbClient.connect();

    // Read and execute migration file
    const migrationPath = path.join(__dirname, 'src', 'migrations', '001_initial_schema.sql');
    const migration = await fs.readFile(migrationPath, 'utf8');
    await dbClient.query(migration);
    console.log('Successfully ran migrations');

    await dbClient.end();
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignore error if client is already closed
    }
  }
}

setupDatabase(); 