// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Import các hợp đồng con
import "./NFT.sol";

interface IRandomNumberConsumerV2Plus {
    function requestRandomWordsFromLottery() external returns (uint256);
}

contract Lottery {
    // Init addresses
    address private manager;
    mapping(uint => mapping(uint => address)) private playersByRound;
    mapping(uint => address) private winnerByRound;
    mapping(uint => address[]) private playerListInRound;
    mapping(address => uint) private winnerToTokenId;
    
    // Init game Variables
    uint private round = 0;
    uint private ticketPrice = 0.001 ether;
    uint private ticketCount = 0;
    uint private maxTicket = 10;
    uint private deadlines = block.timestamp + 1 days;
    bool private gameActive;

    // Call sub-Contracts
    NFT public lotteryNFT;
    IRandomNumberConsumerV2Plus public randomConsumer;

    // Track VRF requests per round
    mapping(uint256 => uint256) private roundTicketCount;
    mapping(uint256 => uint256) private roundPrize;
    mapping(uint256 => uint256) private requestIdToRound;
    uint256 private pendingRequestId;
    bool private awaitingRandomness;

    // Check manager
    modifier onlyManager() {
        require(msg.sender == manager, "Not manager");
        _;
    }

    // Init Event
    event PlayerJoined(address player);
    event WinnerPicked(address winner, uint prize, uint winnerNFTId);
    event GameReseted();
    event RandomnessRequested(uint256 requestId, uint round, uint ticketCount);

    // Constructor
    constructor(address _randomConsumer, address _lotteryNFT) {
        manager = msg.sender;
        randomConsumer = IRandomNumberConsumerV2Plus(_randomConsumer);
        lotteryNFT = NFT(_lotteryNFT);
        gameActive = true;
    }

    // Players joins the game
    function joinLottery() external payable {
        // Check conditions
        require(gameActive == true, "Game ended");
        require(block.timestamp <= deadlines, "Deadline passed");
        require(ticketCount < maxTicket, "Max ticket reached");
        require(msg.value == ticketPrice, "Incorrect ticket price");

        // Add players
        playersByRound[round][ticketCount] = msg.sender;
        playerListInRound[round].push(msg.sender);
        ticketCount++;

        emit PlayerJoined(msg.sender);
    }

    // Manager pick the winner among players
    function pickWinner() external onlyManager {
        // Check conditions
        require(gameActive, "Game already ended");
        require(!awaitingRandomness, "Waiting for VRF");
        require(block.timestamp > deadlines || ticketCount == maxTicket, "Do not meet conditions to end yet");
        require(ticketCount > 0, "No tickets sold");

        // Stop further joins while waiting for VRF callback
        gameActive = false;
        awaitingRandomness = true;
        roundTicketCount[round] = ticketCount;
        roundPrize[round] = address(this).balance;

        // Request randomness from the external consumer contract and track the request
        uint256 requestId = randomConsumer.requestRandomWordsFromLottery();
        pendingRequestId = requestId;
        requestIdToRound[requestId] = round;

        emit RandomnessRequested(requestId, round, ticketCount);
    }

    function internalSafeTransfer(address payable _to, uint _amount) internal {
        require(address(this).balance >= _amount, "Insufficient balance");

        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Transfer failed");
    }

    // Manager reset game 
    function resetGames() external onlyManager {
        // Check conditions
        require(!gameActive, "Game still active");
        require(!awaitingRandomness, "Awaiting VRF result");
        require(winnerByRound[round] != address(0), "Winner not picked yet");

        // Rest all variables
        ticketCount = 0;
        deadlines = block.timestamp + 1 days;
        gameActive = true;
        round++;
        pendingRequestId = 0;

        // event
        emit GameReseted();
    }

    // Callback from RandomNumberConsumerV2Plus
    function onRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
        require(msg.sender == address(randomConsumer), "Unauthorized callback");
        require(awaitingRandomness, "No pending VRF request");

        require(requestId == pendingRequestId, "Request ID mismatch");

        uint256 resolvedRound = requestIdToRound[requestId];
        uint256 playerCount = roundTicketCount[resolvedRound];
        require(playerCount > 0, "No players in round");

        uint256 randomIndex = randomWords[0] % playerCount;
        address winner = playersByRound[resolvedRound][randomIndex];
        winnerByRound[resolvedRound] = winner;

        uint prize = roundPrize[resolvedRound];
        if (prize > 0) {
            internalSafeTransfer(payable(winner), prize);
        }

        // Optionally distribute rewards / mint NFT here
        // uint prize = address(this).balance;
        // internalSafeTransfer(payable(winner), prize);
        // uint winnerNFTId = lotteryNFT.mint(winner);
        // winnerToTokenId[winner] = winnerNFTId;

        awaitingRandomness = false;
        pendingRequestId = 0;
        delete requestIdToRound[requestId];

        emit WinnerPicked(winner, prize, 0);
    }

    // Public getter functions for frontend
    function getTicketPrice() external view returns (uint) {
        return ticketPrice;
    }

    function getTicketCount() external view returns (uint) {
        return ticketCount;
    }

    function getMaxTicket() external view returns (uint) {
        return maxTicket;
    }

    function getDeadlines() external view returns (uint) {
        return deadlines;
    }

    function isGameActive() external view returns (bool) {
        return gameActive;
    }

    function getPlayersByRound(uint _round) external view returns (address[] memory) {
        return playerListInRound[_round];
    }

    function getManager() external view returns (address) {
        return manager;
    }

    function getWinnerByRound(uint _round) external view returns (address){
        return winnerByRound[_round];
    }

    function winnerTokenIds(address _winner) public view returns (uint){
        return winnerToTokenId[_winner];
    }

    function getTotalPool() external view returns (uint) {
        return address(this).balance;
    }

    function getCurrentRound() external view returns (uint) {
        return round;
    }

    // Helpers for frontend status
    function getPendingRequestId() external view returns (uint256) {
        return pendingRequestId;
    }

    function isAwaitingRandomness() external view returns (bool) {
        return awaitingRandomness;
    }
}