'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lock, Unlock, Upload, Trash2, Download, FileText, Image,
  File as FileGenericIcon, ShieldCheck, Eye, EyeOff, AlertTriangle, X, RefreshCw,
} from 'lucide-react';

// ─── Crypto helpers (Web Crypto API, runs entirely in browser) ──────────────

const PBKDF2_ITERATIONS = 200000;
const KEY_USAGE = ['encrypt', 'decrypt'];

async function deriveKey(passphrase, saltHex) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'],
  );
  const salt = hexToBytes(saltHex);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    KEY_USAGE,
  );
}

function bytesToHex(buf) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return arr;
}

async function encryptFile(file, passphrase) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const saltHex   = bytesToHex(saltBytes);
  const ivBytes   = crypto.getRandomValues(new Uint8Array(12));
  const ivHex     = bytesToHex(ivBytes);

  const key        = await deriveKey(passphrase, saltHex);
  const plaintext  = await file.arrayBuffer();
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivBytes }, key, plaintext);

  return {
    encryptedBlob: new Blob([ciphertext], { type: 'application/octet-stream' }),
    iv:   ivHex,
    salt: saltHex,
  };
}

async function decryptFile(encryptedBuffer, ivHex, saltHex, passphrase) {
  const key       = await deriveKey(passphrase, saltHex);
  const ivBytes   = hexToBytes(ivHex);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, key, encryptedBuffer);
  return plaintext;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_MB   = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function FileIcon({ mime, className = 'w-5 h-5' }) {
  if (mime?.startsWith('image/')) return <Image className={className} />;
  if (mime?.startsWith('text/') || mime === 'application/pdf') return <FileText className={className} />;
  return <FileGenericIcon className={className} />;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── VaultSection ─────────────────────────────────────────────────────────────

// docVaultKey — passphrase string held in page.js memory (survives section switches).
// setDocVaultKey — clears it on browser tab hide or logout (handled in page.js).
export default function VaultSection({ docVaultKey, setDocVaultKey }) {
  // Derive locked state from whether the parent has a key
  const locked = !docVaultKey;

  const [passphrase, setPassphrase] = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [unlockErr, setUnlockErr]   = useState('');

  const [files, setFiles]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [uploadOk, setUploadOk]   = useState('');

  const [deletingId, setDeletingId]       = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Change passphrase / re-encrypt state
  const [reEncryptOpen, setReEncryptOpen]       = useState(false);
  const [newPass, setNewPass]                   = useState('');
  const [confirmPass, setConfirmPass]           = useState('');
  const [reEncryptErr, setReEncryptErr]         = useState('');
  const [reEncryptProgress, setReEncryptProgress] = useState(null); // null | { done, total, step }
  const [reEncryptDone, setReEncryptDone]       = useState(false);

  const fileInputRef = useRef(null);

  // Load files when unlocked (either first unlock or returning to Vault tab while still unlocked)
  useEffect(() => {
    if (!locked) loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vault/files', { credentials: 'include' });
      const json = await res.json();
      setFiles(json.files || []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlockErr('');
    if (!passphrase.trim()) { setUnlockErr('Enter a passphrase.'); return; }
    if (passphrase.length < 8) { setUnlockErr('Passphrase must be at least 8 characters.'); return; }
    // Verify passphrase can derive a key (no server round-trip needed — we just trust the user)
    try {
      // Quick key derivation test to ensure WebCrypto is available
      const testSalt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
      await deriveKey(passphrase, testSalt);
    } catch {
      setUnlockErr('Your browser does not support the required cryptography. Please use a modern browser.');
      return;
    }
    setDocVaultKey(passphrase);
    setPassphrase('');
  };

  const handleLock = () => {
    setDocVaultKey(null);
    setPassphrase('');
    setFiles([]);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    if (!file) return;
    setUploadErr('');
    setUploadOk('');

    if (file.size > MAX_BYTES) {
      setUploadErr(`File is too large. Maximum size is ${MAX_MB} MB.`);
      return;
    }

    setUploading(true);
    try {
      const { encryptedBlob, iv, salt } = await encryptFile(file, docVaultKey);

      const form = new FormData();
      form.append('encryptedBlob', encryptedBlob, `${file.name}.enc`);
      form.append('iv',   iv);
      form.append('salt', salt);
      form.append('name', file.name);
      form.append('mime', file.type || 'application/octet-stream');

      const res  = await fetch('/api/vault/upload', { method: 'POST', credentials: 'include', body: form });
      let json;
      try { json = await res.json(); } catch { throw new Error('Server error — check that BLOB_READ_WRITE_TOKEN is set in Vercel environment variables.'); }
      if (!res.ok) throw new Error(json.error || 'Upload failed.');

      setUploadOk(`"${file.name}" encrypted and stored.`);
      await loadFiles();
    } catch (err) {
      setUploadErr(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId, fileName) => {
    if (!confirm(`Delete "${fileName}"? This cannot be undone.`)) return;
    setDeletingId(fileId);
    try {
      const res  = await fetch('/api/vault/delete', {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fileId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Delete failed.');
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      alert(err.message || 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (file) => {
    setDownloadingId(file.id);
    try {
      // API proxies the private blob and returns IV/salt/name/mime in headers
      const res = await fetch(`/api/vault/download?id=${encodeURIComponent(file.id)}`, { credentials: 'include' });
      if (!res.ok) {
        let msg = 'Download failed.';
        try { msg = (await res.json()).error || msg; } catch {}
        throw new Error(msg);
      }

      const iv   = res.headers.get('X-Vault-IV');
      const salt = res.headers.get('X-Vault-Salt');
      const name = decodeURIComponent(res.headers.get('X-Vault-Name') || file.name);
      const mime = res.headers.get('X-Vault-Mime') || 'application/octet-stream';

      const encryptedBuffer = await res.arrayBuffer();

      // Decrypt in browser
      const plainBuffer = await decryptFile(encryptedBuffer, iv, salt, docVaultKey);

      // Trigger download
      const blob   = new Blob([plainBuffer], { type: mime });
      const url    = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href  = url;
      anchor.download = name;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Download failed. Check your passphrase — if you changed it after uploading, older files cannot be decrypted.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Helper to extract a useful message from any thrown value
  const errMsg = (err) => {
    if (!err) return 'Unknown error';
    if (err.message) return err.message;
    if (err.name)    return err.name;
    return String(err);
  };

  // Download + decrypt a single file, returning { plainBuf, iv, salt, name, mime }
  const fetchAndDecrypt = async (file, passphrase) => {
    const dlRes = await fetch(`/api/vault/download?id=${encodeURIComponent(file.id)}`, { credentials: 'include' });
    if (!dlRes.ok) throw new Error(`Download failed (HTTP ${dlRes.status})`);
    const iv   = dlRes.headers.get('X-Vault-IV');
    const salt = dlRes.headers.get('X-Vault-Salt');
    const name = decodeURIComponent(dlRes.headers.get('X-Vault-Name') || file.name);
    const mime = dlRes.headers.get('X-Vault-Mime') || file.mime || 'application/octet-stream';
    const encBuf = await dlRes.arrayBuffer();
    try {
      const plainBuf = await decryptFile(encBuf, iv, salt, passphrase);
      return { plainBuf, iv, salt, name, mime };
    } catch {
      throw new Error(`Decryption failed for "${name}" — wrong passphrase or file is corrupted.`);
    }
  };

  const handleReEncrypt = async () => {
    setReEncryptErr('');
    if (newPass.length < 8)       { setReEncryptErr('New passphrase must be at least 8 characters.'); return; }
    if (newPass !== confirmPass)   { setReEncryptErr('Passphrases do not match.'); return; }
    if (newPass === docVaultKey)   { setReEncryptErr('New passphrase is the same as current.'); return; }
    if (files.length === 0)        { setReEncryptErr('No files to re-encrypt.'); return; }

    setReEncryptDone(false);
    const total = files.length;

    // ── Phase 1: pre-flight — decrypt every file in memory before touching storage ──
    setReEncryptProgress({ done: 0, total, step: 'Validating passphrase — decrypting all files…' });
    const decrypted = [];
    for (let i = 0; i < total; i++) {
      const file = files[i];
      setReEncryptProgress({ done: i, total, step: `Validating "${file.name}" (${i + 1}/${total})…` });
      try {
        const result = await fetchAndDecrypt(file, docVaultKey);
        decrypted.push({ file, ...result });
      } catch (err) {
        setReEncryptErr(`Validation failed on "${file.name}": ${errMsg(err)}`);
        setReEncryptProgress(null);
        return;
      }
    }

    // ── Phase 2: re-encrypt + upload all (no deletes yet) ──
    const uploaded = []; // { oldId, newId }
    for (let i = 0; i < total; i++) {
      const { file, plainBuf, name, mime } = decrypted[i];
      setReEncryptProgress({ done: i, total, step: `Uploading re-encrypted "${name}" (${i + 1}/${total})…` });
      try {
        const plainBlob = new Blob([plainBuf], { type: mime });
        const { encryptedBlob, iv: newIv, salt: newSalt } = await encryptFile(plainBlob, newPass);
        const form = new FormData();
        form.append('encryptedBlob', encryptedBlob, `${name}.enc`);
        form.append('iv', newIv); form.append('salt', newSalt);
        form.append('name', name); form.append('mime', mime);
        const upRes = await fetch('/api/vault/upload', { method: 'POST', credentials: 'include', body: form });
        let upJson;
        try { upJson = await upRes.json(); } catch { throw new Error('Upload response was not JSON'); }
        if (!upRes.ok) throw new Error(upJson.error || 'Upload failed');
        uploaded.push({ oldId: file.id, newId: upJson.file.id });
      } catch (err) {
        setReEncryptErr(`Upload failed on "${name}": ${errMsg(err)}. No files have been deleted — originals are intact.`);
        setReEncryptProgress(null);
        // Clean up any new blobs already uploaded
        for (const { newId } of uploaded) {
          await fetch('/api/vault/delete', { method: 'DELETE', credentials: 'include',
            headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: newId }) }).catch(() => {});
        }
        await loadFiles();
        return;
      }
    }

    // ── Phase 3: delete old blobs (all new ones are safely uploaded) ──
    setReEncryptProgress({ done: total, total, step: 'Cleaning up old files…' });
    for (const { oldId } of uploaded) {
      await fetch('/api/vault/delete', { method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: oldId }) }).catch(() => {});
    }

    // Done
    setDocVaultKey(newPass);
    setNewPass(''); setConfirmPass('');
    setReEncryptProgress(null);
    setReEncryptDone(true);
    await loadFiles();
  };

  // ── Locked UI ────────────────────────────────────────────────────────────────
  if (locked) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <Lock className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">Document Vault</h2>
          <p className="text-sm text-gray-400 mb-6">
            Files are encrypted in your browser with AES-256-GCM before upload. Only you — with the correct passphrase — can decrypt them.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Vault Passphrase</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter vault passphrase"
                  className="w-full bg-slate-700 border border-white/10 rounded-lg px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {unlockErr && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{unlockErr}
              </p>
            )}
            <button type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <Unlock className="w-4 h-4" /> Unlock Vault
            </button>
          </form>

          <div className="mt-5 p-3 bg-slate-700/40 rounded-lg text-left">
            <p className="text-xs text-gray-500 flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
              Your passphrase never leaves your device. If you lose it, your files cannot be recovered.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Unlocked UI ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <Unlock className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Document Vault</h2>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Encrypted · Auto-locks on tab switch
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setReEncryptOpen(true); setReEncryptErr(''); setReEncryptDone(false); setNewPass(''); setConfirmPass(''); }}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-300 border border-white/10 hover:border-amber-400/40 px-3 py-1.5 rounded-lg transition-colors">
            <ShieldCheck className="w-3.5 h-3.5" /> Change Passphrase
          </button>
          <button onClick={handleLock}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-colors">
            <Lock className="w-3.5 h-3.5" /> Lock
          </button>
        </div>
      </div>

      {/* ── Change Passphrase modal ── */}
      {reEncryptOpen && (
        <div className="bg-slate-800/60 border border-amber-400/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-200">Change Vault Passphrase</p>
              <p className="text-xs text-gray-400 mt-0.5">All {files.length} file{files.length !== 1 ? 's' : ''} will be re-encrypted in your browser. Nothing leaves your device unencrypted.</p>
            </div>
            {!reEncryptProgress && (
              <button onClick={() => setReEncryptOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {reEncryptDone ? (
            <p className="text-sm text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> All files re-encrypted. Vault is now using your new passphrase.
            </p>
          ) : reEncryptProgress ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{reEncryptProgress.step}</span>
                <span>{reEncryptProgress.done}/{reEncryptProgress.total}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div className="bg-amber-400 h-1.5 rounded-full transition-all"
                  style={{ width: `${(reEncryptProgress.done / reEncryptProgress.total) * 100}%` }} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
                  placeholder="New passphrase (min. 8 chars)"
                  className="w-full bg-slate-700 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="relative">
                <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Confirm new passphrase"
                  className="w-full bg-slate-700 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              {reEncryptErr && (
                <p className="text-xs text-red-400 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{reEncryptErr}
                </p>
              )}
              <button onClick={handleReEncrypt} disabled={!newPass || !confirmPass}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> Re-encrypt {files.length} file{files.length !== 1 ? 's' : ''} with new passphrase
              </button>
              <p className="text-xs text-gray-500 text-center">Old passphrase: current session key · Cannot be undone</p>
            </div>
          )}
        </div>
      )}

      {/* Upload area */}
      <div className="bg-slate-800/40 border border-dashed border-white/20 rounded-xl p-6 text-center hover:border-indigo-500/50 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
        <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
        <p className="text-sm text-gray-300 mb-1">Upload & encrypt a file</p>
        <p className="text-xs text-gray-500 mb-4">Max {MAX_MB} MB · Encrypted with AES-256-GCM in your browser</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          {uploading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Encrypting & uploading…</> : <><Upload className="w-4 h-4" /> Choose File</>}
        </button>
        {uploadErr && (
          <p className="mt-3 text-xs text-red-400 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />{uploadErr}
          </p>
        )}
        {uploadOk && (
          <p className="mt-3 text-xs text-emerald-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />{uploadOk}
          </p>
        )}
      </div>

      {/* File list */}
      <div className="bg-slate-800/40 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-300">
            {files.length === 0 ? 'No files' : `${files.length} file${files.length !== 1 ? 's' : ''}`}
          </p>
          <button onClick={loadFiles} disabled={loading}
            className="text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading…</div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No files in vault yet. Upload one above.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {files.map((file) => (
              <li key={file.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 text-indigo-400">
                  <FileIcon mime={file.mime} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatBytes(file.size)} · {formatDate(file.uploadedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(file)}
                    disabled={downloadingId === file.id}
                    title="Decrypt & download"
                    className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors disabled:opacity-50">
                    {downloadingId === file.id
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <Download className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(file.id, file.name)}
                    disabled={deletingId === file.id}
                    title="Delete file"
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50">
                    {deletingId === file.id
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Security note */}
      <div className="p-3 bg-slate-800/30 border border-white/5 rounded-lg">
        <p className="text-xs text-gray-500 flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
          Files are encrypted with AES-256-GCM using a key derived from your passphrase (PBKDF2 · 200,000 iterations · SHA-256). The server never sees your passphrase or plaintext. Use the same passphrase for all uploads in a session — changing it will make older files undecryptable with the new passphrase.
        </p>
      </div>
    </div>
  );
}
