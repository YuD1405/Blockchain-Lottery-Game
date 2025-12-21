// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";  
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFT is ERC721Enumerable  {
    uint256 public nextTokenId;
    address public admin;
    using Strings for uint256;
    string public baseTokenURI;
    
    enum NFTType {
        Piece,
        Full
    }

    mapping(uint256 => NFTType) public nftTypes;
    mapping(uint256 => string) public tokenCity;

    constructor(string memory _baseTokenURI) ERC721("MyNFT", "MNFT") {
        admin = msg.sender;
        baseTokenURI = _baseTokenURI;
    }
    
    function mintPiece(address winner) external returns (uint256) {
        uint256 tokenId = nextTokenId;
        _safeMint(winner, tokenId);
        nftTypes[tokenId] = NFTType.Piece;
        nextTokenId++;
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        string memory base = baseTokenURI;
        if (bytes(base)[bytes(base).length - 1] != "/") {
            base = string(abi.encodePacked(base, "/"));
        }

        if (nftTypes[tokenId] == NFTType.Piece) {
            return string(
                abi.encodePacked(
                    base,
                    "piece_metadata/NFT_",
                    (tokenId + 1).toString(),
                    ".json"
                )
            );
        } else {
            return string(
                abi.encodePacked(
                    base,
                    "full_metadata/",
                    tokenCity[tokenId],
                    ".json"
                )
            );
        }
    }

    function mergeNFT(
        uint256[] calldata tokenIds,
        string calldata city
    ) external returns (uint256) {
        require(tokenIds.length >= 2, "Not enough NFT pieces");

        // 1. Check ownership + type
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];

            require(
                ownerOf(tokenId) == msg.sender,
                "You are not the owner"
            );

            require(
                nftTypes[tokenId] == NFTType.Piece,
                "Only Piece NFT allowed"
            );
        }

        // 2. Burn all pieces
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];

            _burn(tokenId);

            delete nftTypes[tokenId];
            delete tokenCity[tokenId];
        }

        // 3. Mint Full NFT
        uint256 newTokenId = nextTokenId;
        _safeMint(msg.sender, newTokenId);

        nftTypes[newTokenId] = NFTType.Full;
        tokenCity[newTokenId] = city;

        nextTokenId++;

        return newTokenId;
    }

}