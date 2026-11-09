/**
 * End-to-End Encryption (E2EE) Vault using Web Crypto API (AES-GCM 256-bit + PBKDF2 SHA-256).
 * Protects user mindfulness streaks, Sankalpa intentions, and session history locally
 * and allows zero-knowledge encrypted backup export/import.
 */

export interface EncryptedEnvelope {
  version: 'E2EE-AES-GCM-256-v1';
  saltHex: string;
  ivHex: string;
  ciphertextHex: string;
  timestampISO: string;
  keyFingerprint: string;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function deriveAesGcmKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 60000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function computeKeyFingerprint(passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    enc.encode('pranamandala-fingerprint:' + passphrase)
  );
  const hex = bytesToHex(new Uint8Array(digest));
  return hex.slice(0, 16).toUpperCase();
}

export async function encryptVaultData(
  plaintextJson: string,
  passphrase: string
): Promise<EncryptedEnvelope> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesGcmKey(passphrase, salt);

  const enc = new TextEncoder();
  const encryptedBuf = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    enc.encode(plaintextJson)
  );

  const fingerprint = await computeKeyFingerprint(passphrase);

  return {
    version: 'E2EE-AES-GCM-256-v1',
    saltHex: bytesToHex(salt),
    ivHex: bytesToHex(iv),
    ciphertextHex: bytesToHex(new Uint8Array(encryptedBuf)),
    timestampISO: new Date().toISOString(),
    keyFingerprint: fingerprint,
  };
}

export async function decryptVaultData(
  envelope: EncryptedEnvelope,
  passphrase: string
): Promise<string> {
  const salt = hexToBytes(envelope.saltHex);
  const iv = hexToBytes(envelope.ivHex);
  const ciphertext = hexToBytes(envelope.ciphertextHex);
  const key = await deriveAesGcmKey(passphrase, salt);

  const decryptedBuf = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ciphertext as unknown as BufferSource
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuf);
}
