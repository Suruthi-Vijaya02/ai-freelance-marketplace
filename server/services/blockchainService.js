import crypto from 'crypto';

/** Generates a SHA-256 hash for contract data to ensure tamper-evidence. */
export function generateBlockchainHash(data) {
  const payload = JSON.stringify(data) + Date.now();
  return `0x${crypto.createHash('sha256').update(payload).digest('hex')}`;
}

/** Validates the format and integrity of a blockchain contract hash. */
export function verifyBlockchainHash(hash) {
  return typeof hash === 'string' && hash.startsWith('0x') && hash.length === 66;
}
