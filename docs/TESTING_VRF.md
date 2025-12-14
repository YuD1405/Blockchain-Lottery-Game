# Testing and Using Chainlink VRF V2.5 Plus

This guide explains how to test the Chainlink VRF V2.5 contract locally and use it on Sepolia testnet.

## Current Configuration

Your VRF consumer is configured with:
- **Request Confirmations**: 3 blocks (required minimum for Sepolia)
- **Callback Gas Limit**: 200,000 gas
- **Number of Random Words**: 1 (only need one to pick a winner)
- **Payment Method**: Native ETH (not LINK)

## Local Testing

### Test Files

We have two test approaches:

#### 1. `RandomNumberConsumerV2Plus.test.ts` - **Custom Mock (Recommended)**
- Uses our custom `MockVRFCoordinatorV2Plus` contract
- Simpler setup, easier to understand
- Full control over mock behavior
- **11 tests** covering deployment, requests, fulfillment, and edge cases

#### 2. `anotherTest.ts` - **Chainlink GitHub Style**
- Adapted from Chainlink's official test examples
- Uses the same testing patterns as Chainlink's repository
- **3 tests** focusing on the request-fulfill cycle
- Demonstrates event-based testing with promises

### Running Tests

```bash
# Run the custom mock tests (recommended)
npx hardhat test test/RandomNumberConsumerV2Plus.test.ts

# Run the Chainlink-style tests
npx hardhat test test/anotherTest.ts

# Run all VRF tests
npx hardhat test test/*RandomNumber*

# Or use Taskfile
task test:vrf
```

### Test Coverage

**RandomNumberConsumerV2Plus.test.ts includes:**
- ✅ Deployment with correct parameters
- ✅ Owner initialization
- ✅ Request random words (owner only)
- ✅ Non-owner request rejection
- ✅ Event emission from VRF Coordinator
- ✅ Receiving and storing random word
- ✅ Event emission on fulfillment
- ✅ Multiple requests handling
- ✅ Edge cases (invalid requests, etc.)
- ✅ Full request-fulfill cycle

## Production Usage on Sepolia

### Prerequisites

