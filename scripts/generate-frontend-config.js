#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read .env.contracts from project root
const envContractsPath = path.join(__dirname, '..', '.env.contracts');
const outputPath = path.join(__dirname, '..', 'frontend', 'scripts', 'contract-addresses.js');

if (!fs.existsSync(envContractsPath)) {
  console.error('❌ .env.contracts not found. Please deploy contracts first.');
  process.exit(1);
}

// Parse .env.contracts
const envContent = fs.readFileSync(envContractsPath, 'utf8');
const addresses = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^(\w+)=(.+)$/);
  if (match) {
    addresses[match[1]] = match[2];
  }
});

// Generate JavaScript module
const jsContent = `// Auto-generated from .env.contracts
// Do not edit manually - run: npm run update-addresses or task update-addresses

export const CONTRACT_ADDRESSES = {
  RANDOM_GENERATOR: "${addresses.RANDOM_NUMBER_CONSUMER_ADDRESS || ''}",
  NFT: "${addresses.NFT_CONTRACT_ADDRESS || ''}",
  LOTTERY: "${addresses.LOTTERY_CONTRACT_ADDRESS || ''}",
  MARKETPLACE: "${addresses.MARKETPLACE_CONTRACT_ADDRESS || ''}",
};

console.log("📋 Contract addresses loaded from .env.contracts");
`;

fs.writeFileSync(outputPath, jsContent, 'utf8');
console.log('✅ Generated frontend/scripts/contract-addresses.js from .env.contracts');
console.log('📋 Contract addresses:');
console.log(`   Random Generator: ${addresses.RANDOM_NUMBER_CONSUMER_ADDRESS}`);
console.log(`   NFT: ${addresses.NFT_CONTRACT_ADDRESS}`);
console.log(`   Lottery: ${addresses.LOTTERY_CONTRACT_ADDRESS}`);
console.log(`   Marketplace: ${addresses.MARKETPLACE_CONTRACT_ADDRESS}`);
