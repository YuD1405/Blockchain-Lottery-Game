// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract RandomGenerator {
    // Hàm sinh số ngẫu nhiên
    function generateRandomIndex(uint _ticketCount) external view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty, _ticketCount))) % _ticketCount;
    }
}