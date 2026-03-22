/**
 * Native TOTP implementation (RFC 6238 / RFC 4226).
 * Works with Google Authenticator, Authy, 1Password, etc.
 * No external dependencies — uses Node.js built-in crypto.
 */
import { createHmac, randomBytes } from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(str) {
  const s = str.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = 0, value = 0;
  const output = [];
  for (const char of s) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function generateSecret(length = 20) {
  const bytes = randomBytes(length);
  return Array.from(bytes).map((b) => BASE32_ALPHABET[b % 32]).join('');
}

function hotp(secretBase32, counter) {
  const key = base32Decode(secretBase32);
  const buf = Buffer.alloc(8);
  // Write counter as big-endian 64-bit int (JS safe for counters < 2^53)
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac('sha1', key).update(buf).digest();
  const offset = hmac[19] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) |
               ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) |
               (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

/**
 * Verify a TOTP code. Allows ±1 window (covers clock skew up to 30s).
 */
export function verifyTotp(token, secretBase32, window = 1) {
  const counter = Math.floor(Date.now() / 30_000);
  const t = String(token).replace(/\s/g, '');
  for (let i = -window; i <= window; i++) {
    if (hotp(secretBase32, counter + i) === t) return true;
  }
  return false;
}

/**
 * Generate a random base32 secret suitable for use in an authenticator app.
 */
export { generateSecret };

/**
 * Build the otpauth:// URI used to populate QR codes.
 */
export function keyuri(accountName, issuer, secret) {
  return (
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}` +
    `?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
  );
}
