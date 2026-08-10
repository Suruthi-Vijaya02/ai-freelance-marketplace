import { Contract, ContractFactory, JsonRpcProvider, Wallet, formatUnits, parseEther } from 'ethers';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ABI = [
  'function registerContract(string calldata projectId, uint256 totalAmount, string[] calldata milestoneTitles, uint256[] calldata milestoneAmounts) external returns (uint256)',
  'function registerMilestone(uint256 contractId, string calldata title, uint256 amount) external returns (uint256)',
  'function releaseMilestone(uint256 contractId, uint256 milestoneIndex) external returns (bool)',
  'function getContract(uint256 contractId) external view returns (string memory projectId, uint256 totalAmount, uint256 milestoneCount)',
  'function getMilestone(uint256 contractId, uint256 milestoneIndex) external view returns (uint256 id, string memory title, uint256 amount, bool released)',
  'function getContractCount() external view returns (uint256)',
  'event ContractCreated(uint256 indexed contractId, string projectId, uint256 totalAmount, uint256 milestoneCount)',
  'event MilestoneReleased(uint256 indexed contractId, uint256 indexed milestoneId, string title, uint256 amount)'
];

export const BLOCKCHAIN_NETWORK = 'sepolia';

function safeEnvValue(key) {
  return process.env[key] ? String(process.env[key]).trim() : '';
}

export function getBlockchainConfig() {
  const rpcUrl = safeEnvValue('SEPOLIA_RPC_URL');
  const privateKey = safeEnvValue('BLOCKCHAIN_PRIVATE_KEY');
  const chainId = safeEnvValue('BLOCKCHAIN_CHAIN_ID') || '11155111';
  const network = safeEnvValue('BLOCKCHAIN_NETWORK') || BLOCKCHAIN_NETWORK;
  const contractAddress = safeEnvValue('BLOCKCHAIN_CONTRACT_ADDRESS');

  return {
   rpcUrl,
   privateKey,
   chainId,
   network,
   contractAddress,
   enabled: !!rpcUrl && !!privateKey && !!contractAddress,
  };
}

export function getBlockchainWallet() {
  const { rpcUrl, privateKey, network } = getBlockchainConfig();
  if (!rpcUrl || !privateKey) {
   throw new Error(`Missing blockchain credentials for ${network}.`);
  }
  return new Wallet(privateKey, new JsonRpcProvider(rpcUrl));
}

export function getBlockchainContract() {
  const { rpcUrl, privateKey, contractAddress, network } = getBlockchainConfig();
  if (!rpcUrl || !privateKey || !contractAddress) {
   throw new Error(`Blockchain contract is not configured for ${network}.`);
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  return new Contract(contractAddress, ABI, wallet);
}

export function getBlockchainProvider() {
  const { rpcUrl } = getBlockchainConfig();
  if (!rpcUrl) {
   throw new Error('Missing Sepolia RPC URL.');
  }
  return new JsonRpcProvider(rpcUrl);
}

export function validateBlockchainAmount(value, context = 'blockchain amount') {
  const numericValue = Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(numericValue) || numericValue <= 0) {
    throw new Error(`Invalid blockchain amount for ${context}: ${String(value)}`);
  }
  return numericValue;
}

export function formatEthValueForTransfer(amount) {
  const numericValue = validateBlockchainAmount(amount, 'ETH transfer');
  return parseEther(numericValue.toString());
}

export function isValidTxHash(hash) {
  return typeof hash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(hash);
}

export async function verifyBlockchainTransaction(txHash, expectedContractAddress) {
  if (!isValidTxHash(txHash)) {
   return {
     status: 'NOT_FOUND',
     txHash,
     network: BLOCKCHAIN_NETWORK,
     exists: false,
     mined: false,
     confirmed: false,
     contractAddressMatches: false,
     message: 'Invalid transaction hash format.',
   };
  }

  try {
   const provider = getBlockchainProvider();
   const tx = await provider.getTransaction(txHash);
   if (!tx) {
     return {
       status: 'NOT_FOUND',
       txHash,
       network: BLOCKCHAIN_NETWORK,
       exists: false,
       mined: false,
       confirmed: false,
       contractAddressMatches: false,
       message: 'Transaction not found on Sepolia.',
     };
   }

   const receipt = await provider.getTransactionReceipt(txHash);
   if (!receipt) {
     return {
       status: 'PENDING',
       txHash,
       network: BLOCKCHAIN_NETWORK,
       exists: true,
       mined: false,
       confirmed: false,
       contractAddressMatches: false,
       blockNumber: tx.blockNumber ?? null,
       message: 'Transaction submitted but not mined yet.',
     };
   }

   const receiptAddress = (receipt.to || receipt.contractAddress || '').toLowerCase();
   const expectedAddress = (expectedContractAddress || '').toLowerCase();
   const contractAddressMatches = !expectedAddress || !receiptAddress || receiptAddress === expectedAddress;

   if (receipt.status === 0) {
     return {
       status: 'FAILED',
       txHash,
       network: BLOCKCHAIN_NETWORK,
       exists: true,
       mined: true,
       confirmed: false,
       contractAddressMatches,
       blockNumber: receipt.blockNumber,
       gasUsed: receipt.gasUsed ? formatUnits(receipt.gasUsed, 'wei') : null,
       message: 'Transaction was mined but failed.',
     };
   }

   return {
     status: 'CONFIRMED',
     txHash,
     network: BLOCKCHAIN_NETWORK,
     exists: true,
     mined: true,
     confirmed: true,
     contractAddressMatches,
     blockNumber: receipt.blockNumber,
     gasUsed: receipt.gasUsed ? formatUnits(receipt.gasUsed, 'wei') : null,
     contractAddress: receipt.contractAddress || receipt.to || expectedContractAddress || null,
     message: 'Transaction confirmed on Sepolia.',
   };
  } catch (error) {
   return {
     status: 'NOT_FOUND',
     txHash,
     network: BLOCKCHAIN_NETWORK,
     exists: false,
     mined: false,
     confirmed: false,
     contractAddressMatches: false,
     message: error?.message || 'Unable to verify Sepolia transaction.',
   };
  }
}

