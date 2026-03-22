/**
 * Hardcoded superuser — bypasses TOTP and vault.
 * Only the PBKDF2 hash is stored here; plaintext password is never in code.
 * To regenerate: node -e "const c=require('crypto'),s=c.randomBytes(16).toString('hex');
 *   console.log(s, c.pbkdf2Sync('YOUR_PW',Buffer.from(s,'hex'),120000,32,'sha256').toString('hex'))"
 */
export const SUPER_USER_ID = 'bv-super';

export const SUPER_HASH = {
  salt: 'f7cf1a5dccd9fd0cc7a2f12af8e091e3',
  hash: '3bc2d56359aed66ded19379f052c0e23d81d3edb8472752cd462961b4a0cc154',
};
