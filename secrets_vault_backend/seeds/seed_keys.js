import pool from '../db.js';
import { encrypt } from '../crypto-utils.js';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  try {
    const samples = [
      {
        name: 'Seed API Key 1',
        service: 'github',
        environment: 'dev',
        description: 'Sample seeded key 1',
        secret: 'seed-secret-1'
      },
      {
        name: 'Seed DB Creds',
        service: 'mysql',
        environment: 'staging',
        description: 'Sample DB creds',
        secret: 'seed-db-secret'
      }
    ];

    for (const s of samples) {
      const id = randomUUID();
      const createdAt = new Date();
      const { encrypted, iv, tag } = encrypt(s.secret);
      await pool.execute(
        `INSERT INTO \`keys\` (id, name, service, environment, description, secret, iv, tag, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, s.name, s.service, s.environment, s.description, encrypted, iv, tag, createdAt]
      );
      console.log('Inserted seed key', id, s.name);
    }
  } catch (e) {
    console.error('seed error', e);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
