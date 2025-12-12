# RandomNumberConsumerV2Plus contract logic

This contract consumes Chainlink VRF v2.5 randomness using a pre-funded subscription. It extends `VRFConsumerBaseV2Plus`, which provides the coordinator interface and owner access control (for `onlyOwner`).

## Roles and dependencies
- **VRF coordinator**: external contract that receives requests and returns randomness.
- **Owner**: only the owner (from `VRFConsumerBaseV2Plus`/`ConfirmedOwner`) can initiate a request.
- **VRFV2PlusClient**: helper library to build the `RandomWordsRequest` payload.

## Key constants and state
- `s_subscriptionId` (immutable): subscription that pays for VRF requests.
- `s_keyHash` (immutable): gas lane / keyHash that defines max gas price for the request.
- `CALLBACK_GAS_LIMIT` (100,000): max gas available to `fulfillRandomWords`.
- `REQUEST_CONFIRMATIONS` (3): blocks the coordinator waits before responding.
- `NUM_WORDS` (2): how many random 256-bit words to request.
- `s_requestId`: last request id returned by the coordinator.
- `s_randomWords`: last array of random words returned.
- `ReturnedRandomness` event: emitted when randomness is delivered.

## Lifecycle
1) **Deployment**: constructor sets the subscription id, coordinator address, and keyHash, and wires the base consumer to that coordinator.
2) **Request**: `requestRandomWords()` (only owner) sends a `RandomWordsRequest` to the coordinator. It specifies keyHash, subscription id, confirmations, callback gas, number of words, and `nativePayment: false` (pays with LINK, not native gas token). The coordinator returns and stores `s_requestId`.
3) **Callback**: the coordinator calls `fulfillRandomWords(requestId, randomWords)`. The contract stores the returned array in `s_randomWords` and emits `ReturnedRandomness`.

## Usage notes
- Ensure the subscription is funded and has this consumer contract added, otherwise `requestRandomWords` reverts.
- Tune `CALLBACK_GAS_LIMIT`, `REQUEST_CONFIRMATIONS`, and `NUM_WORDS` per network and use case; higher limits cost more.
- `s_randomWords` only stores the latest response; add custom logic if you need historical storage or per-request handling.
- `nativePayment: false` means LINK is used for billing; set to `true` if you want to pay with the network gas token where supported.
- Access control is owner-gated; transfer ownership if another address should be able to request randomness.