function writeEnvValue(filePath, key, value) {
  const trimmedValue = String(value).trim();
  const envPath = path.resolve(filePath);
  let content = '';
  try {
   content = fs.readFileSync(envPath, 'utf8');
  } catch {
   content = '';
  }

  const nextLines = content.split(/\r?\n/);
  const replaced = nextLines.some((line) => {
   if (line.startsWith(`${key}=`)) {
     const idx = nextLines.indexOf(line);
     nextLines[idx] = `${key}=${trimmedValue}`;
     return true;
   }
   return false;
  });

  const output = replaced ? nextLines.join('\n') : `${content.trim() ? `${content.trim()}\n` : ''}${key}=${trimmedValue}\n`;
  fs.writeFileSync(envPath, output, 'utf8');
}

function getDotEnvPath() {
  return path.resolve(__dirname, '../.env');
}

function findContractCreatedId(contractInstance, receipt) {
  if (!receipt?.logs) return null;

  for (const log of receipt.logs) {
   try {
     const parsed = contractInstance.interface.parseLog(log);
     if (parsed?.name === 'ContractCreated') {
       const createdId = Number(parsed.args[0]);
       return Number.isFinite(createdId) ? createdId : null;
     }
   } catch {
     // Ignore logs that do not match the Marketplace ABI.
   }
  }

  return null;
}

