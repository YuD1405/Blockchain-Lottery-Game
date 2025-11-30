// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LotteryNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Lưu thông tin về người thắng và round
    mapping(uint256 => uint256) public tokenToRound;
    mapping(uint256 => uint256) public tokenToTimestamp;

    event NFTMinted(address indexed winner, uint256 tokenId, uint256 round);

    constructor() ERC721("LotteryWinner", "LWIN") Ownable(msg.sender) {}

    // Mint NFT cho người thắng (chỉ owner/lottery contract gọi được)
    function mint(address winner) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(winner, tokenId);
        
        // Lưu metadata
        tokenToTimestamp[tokenId] = block.timestamp;
        
        emit NFTMinted(winner, tokenId, 0);
        return tokenId;
    }

    // Mint NFT với round number
    function mintWithRound(address winner, uint256 round) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(winner, tokenId);
        
        // Lưu metadata
        tokenToRound[tokenId] = round;
        tokenToTimestamp[tokenId] = block.timestamp;
        
        emit NFTMinted(winner, tokenId, round);
        return tokenId;
    }

    // Set token URI (metadata link)
    function setTokenURI(uint256 tokenId, string memory uri) external onlyOwner {
        _setTokenURI(tokenId, uri);
    }

    // Lấy tổng số NFT đã mint
    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    // Lấy thông tin NFT
    function getTokenInfo(uint256 tokenId) external view returns (
        address owner,
        uint256 round,
        uint256 timestamp
    ) {
        owner = ownerOf(tokenId);
        round = tokenToRound[tokenId];
        timestamp = tokenToTimestamp[tokenId];
    }

    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
