import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';
import pool from './db.js';
import { encrypt, decrypt } from './crypto-utils.js';
import dotenv from 'dotenv';
dotenv.config();

import { requireAdmin, requireAuth } from './auth.js';
import jwt from 'jsonwebtoken';


const app = express();
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false }));
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline'; connect-src 'self' http://127.0.0.1:5173 http://127.0.0.1:5000;"
  );
  next();
});
app.use(cors({ origin: ['http://127.0.0.1:5173', 'http://localhost:5173'], credentials: true }));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));


async function writeAudit({ keyId = null, action, req, actor = null, meta = null }) {
  try {
    const actorType = actor?.type ?? req?.actor?.type ?? 'anonymous';
    const actorId = actor?.id ?? req?.actor?.id ?? (req?.header('X-ADMIN-KEY') ? 'admin-key' : 'anonymous');
    const id = randomUUID();
    const ip = req?.ip || req?.headers['x-forwarded-for'] || null;
    const metaJson = meta ? JSON.stringify(meta) : null;
    await pool.execute(
      `INSERT INTO audit_events (id, key_id, action, actor_type, actor_id, ip, meta) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, keyId, action, actorType, actorId, ip, metaJson]
    );
  } catch (e) {
    console.error('writeAudit error', e);
  }
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Mock backend root' });
});

app.get('/api/keys', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, service, environment, description, owner_id, created_at FROM \`keys\` WHERE deleted_at IS NULL ORDER BY created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('GET /api/keys err', err);
    return res.status(500).json({ error: 'internal' });
  }
});


const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

if (!JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not set in .env — /auth/login will fail until set.');
}

app.post('/auth/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'missing credentials' });

    const DEV_USER = process.env.ADMIN_USER;
    const DEV_PASS = process.env.ADMIN_PASS;
    if (!DEV_USER || !DEV_PASS) return res.status(500).json({ error: 'auth not configured' });

    if (username !== DEV_USER || password !== DEV_PASS) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const payload = { sub: DEV_USER, email: DEV_USER, roles: ['admin'] };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.json({ token, expiresIn: JWT_EXPIRES_IN });
  } catch (err) {
    console.error('POST /auth/login err', err);
    return res.status(500).json({ error: 'internal' });
  }
});


app.post('/api/keys', requireAuth, async (req, res) => {
  try {
    const { name = null, service = null, environment = null, description = null, secret } = req.body || {};
    if (!secret || typeof secret !== 'string') {
      return res.status(400).json({ error: 'missing secret string' });
    }

    const id = randomUUID();
    const createdAt = new Date();
    const ownerId = req.user?.sub ?? req.user?.email ?? null;

    const { encrypted, iv, tag } = encrypt(secret);

    await pool.execute(
      `INSERT INTO \`keys\` (id, name, service, environment, description, owner_id, secret, iv, tag, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, service, environment, description, ownerId, encrypted, iv, tag, createdAt]
    );

    await writeAudit({ keyId: id, action: 'create', req, meta: { name, service, environment, description } });

    return res.status(201).json({ id, name, service, environment, description, ownerId, createdAt });
  } catch (err) {
    console.error('POST /api/keys err', err);
    return res.status(500).json({ error: 'internal' });
  }
});

app.get('/api/keys/mine', requireAuth, async (req, res) => {
  try {
    const ownerId = req.user?.sub ?? req.user?.email ?? null;
    const [rows] = await pool.query(
      `SELECT id, name, service, environment, description, created_at, updated_at FROM \`keys\` WHERE owner_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
      [ownerId]
    );
    return res.json(rows);
  } catch (err) {
    console.error('GET /api/keys/mine err', err);
    return res.status(500).json({ error: 'internal' });
  }
});


app.get('/api/keys/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reveal = req.query.reveal === 'true';

    console.log('DEBUG GET /api/keys/:id called', {
      id,
      reveal,
      providedAdminHeader: !!req.header('X-ADMIN-KEY'),
      providedAuthHeader: !!req.header('Authorization'),
      query: req.query
    });

    const [rows] = await pool.query(
      `SELECT id, name, service, environment, description, owner_id, secret, iv, tag, created_at, updated_at, deleted_at
       FROM \`keys\` WHERE id = ? LIMIT 1`,
      [id]
    );

    console.log('DEBUG DB rows length =', rows?.length, 'firstRow:', rows?.[0] ? { id: rows[0].id, deleted_at: rows[0].deleted_at } : null);

    const row = rows?.[0];
    if (!row || row.deleted_at) {
      console.log('DEBUG returning not found for id', id);
      return res.status(404).json({ error: 'not found' });
    }

    const base = {
      id: row.id,
      name: row.name,
      service: row.service,
      environment: row.environment,
      description: row.description,
      ownerId: row.owner_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? null
    };

    if (!reveal) return res.json(base);

   
    return requireAdmin(req, res, async () => {
      console.log('DEBUG requireAdmin granted (callback) for id', id, 'actor:', req.actor ?? null);
      if (!row.secret || !row.iv || !row.tag) {
        console.log('DEBUG secret parts missing');
        return res.status(500).json({ error: 'secret not available' });
      }
      try {
        const decrypted = decrypt(row.secret, row.iv, row.tag);
        await writeAudit({ keyId: id, action: 'reveal', req, meta: { reason: req.query.reason ?? null } });
        console.log('DEBUG reveal successful for id', id);
        return res.json({ ...base, secret: decrypted });
      } catch (e) {
        console.error('decrypt error', e);
        return res.status(500).json({ error: 'error decrypting secret' });
      }
    });
  } catch (err) {
    console.error('GET /api/keys/:id err', err);
    return res.status(500).json({ error: 'internal' });
  }
});

 


