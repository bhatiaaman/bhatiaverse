/**
 * Superuser credentials — loaded from env vars only. No secrets in this file.
 *
 * Required env vars:
 *   FINPLAN_SUPER_USER_ID       — login username for the superuser (e.g. bv-super)
 *   FINPLAN_SUPER_DATA_USER_ID  — admin's login email whose data bv-super reads/writes
 *   FINPLAN_SUPER_HASH_SALT     — hex salt from PBKDF2 key generation
 *   FINPLAN_SUPER_HASH          — hex hash from PBKDF2 key generation
 *
 * To generate a new salt+hash:
 *   node -e "const c=require('crypto'),s=c.randomBytes(16).toString('hex');
 *     console.log('SALT:', s);
 *     console.log('HASH:', c.pbkdf2Sync('YOUR_PW',Buffer.from(s,'hex'),120000,32,'sha256').toString('hex'))"
 */
export const SUPER_USER_ID      = process.env.FINPLAN_SUPER_USER_ID      ?? null;
export const SUPER_DATA_USER_ID = process.env.FINPLAN_SUPER_DATA_USER_ID ?? null;

export const SUPER_HASH = {
  salt: process.env.FINPLAN_SUPER_HASH_SALT ?? null,
  hash: process.env.FINPLAN_SUPER_HASH      ?? null,
};
