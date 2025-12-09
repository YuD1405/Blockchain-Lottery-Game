# Testing RandomNumberConsumerV2Plus Locally

This guide explains how to test the Chainlink VRF V2.5 contract locally using Hardhat.

## Test Files

We have created two test files, each using different approaches:

### 1. `RandomNumberConsumerV2Plus.test.ts` - **Custom Mock (Simpler)**
- Uses our custom `MockVRFCoordinatorV2Plus` contract
- Simpler setup, easier to understand
- Full control over mock behavior
- **11 tests** covering deployment, requests, fulfillment, and edge cases

### 2. `anotherTest.ts` - **Style from Chainlink GitHub**
- Adapted from Chainlink's official test examples
- Uses the same testing patterns as Chainlink's repository
- **3 tests** focusing on the request-fulfill cycle
- Demonstrates event-based testing with promises

## Running the Tests

```bash
# Run the simpler custom mock tests
npx hardhat test test/RandomNumberConsumerV2Plus.test.ts

# Run the Chainlink-style tests
npx hardhat test test/anotherTest.ts

# Run all VRF tests
npx hardhat test test/*RandomNumber*

# Run with verbose output
npx hardhat test test/RandomNumberConsumerV2Plus.test.ts --verbose
```

## Comparison of Approaches

## Comparison of Approaches

| Feature | Custom Mock (RandomNumberConsumerV2Plus.test.ts) | Chainlink Style (anotherTest.ts) |
|---------|--------------------------------------------------|----------------------------------|
| **Complexity** | Simple & straightforward | More realistic to production |
| **Mock Contract** | Custom `MockVRFCoordinatorV2Plus` | Custom (adapted from Chainlink) |
| **Setup** | Minimal setup | Closer to Chainlink's patterns |
| **Test Count** | 11 comprehensive tests | 3 focused tests |
| **Best For** | Learning & quick testing | Mimicking Chainlink examples |

## Test Coverage

### RandomNumberConsumerV2Plus.test.ts

### 1. Deployment
- ✅ Correct deployment with parameters
- ✅ Correct deployment with parameters
- ✅ Owner initialization

### 2. Request Random Words
- ✅ Owner can request random words
- ✅ Non-owner cannot request (reverts)
- ✅ Event emission from VRF Coordinator

### 3. Fulfill Random Words
- ✅ Receiving and storing random words
- ✅ Event emission on fulfillment
- ✅ Multiple requests handling

### 4. Edge Cases
- ✅ Request without fulfillment
- ✅ Invalid request fulfillment

### 5. Integration Test
- ✅ Full request-fulfill cycle

### anotherTest.ts

1. **Request Test** - Verifies random number requests emit proper events
2. **Request & Result Test** - Tests complete request and fulfillment with validation
3. **Event Callback Test** - Uses promises to test event-driven fulfillment

## How It Works

### Local Testing Flow

1. **Deploy Mock Coordinator**: Creates a mock VRF Coordinator that simulates Chainlink's service
2. **Deploy Consumer Contract**: Deploys your `RandomNumberConsumerV2Plus` contract
3. **Request Random Words**: Contract owner calls `requestRandomWords()`
4. **Simulate Fulfillment**: Mock coordinator fulfills the request with test random numbers
5. **Verify Results**: Check that random words are stored correctly

### Mock VRF Coordinator

The mock coordinator provides:
- `requestRandomWords()` - Accepts VRF requests and returns request ID
- `fulfillRandomWords()` - Manually fulfills requests with test random numbers

### Key Test Functions

```typescript
// Request random words
await randomNumberConsumer.requestRandomWords();

// Get request ID
const requestId = await randomNumberConsumer.s_requestId();

// Fulfill with mock random numbers
const randomWords = [BigInt("123..."), BigInt("456...")];
await mockVRFCoordinator.fulfillRandomWords(requestId, randomWords);

// Verify stored values
const word1 = await randomNumberConsumer.s_randomWords(0);
const word2 = await randomNumberConsumer.s_randomWords(1);
```

## Differences from Production

### Local Testing (Mock)
- Instant fulfillment (no waiting)
- Manual control over random numbers
- No subscription or LINK tokens needed
- Free to run

### Production (Mainnet/Testnet)
- Actual random number generation from Chainlink oracles
- Requires VRF subscription and LINK/ETH payment
- 3+ block confirmations before fulfillment
- Network fees apply

## Extending the Tests

To add more tests, you can:

```typescript
it("Your custom test", async function () {
  // 1. Request random words
  await randomNumberConsumer.requestRandomWords();
  
  // 2. Get request ID
  const requestId = await randomNumberConsumer.s_requestId();
  
  // 3. Fulfill with custom values
  const myRandomWords = [BigInt("999"), BigInt("888")];
  await mockVRFCoordinator.fulfillRandomWords(requestId, myRandomWords);
  
  // 4. Assert your expectations
  expect(await randomNumberConsumer.s_randomWords(0)).to.equal(myRandomWords[0]);
});
```

## Deploying to Testnet

When ready to test on a real network (Sepolia, etc.):

1. Get testnet ETH from a faucet
2. Create a VRF subscription at [vrf.chain.link](https://vrf.chain.link)
3. Update deployment script with real VRF Coordinator address
4. Deploy and add consumer to subscription

## Resources

- [Chainlink VRF Documentation](https://docs.chain.link/vrf/v2-5/overview)
- [Hardhat Testing Guide](https://hardhat.org/tutorial/testing-contracts)
- [Chainlink VRF Contracts](https://github.com/smartcontractkit/chainlink)
