import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptVaultData, decryptVaultData, computeKeyFingerprint } from './crypto';

test('encryptVaultData and decryptVaultData perform round-trip AES-GCM 256-bit encryption', async () => {
  const secretPayload = JSON.stringify({
    sankalpa: 'May every breath cultivate clarity and compassion',
    streak: 7,
    resonance: 420,
  });
  const passphrase = 'sacred-lotus-key-2026';

  const envelope = await encryptVaultData(secretPayload, passphrase);
  assert.equal(envelope.version, 'E2EE-AES-GCM-256-v1');
  assert.equal(envelope.saltHex.length, 32);
  assert.equal(envelope.ivHex.length, 24);
  assert.ok(envelope.ciphertextHex.length > 32);

  const decrypted = await decryptVaultData(envelope, passphrase);
  assert.equal(decrypted, secretPayload);

  const fp = await computeKeyFingerprint(passphrase);
  assert.equal(envelope.keyFingerprint, fp);

  // Wrong passphrase must reject
  await assert.rejects(async () => {
    await decryptVaultData(envelope, 'wrong-passphrase');
  });
});
