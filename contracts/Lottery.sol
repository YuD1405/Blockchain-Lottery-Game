// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Import các hợp đồng con
import "./RandomGenerator.sol";
import "./NFT.sol";

contract Lottery {
    // Init addresses
    address private manager;
    mapping(uint => mapping(uint => address)) private playersByRound;
    mapping(uint => address) private winnerByRound;
    mapping(uint => address[]) private playerListInRound;
    mapping(uint => uint) public historyTokenId;

    // Init game Variables
    uint private round = 0;
    uint private ticketPrice = 0.001 ether;
    uint private ticketCount = 0;
    uint private maxTicket = 10;
    uint private deadlines = block.timestamp + 1 days;
    bool private gameActive;

    // Call sub-Contracts
    RandomGenerator randomGenerator;
    NFT public lotteryNFT;

    // Check manager
    modifier onlyManager() {
        require(msg.sender == manager, "Not manager");
        _;
    }

    // Init Event
    event PlayerJoined(address player);
    event WinnerPicked(address winner, uint prize, uint winnerNFTId);
    event GameReseted();

    // Constructor
    constructor(address _randomGenerator, address _lotteryNFT) {
        manager = msg.sender;
        randomGenerator = RandomGenerator(_randomGenerator);
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

    // 2. Cập nhật hàm pickWinner
    function pickWinner() external onlyManager {
        require(gameActive, "Game already ended");
        // require(block.timestamp > deadlines || ticketCount == maxTicket, "Do not meet conditions to end yet"); 
        // (Note: Tạm thời comment dòng check time để test cho dễ, khi deploy thật thì mở lại)
        require(ticketCount > 0, "No tickets sold");

        // Gen random Index
        uint randomIndex = randomGenerator.generateRandomIndex(ticketCount);

        // Get winner
        address winner = playersByRound[round][randomIndex];
        winnerByRound[round] = winner;

        // --- LOGIC NFT ---
        // Gọi hàm mint bên NFT contract. 
        uint winnerNFTId = lotteryNFT.mint(winner);        
        historyTokenId[round] = winnerNFTId;

        // Transfer balance
        uint prize = address(this).balance;
        internalSafeTransfer(payable(winner), prize);

        // Deactive game
        gameActive = false;
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

        // Rest all variables
        ticketCount = 0;
        deadlines = block.timestamp + 1 days;
        gameActive = true;
        round++;

        // event
        emit GameReseted();
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
    
    // function winnerTokenIds(address _winner) public view returns (uint){
    //     return winnerToTokenId[_winner];
    // }
    function getWinningTokenId(uint _round) external view returns (uint) {
        return historyTokenId[_round];
    }
    
    function getTotalPool() external view returns (uint) {
        return address(this).balance;
    }

    function getCurrentRound() external view returns (uint) {
        return round;
    }
}