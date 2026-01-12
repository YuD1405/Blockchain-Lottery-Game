# Blockchain Lottery Game

An open-source dApp that combines:

- A Lottery game that uses Chainlink VRF v2.5 (RandomNumberConsumerV2Plus)
- An NFT contract as rewards
- A simple NFT Marketplace
- A static frontend (HTML/JS) under the `frontend/` folder

This repo supports two user types:

1) **Player**: just open the frontend and play (contract addresses are already fixed in the frontend config).
2) **Admin**: deploy contracts + verify + configure Chainlink VRF subscription.

---

## Player (no deploy needed)

The frontend already contains contract addresses (see `frontend/scripts/contract-addresses.js`).

### Requirements

- Browser wallet (MetaMask)
- Select the correct network in MetaMask (e.g. Sepolia) that matches the deployed addresses

### Run the frontend

```bash
cd frontend
npm install
npm run start
```

Open:

- http://localhost:8080

If you prefer, you can also open the HTML files directly, but using `npm run start` avoids common CORS/module-loading issues.

---

## Admin (deploy + verify + VRF setup)

You will:

1) Create the required external accounts/keys (RPC + Etherscan + VRF subscription)
2) Set secrets in `.env`
3) Deploy contracts (`task deploy` or `task full-deploy`)
4) Add your deployed consumer contract to your Chainlink VRF subscription (`task add-consumer`)

### Prerequisites

- Node.js (recommended: Node 22+)
- A funded wallet on Sepolia (Sepolia ETH)
- A Chainlink VRF Subscription on Sepolia funded with **native ETH** (recommended)
- (Optional) Etherscan API key for contract verification
- Install Task (recommended): https://taskfile.dev

### Install Task (required to use `task ...` commands)

Linux/macOS (recommended):

```bash
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b ~/.local/bin
```

Or via package manager:

```bash
# macOS
brew install go-task

# Ubuntu/Debian
sudo snap install task --classic

# Arch
pacman -S go-task
```

Verify installation:

```bash
task --version
task --list
```

No Task installed? You can still run everything with plain Hardhat commands below.

### Step 0 — Install dependencies

```bash
npm install
```

### Step 1 — Create accounts / get keys (where + what)

#### 1.1 RPC URL (required)

Create an account at one of these providers and create a **Sepolia** endpoint:

- Alchemy (recommended)
- Infura
- QuickNode

You will copy a URL like:

`https://eth-sepolia.g.alchemy.com/v2/<YOUR_KEY>`

#### 1.2 Wallet private key (required)

Use MetaMask:

1. Create an account (or use a dedicated deployer account)
2. Export private key
3. Fund it with **Sepolia ETH** (from faucets)

Important: never commit or share this key.

#### 1.3 Etherscan API key (recommended for verify)

Create an Etherscan account and generate an API key:

- https://etherscan.io/myapikey

#### 1.4 Chainlink VRF subscription (required)

1. Go to the VRF dashboard: https://vrf.chain.link/sepolia
2. Create a subscription
3. Save the **Subscription ID**
4. Fund the subscription with **native ETH** (recommended) so it can pay for VRF fulfillments

Your repo uses Sepolia defaults:

- VRF Coordinator: `0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B`
- Key Hash (gas lane): `0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae`

### Step 2 — Create `.env` and add secrets

Copy the example:

```bash
cp .env.example .env
```

Edit `.env` and set:

```bash
SEPOLIA_RPC_URL=...            # from Step 1.1
PRIVATE_KEY=...                # from Step 1.2
ETHERSCAN_API_KEY=...          # from Step 1.3

# REQUIRED for deployment + verification tasks
VRF_SUBSCRIPTION_ID=...        # from Step 1.4

# Optional overrides (defaults are already set in scripts/Taskfile)
# VRF_COORDINATOR=0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B
# VRF_KEY_HASH=0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae
```

Notes:

- `.env.contracts` is auto-generated after deployment. Do not edit it manually.
- The Taskfile automatically loads `.env` and `.env.contracts`.

### Step 3 — Deploy contracts (pick one approach)

#### Option A (recommended): full deploy (clean + compile + deploy + verify)

```bash
task full-deploy
```

Without Task:

```bash
npx hardhat clean
npx hardhat compile
npx hardhat run scripts/deploy.ts --network sepolia

# then verify (see Step 4)
```

#### Option B: deploy only

```bash
task deploy
```

Without Task:

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

After deployment, the script writes deployed addresses to `.env.contracts` and also updates the frontend address file automatically.

To print addresses:

```bash
task show-addresses
```

Without Task:

```bash
cat .env.contracts

# or just show the contract addresses
grep "_ADDRESS=" .env.contracts
```

### Step 4 — Verify contracts (if you didn’t run full-deploy)

```bash
task verify
```

Without Task (loads addresses from `.env.contracts`):

```bash
set -a
source .env
source .env.contracts
set +a

# Verify RandomNumberConsumerV2Plus
npx hardhat verify --network sepolia \
	"$RANDOM_NUMBER_CONSUMER_ADDRESS" \
	"$VRF_SUBSCRIPTION_ID" \
	"${VRF_COORDINATOR:-$DEPLOYED_VRF_COORDINATOR}" \
	"${VRF_KEY_HASH:-$DEPLOYED_VRF_KEY_HASH}" \
	"${LOTTERY_CONTRACT_ADDRESS:-0x0000000000000000000000000000000000000000}"

# Verify NFT
npx hardhat verify --network sepolia \
	"$NFT_CONTRACT_ADDRESS" \
	"ipfs://bafybeieh3fcl366p55b2fjmii7xdzlv3rly5yn3ofyo57vfsobm57znetm/"

# Verify Lottery
npx hardhat verify --network sepolia \
	"$LOTTERY_CONTRACT_ADDRESS" \
	"$RANDOM_NUMBER_CONSUMER_ADDRESS" \
	"$NFT_CONTRACT_ADDRESS"

# Verify Marketplace
npx hardhat verify --network sepolia \
	"$MARKETPLACE_CONTRACT_ADDRESS" \
	"$NFT_CONTRACT_ADDRESS"
```

Verification uses:

- `ETHERSCAN_API_KEY` from `.env`
- deployed addresses from `.env.contracts`

### Step 5 — Add consumer to Chainlink VRF (must be after deploy)

This must happen **after Step 3**, because you need the deployed consumer address.

```bash
task add-consumer
```

Without Task:

```bash
npx hardhat run scripts/add-consumer.ts --network sepolia
```

What it does:

- Reads your deployed consumer address from `.env.contracts` (`RANDOM_NUMBER_CONSUMER_ADDRESS`)
- Calls `addConsumer(subId, consumer)` on the VRF Coordinator

Important:

- The signer must be the **owner** of the VRF subscription, or the script will refuse to add.
- If you used the wrong wallet, either switch `PRIVATE_KEY` to the subscription owner or add the consumer manually in the VRF dashboard.

## Useful docs in this repo

- `Taskfile.yaml`: all supported commands
- `docs/TASKFILE_GUIDE.md`: Task usage
- `docs/SEPOLIA_DEPLOYMENT_GUIDE.md`: Sepolia deployment walkthrough
- `docs/CHAINLINK_VRF_GUIDE.md`: VRF concepts
- `docs/TESTING_VRF.md`: VRF testing + production workflow
