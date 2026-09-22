import test from 'node:test';
import assert from 'node:assert';
import { hashPassword } from '../src/lib/auth';

test('hashPassword produces consistent SHA-256 hash with salt', async () => {
  const hash1 = await hashPassword('my-secret-password');
  const hash2 = await hashPassword('my-secret-password');
  const hashOther = await hashPassword('different-password');

  assert.strictEqual(typeof hash1, 'string');
  assert.strictEqual(hash1.length, 64); // SHA-256 hex string length
  assert.strictEqual(hash1, hash2);
  assert.notStrictEqual(hash1, hashOther);
});
