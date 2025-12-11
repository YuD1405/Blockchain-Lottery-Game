// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    
    // Thêm biến lưu địa chỉ contract Lottery để cấp quyền
    address public lotteryContract;

    // Lưu thông tin về người thắng và round
    mapping(uint256 => uint256) public tokenToRound;
    mapping(uint256 => uint256) public tokenToTimestamp;

    event NFTMinted(address indexed winner, uint256 tokenId, uint256 round, string tokenURI);

    constructor() ERC721("LotteryWinner", "LWIN") Ownable(msg.sender) {}

    // --- QUẢN LÝ QUYỀN ---
    // Hàm này cho phép Owner set địa chỉ của Lottery Contract sau khi deploy
    function setLotteryContract(address _lottery) external onlyOwner {
        lotteryContract = _lottery;
    }

    // Modifier chỉ cho phép Owner hoặc Lottery Contract gọi hàm
    modifier onlyLotteryOrOwner() {
        require(msg.sender == lotteryContract || msg.sender == owner(), "Not authorized: Caller is not Lottery or Owner");
        _;
    }

    // --- LOGIC MINT ---
    
    // Hàm mint chính được Lottery gọi. 
    // Nhận thêm _tokenURI để gán ảnh ngay lập tức.
    function mint(address winner, string memory _tokenURI) external onlyLotteryOrOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(winner, tokenId);
        
        // Set luôn metadata (link Pinata) cho token này
        _setTokenURI(tokenId, _tokenURI);
        
        // Lưu timestamp
        tokenToTimestamp[tokenId] = block.timestamp;
        
        emit NFTMinted(winner, tokenId, 0, _tokenURI);
        return tokenId;
    }

    // Nếu bạn muốn lưu cả số Round vào NFT (Option nâng cao)
    function mintWithRound(address winner, uint256 round, string memory _tokenURI) external onlyLotteryOrOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(winner, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        // Lưu metadata custom
        tokenToRound[tokenId] = round;
        tokenToTimestamp[tokenId] = block.timestamp;
        
        emit NFTMinted(winner, tokenId, round, _tokenURI);
        return tokenId;
    }

    // --- CÁC HÀM HỖ TRỢ KHÁC (Giữ nguyên) ---

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    function getTokenInfo(uint256 tokenId) external view returns (
        address owner,
        uint256 round,
        uint256 timestamp,
        string memory uri
    ) {
        owner = ownerOf(tokenId);
        round = tokenToRound[tokenId];
        timestamp = tokenToTimestamp[tokenId];
        uri = tokenURI(tokenId);
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}