import crypto from 'crypto';

export function generateBlockchainHash(data) {
  const payload = JSON.stringify(data) + Date.now();
  return `0x${crypto.createHash('sha256').update(payload).digest('hex')}`;
}

export function verifyBlockchainHash(hash) {
  return typeof hash === 'string' && hash.startsWith('0x') && hash.length === 66;
}