export async function createBlockchainContract({ projectId, totalAmount, milestoneTitles = [], milestoneAmounts = [] } = {}) {
  const { rpcUrl, privateKey, contractAddress, network } = getBlockchainConfig();
  if (!rpcUrl || !privateKey || !contractAddress) {
   return {
     status: 'PENDING',
     verified: false,
     txHash: null,
     network,
     contractAddress: null,
     message: 'Blockchain not configured. Contract registration was skipped.',
     onChainCreated: false,
   };
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  const contract = new Contract(contractAddress, ABI, wallet);
  const normalizedProjectId = String(projectId || 'marketplace-contract');
  const normalizedTitles = milestoneTitles.length ? milestoneTitles : ['Project Delivery'];
  const normalizedAmounts = milestoneAmounts.length ? milestoneAmounts : [Number(totalAmount || 0)];

  const tx = await contract.registerContract(normalizedProjectId, Number(totalAmount || 0), normalizedTitles, normalizedAmounts.map(Number));
  const receipt = await tx.wait();
  const txHash = tx.hash;
  const verification = await verifyBlockchainTransaction(txHash, contractAddress);
  const onChainContractId = findContractCreatedId(contract, receipt);

  return {
   status: verification.status,
   verified: verification.status === 'CONFIRMED',
   txHash,
   network,
   contractId: onChainContractId,
   contractAddress,
   receipt,
   pending: verification.status === 'PENDING',
   confirmedAt: verification.status === 'CONFIRMED' ? new Date().toISOString() : null,
   verification,
   onChainCreated: true,
   message: verification.message,
  };
}

export async function registerMilestoneOnChain({ contractId, title, amount, contractAddressOverride }) {
  const { rpcUrl, privateKey, contractAddress, network } = getBlockchainConfig();
  if (!rpcUrl || !privateKey || !contractAddress) {
   return {
     status: 'PENDING',
     verified: false,
     txHash: null,
     network,
     contractAddress: contractAddressOverride || contractAddress || null,
     message: 'Blockchain not configured. Milestone registration skipped.',
     onChainCreated: false,
   };
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  const contract = new Contract(contractAddressOverride || contractAddress, ABI, wallet);
  const tx = await contract.registerMilestone(Number(contractId), String(title || 'Milestone'), Number(amount || 0));
  const receipt = await tx.wait();
  const verification = await verifyBlockchainTransaction(tx.hash, contractAddressOverride || contractAddress);

  return {
   status: verification.status,
   verified: verification.status === 'CONFIRMED',
   txHash: tx.hash,
   network,
   contractAddress: contractAddressOverride || contractAddress,
   receipt,
   confirmedAt: verification.status === 'CONFIRMED' ? new Date().toISOString() : null,
   verification,
   onChainCreated: true,
   message: verification.message,
  };
}

export async function releaseMilestoneOnChain({ contractId, milestoneIndex, contractAddressOverride, amount } = {}) {
  const { rpcUrl, privateKey, contractAddress, network } = getBlockchainConfig();
  if (!rpcUrl || !privateKey || !contractAddress) {
   return {
     status: 'PENDING',
     verified: false,
     txHash: null,
     network,
     contractAddress: contractAddressOverride || contractAddress || null,
     message: 'Blockchain not configured. Milestone release skipped.',
     onChainCreated: false,
   };
  }

  const targetAddress = contractAddressOverride || contractAddress;
  const numericContractId = Number(contractId);
  const numericMilestoneIndex = Number(milestoneIndex);

  if (!Number.isFinite(numericContractId) || numericContractId <= 0) {
   throw new Error(`Invalid blockchain contract id: ${contractId}`);
  }
  if (!Number.isFinite(numericMilestoneIndex) || numericMilestoneIndex < 0) {
   throw new Error(`Invalid blockchain milestone index: ${milestoneIndex}`);
  }

  if (amount !== undefined) {
   // The deployed contract ABI for releaseMilestone takes only contractId and milestoneIndex.
   // There is no ETH value transfer here, so we validate the app-side amount for safety without
   // passing a value into parseEther/parseUnits, which would be incorrect for this ABI.
   const validatedAmount = validateBlockchainAmount(amount, 'milestone release');
   console.log('[blockchain] Amount from database:', amount);
   console.log('[blockchain] Parsed numeric amount:', validatedAmount);
   console.log('[blockchain] Contract address:', targetAddress);
   console.log('[blockchain] Network: Sepolia');
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  const contract = new Contract(targetAddress, ABI, wallet);
  const tx = await contract.releaseMilestone(numericContractId, numericMilestoneIndex);
  const receipt = await tx.wait();
  const verification = await verifyBlockchainTransaction(tx.hash, targetAddress);

  console.log('[blockchain] Transaction hash:', tx.hash);
  console.log('[blockchain] Transaction confirmed:', verification.status);

  return {
   status: verification.status,
   verified: verification.status === 'CONFIRMED',
   txHash: tx.hash,
   network,
   contractAddress: targetAddress,
   receipt,
   confirmedAt: verification.status === 'CONFIRMED' ? new Date().toISOString() : null,
   verification,
   onChainCreated: true,
   message: verification.message,
  };
}

export async function getOnChainContract(contractId, contractAddressOverride) {
  const { rpcUrl, privateKey, contractAddress, network } = getBlockchainConfig();
  if (!rpcUrl || !privateKey || !contractAddress) {
   return null;
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  const contract = new Contract(contractAddressOverride || contractAddress, ABI, wallet);
  const details = await contract.getContract(Number(contractId));
  return {
   network,
   contractAddress: contractAddressOverride || contractAddress,
   projectId: details[0],
   totalAmount: Number(details[1]),
   milestoneCount: Number(details[2]),
  };
}

export async function deployMarketplaceContract() {
  const { rpcUrl, privateKey, network } = getBlockchainConfig();
  if (!rpcUrl || !privateKey) {
   throw new Error('Missing Sepolia blockchain configuration.');
  }

  const contractPath = path.resolve(__dirname, '../contracts/Marketplace.sol');
  const source = fs.readFileSync(contractPath, 'utf8');
  const solcModule = await import('solc');
  const solc = solcModule.default || solcModule;
  const input = {
   language: 'Solidity',
   sources: {
     'Marketplace.sol': {
       content: source,
     },
   },
   settings: {
     outputSelection: {
       '*': {
         '*': ['abi', 'evm.bytecode.object'],
       },
     },
   },
  };

  const compiled = JSON.parse(solc.compile(JSON.stringify(input)));
  const contractOutput = compiled.contracts['Marketplace.sol'].MarketplaceContractRegistry;
  if (!contractOutput) {
   throw new Error('Marketplace contract compilation failed.');
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  const factory = new ContractFactory(contractOutput.abi, contractOutput.evm.bytecode.object, wallet);
  const deployed = await factory.deploy();
  const receipt = await deployed.waitForDeployment();
  const address = await deployed.getAddress();
  const txHash = deployed.deploymentTransaction()?.hash ?? null;

  writeEnvValue(getDotEnvPath(), 'BLOCKCHAIN_CONTRACT_ADDRESS', address);
  writeEnvValue(getDotEnvPath(), 'BLOCKCHAIN_NETWORK', network);
  writeEnvValue(getDotEnvPath(), 'BLOCKCHAIN_CHAIN_ID', '11155111');

  return {
   ok: true,
   network,
   contractAddress: address,
   txHash,
   receipt,
   verification: txHash ? await verifyBlockchainTransaction(txHash, address) : { status: 'NOT_FOUND' },
  };
}

export function getBlockchainStatusLabel(blockchainState) {
  if (!blockchainState || !blockchainState.txHash) {
   return 'PENDING';
  }
  if (blockchainState.verified) {
   return 'VERIFIED';
  }
  if (blockchainState.failed) {
   return 'FAILED';
  }
  return 'PENDING';
}