1. **Sepolia ETH** - Get from [Alchemy faucet](https://sepoliafaucet.com/)
2. **VRF Subscription** - Created at [vrf.chain.link/sepolia](https://vrf.chain.link/sepolia)
3. **Environment Setup** - `.env` and `.env.contracts` configured

### Complete Workflow

#### Step 1: Deploy Contracts

```bash
task deploy
```

This will:
- Deploy `RandomNumberConsumerV2Plus` with REQUEST_CONFIRMATIONS=3
- Deploy `NFT` contract
- Deploy `Lottery` contract
- Deploy `NFTMarketplace` contract
- Automatically wire consumer to lottery
- Save addresses to `.env.contracts`

#### Step 2: Add Consumer to VRF Subscription

```bash
task add-consumer
```

This adds your deployed consumer contract to your VRF subscription. You only need to do this once per deployment.

#### Step 3: Run Lottery Rounds

```bash
task request-vrf
```

This automated script will:
1. Check if game is inactive and auto-reset if needed
2. Join the lottery with 1 ticket
3. Call `pickWinner()` to request VRF
4. Wait for Chainlink VRF callback (1-3 minutes)
5. Display the random number
6. Show the winner address

**Example Output:**
```
Using signer: 0x0E1f82cEcaDd17fD3e1bf43DC311C5C13C2cdB85
Ticket price: 0.001 ETH
Status: active=true awaitingVRF=false tickets=0/1

Game is not active. Resetting lottery...
✓ Lottery reset! Tx: 0x123...
New round: 1, active: true

Joining lottery...
Joined lottery. Tx: 0x456...
Calling pickWinner on lottery: 0xeA3...
Submitted pickWinner request. Tx: 0x789...
Request ID: 104356566383668719141500221182022544781776921661022103161363643690712778221780

Waiting for VRF fulfillment (can take 1-3 minutes on Sepolia)...

✓ Fulfilled!
Fulfill Tx: 0xabc...

=== Random Number ===
Random Word: 78965412345678901234567890123456789012345678901234567890123456789

=== Different Formats ===
Hex format:
  Word: 0xabc123def456...

As number 0-99:
  Word mod 100: 42

🎉 Winner of Round 0: 0x0E1f82cEcaDd17fD3e1bf43DC311C5C13C2cdB85
```

### Available Commands

```bash
# Deployment
task deploy              # Deploy all contracts
task verify              # Verify contracts on Etherscan

# VRF Setup (one-time)
task add-consumer        # Add consumer to VRF subscription

# Running Lottery (repeat as needed)
task request-vrf         # Complete lottery round with random number

# Testing
task test                # Run all tests
task test:vrf            # Run VRF tests only
```

## How VRF V2.5 Plus Works

### Request Flow

1. **User calls `pickWinner()`** on Lottery contract
2. **Lottery requests randomness** from Consumer contract
3. **Consumer requests VRF** from Chainlink Coordinator
4. **Chainlink waits** for 3 block confirmations (~36 seconds on Sepolia)
5. **Chainlink generates** verifiable random number
6. **Chainlink calls back** to Consumer's `fulfillRandomWords()`
7. **Consumer stores** random word and calls Lottery's `onRandomWords()`
8. **Lottery picks winner** using: `randomWords[0] % playerCount`

### Payment

- **Method**: Native ETH (configured with `nativePayment: true`)
- **Cost**: ~0.0004 ETH per request on Sepolia (varies with gas prices)
- **Subscription Balance**: Maintain 0.5+ ETH for ~1000+ requests
- **Fund at**: [vrf.chain.link/sepolia/YOUR_SUBSCRIPTION_ID](https://vrf.chain.link/sepolia)

### Key Configuration Constants

In `contracts/RandomNumberConsumerV2Plus.sol`:

```solidity
uint32 constant CALLBACK_GAS_LIMIT = 200000;      // Gas for callback
uint16 constant REQUEST_CONFIRMATIONS = 3;        // Block confirmations (minimum on Sepolia)
uint32 constant NUM_WORDS = 1;                    // Number of random values (1 for winner selection)
```

## Differences: Local vs Production

| Feature | Local Testing | Sepolia Production |
|---------|---------------|-------------------|
| **Fulfillment** | Instant (mock) | 1-3 minutes (real VRF) |
| **Cost** | Free | ~0.0004 ETH per request |
| **Random Numbers** | Controlled/predictable | True randomness |
| **Subscription** | Not needed | Required |
| **Confirmations** | None | 3 blocks minimum |
| **VRF Coordinator** | Mock contract | Real Chainlink service |

## Troubleshooting

### Common Issues

**1. "InvalidRequestConfirmations" Error**
- Solution: Already fixed! Your contract uses `REQUEST_CONFIRMATIONS = 3`

**2. "InvalidConsumer" Error**
- Solution: Run `task add-consumer` to add your consumer to the VRF subscription

**3. "Game already ended" Error**
- Solution: Already handled! `task request-vrf` auto-resets the game

**4. VRF Request Times Out**
- The request is still processing, just taking longer than expected
- Check status at: [vrf.chain.link/sepolia/YOUR_SUBSCRIPTION_ID](https://vrf.chain.link/sepolia)
- Or check transaction on [Sepolia Etherscan](https://sepolia.etherscan.io)

**5. Insufficient Balance**
- Fund your subscription with more ETH at the VRF dashboard
- Minimum recommended: 0.5 ETH

## Resources

- [Chainlink VRF V2.5 Documentation](https://docs.chain.link/vrf/v2-5/getting-started)
- [VRF Sepolia Dashboard](https://vrf.chain.link/sepolia)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Hardhat Testing Guide](https://hardhat.org/tutorial/testing-contracts)
- [Chainlink GitHub](https://github.com/smartcontractkit/chainlink)

## Scripts Overview

Your project has 3 essential scripts:

1. **`scripts/deploy.ts`** - Deploys all contracts and wires consumer to lottery
2. **`scripts/add-consumer.ts`** - Adds consumer to VRF subscription (one-time setup)
3. **`scripts/request-vrf.ts`** - Complete lottery automation (use repeatedly)

All scripts are designed to work together seamlessly for a smooth development experience! 🎲
