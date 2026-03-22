/**
 * Hardcoded superuser — bypasses TOTP and vault.
 * Only the PBKDF2 hash is stored here; plaintext password is never in code.
 * To regenerate: node -e "const c=require('crypto'),s=c.randomBytes(16).toString('hex');
 *   console.log(s, c.pbkdf2Sync('YOUR_PW',Buffer.from(s,'hex'),120000,32,'sha256').toString('hex'))"
 */
export const SUPER_USER_ID = 'bv-super';

// Plan data namespace bv-super reads/writes — set to the admin's login userId.
export const SUPER_DATA_USER_ID = 'bhatiaaman.p@gmail.com';

export const SUPER_HASH = {
  salt: '22d261263d54526f94a58c5312a0b0b8',
  hash: '62fd97fd34141be481c0a94e2e04f31060cdb3a76b0a2fda706e5d66e6f3224b',
};