app.patch('/api/keys/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, service, environment, description, secret } = req.body || {};

    const [existing] = await pool.query('SELECT id, owner_id FROM `keys` WHERE id = ? LIMIT 1', [id]);
    const row = existing?.[0];
    if (!row) return res.status(404).json({ error: 'not found' });

    const isOwner = (req.user && (req.user.sub === row.owner_id || req.user.email === row.owner_id));
    const tryAdminThen = async (cb) => requireAdmin(req, res, cb);

    if (secret !== undefined) {
      return requireAdmin(req, res, async () => {
        const { encrypted, iv, tag } = encrypt(secret);
        const updates = ['secret = ?', 'iv = ?', 'tag = ?', 'updated_at = ?'];
        const params = [encrypted, iv, tag, new Date(), id];
        const sql = `UPDATE \`keys\` SET ${updates.join(', ')} WHERE id = ?`;
        await pool.execute(sql, params);
        await writeAudit({ keyId: id, action: 'rotate', req, meta: { reason: req.body?.reason ?? null } });
        return res.json({ ok: true });
      });
    }

    
    const authHeader = req.header('Authorization') || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: 'unauthorized' });

    // verify token & set req.user
    try {
      const payload = require('jsonwebtoken').verify(match[1], process.env.JWT_SECRET);
      req.user = payload;
      req.actor = { type: 'user', id: payload.sub ?? payload.email ?? 'unknown' };
    } catch (e) {
      return res.status(401).json({ error: 'invalid token' });
    }

    const isNowOwner = (req.user && (req.user.sub === row.owner_id || req.user.email === row.owner_id));
 
    if (!isNowOwner) {
      
      return requireAdmin(req, res, async () => {
        
        const updates = [];
        const params = [];
        if (name !== undefined) { updates.push('name = ?'); params.push(name); }
        if (service !== undefined) { updates.push('service = ?'); params.push(service); }
        if (environment !== undefined) { updates.push('environment = ?'); params.push(environment); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description); }
        if (updates.length === 0) return res.status(400).json({ error: 'nothing to update' });
        updates.push('updated_at = ?'); params.push(new Date()); params.push(id);
        const sql = `UPDATE \`keys\` SET ${updates.join(', ')} WHERE id = ?`;
        await pool.execute(sql, params);
        await writeAudit({ keyId: id, action: 'update-metadata', req, meta: { name, service, environment, description } });
        return res.json({ ok: true });
      });
    }

    
    const updates = [];
    const params = [];
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (service !== undefined) { updates.push('service = ?'); params.push(service); }
    if (environment !== undefined) { updates.push('environment = ?'); params.push(environment); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (updates.length === 0) return res.status(400).json({ error: 'nothing to update' });
    updates.push('updated_at = ?'); params.push(new Date()); params.push(id);
    const sql = `UPDATE \`keys\` SET ${updates.join(', ')} WHERE id = ?`;
    await pool.execute(sql, params);
    await writeAudit({ keyId: id, action: 'update-metadata', req, meta: { name, service, environment, description } });
    return res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/keys/:id err', err);
    return res.status(500).json({ error: 'internal' });
  }
});

app.delete('/api/keys/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      `UPDATE \`keys\` SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL`,
      [new Date(), id]
    );
    const affected = result.affectedRows ?? 0;
    if (!affected) return res.status(404).json({ error: 'not found or already deleted' });

    await writeAudit({ keyId: id, action: 'delete', req, meta: null });
    return res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/keys err', err);
    return res.status(500).json({ error: 'internal' });
  }
});

const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`✅ Mock backend listening on http://${HOST}:${PORT}`);
});




// GET audit logs (admin only)
app.get('/api/audit', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.id,
        a.action,
        a.actor_type,
        a.actor_id,
        a.key_id,
        k.name AS key_name,
        a.ip,
        a.created_at
      FROM audit_events a
      LEFT JOIN \`keys\` k ON a.key_id = k.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);

    res.json(rows);
  } catch (err) {
    console.error('GET /api/audit err', err);
    res.status(500).json({ error: 'internal' });
  }
});

