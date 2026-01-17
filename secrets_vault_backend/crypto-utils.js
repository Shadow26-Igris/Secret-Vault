import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const keyBase64 = process.env.ENCRYPTION_KEY_BASE64;
if (!keyBase64) {
  throw new Error('ENCRYPTION_KEY_BASE64 not set in env');
}
const KEY = Buffer.from(keyBase64, 'base64');
if (KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY_BASE64 must decode to 32 bytes (256 bits)');
}


export function encrypt(plaintext) {
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv, { authTagLength: 16 });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted, 
    iv,        
    tag        
  };
}

export function decrypt(encrypted, iv, tag) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv, { authTagLength: 16 });
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
