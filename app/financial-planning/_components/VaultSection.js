'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lock, Unlock, Upload, Trash2, Download, FileText, Image,
  File, ShieldCheck, Eye, EyeOff, AlertTriangle, X, RefreshCw,
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
  return <File className={className} />;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── VaultSection ─────────────────────────────────────────────────────────────

export default function VaultSection() {
  const [locked, setLocked]         = useState(true);
  const [passphrase, setPassphrase] = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [unlockErr, setUnlockErr]   = useState('');

  // Session passphrase kept only in memory, never in localStorage/cookies
  const [sessionKey, setSessionKey] = useState(null); // stores passphrase string while unlocked

  const [files, setFiles]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [uploadOk, setUploadOk]   = useState('');

  const [deletingId, setDeletingId]   = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fileInputRef = useRef(null);

  // Auto-lock when component unmounts or page is hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setSessionKey(null);
        setLocked(true);
        setPassphrase('');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      // Lock on unmount (tab switch)
      setSessionKey(null);
      setLocked(true);
    };
  }, []);

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
    setSessionKey(passphrase);
    setLocked(false);
    setPassphrase('');
    loadFiles();
  };

  const handleLock = () => {
    setSessionKey(null);
    setLocked(true);
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
      const { encryptedBlob, iv, salt } = await encryptFile(file, sessionKey);

      const form = new FormData();
      form.append('encryptedBlob', encryptedBlob, `${file.name}.enc`);
      form.append('iv',   iv);
      form.append('salt', salt);
      form.append('name', file.name);
      form.append('mime', file.type || 'application/octet-stream');

      const res  = await fetch('/api/vault/upload', { method: 'POST', credentials: 'include', body: form });
      const json = await res.json();
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
      // Get signed URL + crypto params
      const res  = await fetch(`/api/vault/download?id=${encodeURIComponent(file.id)}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Download failed.');

      // Fetch encrypted blob from Vercel Blob CDN
      const blobRes = await fetch(json.url);
      if (!blobRes.ok) throw new Error('Could not fetch encrypted file.');
      const encryptedBuffer = await blobRes.arrayBuffer();

      // Decrypt in browser
      const plainBuffer = await decryptFile(encryptedBuffer, json.iv, json.salt, sessionKey);

      // Trigger download
      const blob    = new Blob([plainBuffer], { type: json.mime || 'application/octet-stream' });
      const url     = URL.createObjectURL(blob);
      const anchor  = document.createElement('a');
      anchor.href   = url;
      anchor.download = json.name || 'decrypted-file';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Download failed. Check your passphrase — if you changed it after uploading, older files cannot be decrypted.');
    } finally {
      setDownloadingId(null);
    }
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
        <button onClick={handleLock}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-colors">
          <Lock className="w-3.5 h-3.5" /> Lock
        </button>
      </div>

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
