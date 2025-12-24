// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

/**
 * @title MockVRFCoordinatorV2Plus
 * @notice A mock VRF Coordinator for local testing
 */
contract MockVRFCoordinatorV2Plus {
    uint256 private requestIdCounter = 1;
    
    mapping(uint256 => address) public requestIdToConsumer;
    
    event RandomWordsRequested(
        bytes32 indexed keyHash,
        uint256 requestId,
        uint256 subId,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address indexed sender
    );
    
    function requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest calldata req
    ) external returns (uint256) {
        uint256 requestId = requestIdCounter++;
        requestIdToConsumer[requestId] = msg.sender;
        
        emit RandomWordsRequested(
            req.keyHash,
            requestId,
            req.subId,
            req.requestConfirmations,
            req.callbackGasLimit,
            req.numWords,
            msg.sender
        );
        
        return requestId;
    }
    
    /**
     * @notice Fulfill random words request (for testing)
     * @param requestId The request ID
     * @param randomWords Array of random numbers to return
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        address consumer = requestIdToConsumer[requestId];
        require(consumer != address(0), "Request not found");
        
        // Call the consumer's fulfillRandomWords function
        (bool success, ) = consumer.call(
            abi.encodeWithSignature(
                "rawFulfillRandomWords(uint256,uint256[])",
                requestId,
                randomWords
            )
        );
        require(success, "Callback failed");
    }
}
