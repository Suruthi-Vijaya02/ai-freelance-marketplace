import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { deployMarketplaceContract } = await import('../services/blockchainService.js');

try {
  const result = await deployMarketplaceContract();
  console.log('Blockchain deployment successful.');
  console.log('Network:', result.network);
  console.log('Contract address:', result.contractAddress);
  console.log('Deployment tx hash:', result.txHash);
  console.log('Verification status:', result.verification?.status || 'UNKNOWN');
} catch (error) {
  console.error('Blockchain deployment failed.');
  console.error('Message:', error?.message || 'Unknown deployment error');
  process.exitCode = 1;
}
