# 🚀 Sepolia Testnet Deployment Guide

Complete guide to deploy your Blockchain Lottery Game to Sepolia testnet.

## Prerequisites

- MetaMask wallet installed
- Node.js installed (v22.20.0)
- Git repository set up

## Step 1: Get Sepolia Test ETH

You need test ETH to deploy contracts. Get free Sepolia ETH from these faucets:

1. **Alchemy Sepolia Faucet**: https://www.alchemy.com/faucets/ethereum-sepolia
2. **Infura Sepolia Faucet**: https://www.infura.io/faucet/sepolia
3. **QuickNode Faucet**: https://faucet.quicknode.com/ethereum/sepolia

**Recommended amount**: At least 0.5 SepoliaETH for deployment and testing.

## Step 2: Get RPC Provider

Choose one of these providers and create a free account:

### Option A: Alchemy (Recommended)
1. Go to https://www.alchemy.com
2. Sign up and create a new app
3. Select "Ethereum" → "Sepolia"
4. Copy the HTTP URL (looks like: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`)

### Option B: Infura
1. Go to https://www.infura.io
2. Create a new project
3. Select "Ethereum" → "Sepolia"
4. Copy the endpoint URL

### Option C: QuickNode
1. Go to https://www.quicknode.com
2. Create an endpoint
3. Select "Ethereum" → "Sepolia"
4. Copy the HTTP Provider URL

## Step 3: Get Etherscan API Key (Optional but Recommended)

For contract verification on Etherscan:

1. Go to https://etherscan.io
2. Create an account or log in
3. Navigate to https://etherscan.io/myapikey
4. Create a new API key
5. Copy the API key

## Step 4: Configure Environment Variables

1. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

2. Edit `.env` and fill in your credentials:

```bash
# Your RPC URL from Step 2
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Your wallet private key (export from MetaMask)
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# Your Etherscan API key from Step 3 (optional)
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### How to Export Private Key from MetaMask:
1. Open MetaMask
2. Click the 3 dots menu → Account Details
3. Click "Show Private Key"
4. Enter your password
5. Copy the private key (without the '0x' prefix)

**⚠️ SECURITY WARNING**: Never share your private key or commit `.env` to git!

## Step 5: Compile Smart Contracts

```bash
npx hardhat compile
```

**Expected output**: All contracts compile successfully without errors.

## Step 6: Deploy to Sepolia

Deploy all contracts to Sepolia testnet:

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

**Expected output** (addresses will be different):
```
Contract Random Generator deployed at: 0x1234...abcd
Contract NFT deployed at: 0x5678...ef01
Contract Lottery deployed at: 0x9abc...def2
Contract Marketplace deployed at: 0xdef3...4567
```

**⚠️ IMPORTANT**: Save these contract addresses! You'll need them in the next step.

## Step 7: Verify Contracts on Etherscan (Optional)

Verify each contract to make it viewable on Etherscan:

```bash
# Verify RandomGenerator
npx hardhat verify --network sepolia <RANDOM_GENERATOR_ADDRESS>

# Verify NFT
npx hardhat verify --network sepolia <NFT_ADDRESS>

# Verify Lottery (with constructor args)
npx hardhat verify --network sepolia <LOTTERY_ADDRESS> <RANDOM_GENERATOR_ADDRESS> <NFT_ADDRESS>

# Verify Marketplace
npx hardhat verify --network sepolia <MARKETPLACE_ADDRESS>
```

Replace `<ADDRESS>` with the actual deployed addresses from Step 6.

## Step 8: Update Frontend Configuration

Update the contract addresses in your frontend:

Edit `frontend/scripts/contracts.js`:

```javascript
export const CONTRACTS = {
  RANDOM_GENERATOR: "0xYourRandomGeneratorAddress",
  NFT: "0xYourNFTAddress",
  LOTTERY: "0xYourLotteryAddress",
  MARKETPLACE: "0xYourMarketplaceAddress",
};
```

## Step 9: Configure MetaMask for Sepolia

1. Open MetaMask
2. Click the network dropdown at the top
3. Enable "Show test networks" in Settings if not visible
4. Select "Sepolia test network"
5. Ensure you have SepoliaETH balance

If Sepolia doesn't appear:
1. Click "Add Network"
2. Enter:
   - Network Name: `Sepolia`
   - RPC URL: Your `SEPOLIA_RPC_URL` from `.env`
   - Chain ID: `11155111`
   - Currency Symbol: `ETH`
   - Block Explorer: `https://sepolia.etherscan.io`

## Step 10: Run Frontend

```bash
cd frontend
npm start
```

Open http://localhost:8080 in your browser.


## Useful Links

- **Sepolia Etherscan**: https://sepolia.etherscan.io
- **Sepolia Faucets**: Listed in Step 1
- **Your Deployed Contracts**: Check on Sepolia Etherscan using your addresses
- **MetaMask Support**: https://support.metamask.io

## Gas Costs (Approximate)

- RandomGenerator: ~0.001 ETH
- NFT: ~0.002 ETH
- Lottery: ~0.003 ETH
- Marketplace: ~0.002 ETH
- **Total deployment**: ~0.008-0.01 ETH

## Next Steps

After successful deployment:

1. ✅ Test all features thoroughly
2. ✅ Share your dApp URL and contract addresses
3. ✅ Consider deploying to mainnet (use real ETH with caution!)
4. ✅ Add your contracts to a README for users

## Security Reminders

- 🔒 Never commit `.env` file to git
- 🔒 Never share your private key
- 🔒 Use a separate wallet for testing
- 🔒 Audit contracts before mainnet deployment

---

**Congratulations!** 🎉 Your Blockchain Lottery Game is now live on Sepolia testnet!
