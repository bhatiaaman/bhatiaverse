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
  salt: '201cb66e455fd276e4df775a1eb2b17d',
  hash: '1ec3e58b1452ef8aa480d381a21c03c9b38207999071a250254ce8aecb9183d6',
};
