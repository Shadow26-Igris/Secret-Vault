// run_migrations.js
import fs from 'fs';
import path from 'path';
import pool from '../db.js'; // uses your existing db pool
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const dir = path.resolve('./migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  console.log('Running migrations:', files);
  for (const file of files) {
    const full = path.join(dir, file);
    const sql = fs.readFileSync(full, 'utf8').toString().trim();
    if (!sql) { console.log('skip empty', file); continue; }
    console.log(`\n--- Running ${file} ---`);
    try {
      // split by semicolon where appropriate to run multiple statements
      // mysql2 supports multiple statements if connection allowed; to be safe, execute whole file
      await pool.query(sql);
      console.log(`OK: ${file}`);
    } catch (err) {
      console.error(`ERROR running ${file}:`, err.message || err);
      process.exitCode = 1;
      throw err;
    }
  }
  console.log('\nMigrations complete.');
  // close pool
  await pool.end();
}

run().catch(err => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});
