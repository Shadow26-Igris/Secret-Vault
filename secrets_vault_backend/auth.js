import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET not set in .env');
}


export function requireAdmin(req, res, next) {
  try {
    const adminKey = process.env.ADMIN_KEY;
    const providedAdmin = req.header('X-ADMIN-KEY');
    const authHeader = req.header('Authorization') || '';

    console.log('DEBUG requireAdmin called', {
      adminKeyPresent: !!adminKey,
      providedAdmin: providedAdmin ? providedAdmin.slice(0, 8) + '...' : null,
      authHeaderPresent: !!authHeader,
      authHeaderSnippet: authHeader ? authHeader.slice(0, 20) + '...' : null,
    });

    if (adminKey && providedAdmin && providedAdmin === adminKey) {
      req.actor = { type: 'admin-key', id: 'admin-key' };
      console.log('DEBUG requireAdmin: granted by X-ADMIN-KEY');
      return next();
    }

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      console.log('DEBUG requireAdmin: no bearer token found');
      return res.status(401).json({ error: 'unauthorized' });
    }
    const token = match[1];

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);

      console.log('DEBUG requireAdmin: jwt verify ok, payload snippet:', {
        sub: payload.sub,
        roles: payload.roles,
        iat: payload.iat,
        exp: payload.exp,
      });

      const roles = payload.roles || [];
      if (!Array.isArray(roles) || !roles.includes('admin')) {
        console.log('DEBUG requireAdmin: jwt missing admin role', { roles });
        return res.status(403).json({ error: 'forbidden' });
      }

      req.user = payload;
      req.actor = { type: 'user', id: payload.sub ?? payload.email ?? 'unknown' };
      console.log('DEBUG requireAdmin: granted by JWT admin role for', req.actor.id);
      return next();
    } catch (e) {
      console.log('DEBUG requireAdmin: jwt verify failed', e && e.message);
      return res.status(401).json({ error: 'invalid token' });
    }
  } catch (err) {
    console.error('requireAdmin error', err);
    return res.status(500).json({ error: 'internal' });
  }
}



export function requireAuth(req, res, next) {
  try {
    const authHeader = req.header('Authorization') || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const token = match[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      req.actor = { type: 'user', id: payload.sub ?? payload.email ?? 'unknown' };
      return next();
    } catch (e) {
      return res.status(401).json({ error: 'invalid token' });
    }
  } catch (err) {
    console.error('requireAuth error', err);
    return res.status(500).json({ error: 'internal' });
  }
}
