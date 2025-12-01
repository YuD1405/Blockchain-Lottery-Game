// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HelloWorld {
    string private message_a;

    constructor(string memory _message) {
        message_a = _message;
    }

    function getMessage() public view returns (string memory) {
        return message_a;
    }

    function setMessage(string memory _newMessage) public {
        message_a = _newMessage;
    }
}
