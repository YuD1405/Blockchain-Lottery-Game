// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTMarketplace
 * @dev Smart contract cho phép mint NFT, listing, mua bán và chuyển quyền sở hữu
 */
contract NFTMarketplace is ERC721, Ownable {
    // Counters
    uint256 private tokenIdCounter = 0;
    uint256 private listingIdCounter = 0;

    // Listing Status
    enum ListingStatus {
        Active,
        Sold,
        Cancelled
    }

    // Struct cho Listing
    struct Listing {
        uint256 listingId;
        uint256 tokenId;
        address seller;
        uint256 price;
        ListingStatus status;
        uint256 createdAt;
    }

    // Mappings
    mapping(uint256 => Listing) public listings; // listingId => Listing
    mapping(uint256 => uint256) public tokenListingId; // tokenId => listingId (0 nếu chưa được listing)
    mapping(uint256 => address) public tokenCreators; // tokenId => creator address

    // Events
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string uri
    );
    
    event NFTOwnershipTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );
    
    event NFTListed(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );
    
    event NFTUnlisted(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed seller
    );
    
    event NFTSold(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address seller,
        address indexed buyer,
        uint256 price
    );

    // Constructor
    constructor() ERC721("NFTMarketplace", "NFTM") Ownable(msg.sender) {}

    /**
     * @dev Mint một NFT mới
     * @param to Địa chỉ sẽ nhận NFT
     * @param uri URI của metadata NFT
     */
    function mintNFT(address to, string memory uri) public returns (uint256) {
        require(to != address(0), "Invalid address");
        
        uint256 tokenId = tokenIdCounter;
        tokenIdCounter++;

        _safeMint(to, tokenId);
        tokenCreators[tokenId] = msg.sender;

        emit NFTMinted(tokenId, msg.sender, uri);
        return tokenId;
    }

    /**
     * @dev Chuyển quyền sở hữu NFT
     * @param tokenId ID của token
     * @param to Địa chỉ người nhận
     */
    function transferNFT(uint256 tokenId, address to) public {
        require(to != address(0), "Invalid recipient address");
        require(ownerOf(tokenId) == msg.sender, "You are not the owner");
        require(tokenListingId[tokenId] == 0, "NFT is currently listed for sale");

        address from = ownerOf(tokenId);
        transferFrom(from, to, tokenId);
        emit NFTOwnershipTransferred(tokenId, from, to);
    }

    /**
     * @dev Listing NFT để bán
     * @param tokenId ID của token
     * @param price Giá bán (trong wei)
     */
    function listNFT(uint256 tokenId, uint256 price) public returns (uint256) {
        require(ownerOf(tokenId) == msg.sender, "You are not the owner");
        require(price > 0, "Price must be greater than 0");
        require(tokenListingId[tokenId] == 0, "NFT is already listed");

        uint256 listingId = listingIdCounter;
        listingIdCounter++;

        listings[listingId] = Listing({
            listingId: listingId,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            status: ListingStatus.Active,
            createdAt: block.timestamp
        });

        tokenListingId[tokenId] = listingId;

        emit NFTListed(listingId, tokenId, msg.sender, price);
        return listingId;
    }

    /**
     * @dev Hủy listing
     * @param listingId ID của listing
     */
    function unlistNFT(uint256 listingId) public {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "You are not the seller");
        require(
            listing.status == ListingStatus.Active,
            "Listing is not active"
        );

        listing.status = ListingStatus.Cancelled;
        uint256 tokenId = listing.tokenId;
        tokenListingId[tokenId] = 0;

        emit NFTUnlisted(listingId, tokenId, msg.sender);
    }

    /**
     * @dev Mua NFT
     * @param listingId ID của listing
     */
    function buyNFT(uint256 listingId) public payable {
        Listing storage listing = listings[listingId];
        
        require(
            listing.status == ListingStatus.Active,
            "Listing is not active"
        );
        require(msg.value >= listing.price, "Insufficient payment");
        require(listing.seller != msg.sender, "Cannot buy your own NFT");

        address seller = listing.seller;
        uint256 tokenId = listing.tokenId;
        uint256 price = listing.price;

        // Cập nhật trạng thái listing
        listing.status = ListingStatus.Sold;
        tokenListingId[tokenId] = 0;

        // Transfer NFT
        _transfer(seller, msg.sender, tokenId);

        // Transfer tiền cho seller
        (bool success, ) = payable(seller).call{value: msg.value}("");
        require(success, "Payment transfer failed");

        emit NFTSold(listingId, tokenId, seller, msg.sender, price);
    }

    /**
     * @dev Lấy thông tin listing
     * @param listingId ID của listing
     */
    function getListing(uint256 listingId)
        public
        view
        returns (Listing memory)
    {
        return listings[listingId];
    }

    /**
     * @dev Lấy listing ID của một token
     * @param tokenId ID của token
     */
    function getTokenListingId(uint256 tokenId)
        public
        view
        returns (uint256)
    {
        return tokenListingId[tokenId];
    }

    /**
     * @dev Kiểm tra xem NFT có đang được listing không
     * @param tokenId ID của token
     */
    function isNFTListed(uint256 tokenId) public view returns (bool) {
        return tokenListingId[tokenId] != 0;
    }

    /**
     * @dev Lấy token ID hiện tại (số lượng NFT đã được mint)
     */
    function getCurrentTokenId() public view returns (uint256) {
        return tokenIdCounter;
    }

    /**
     * @dev Lấy listing ID hiện tại
     */
    function getCurrentListingId() public view returns (uint256) {
        return listingIdCounter;
    }

    /**
     * @dev Lấy creator của một token
     * @param tokenId ID của token
     */
    function getTokenCreator(uint256 tokenId)
        public
        view
        returns (address)
    {
        return tokenCreators[tokenId];
    }

    // Override required functions
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
