// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is Ownable {
    IERC721 public immutable nft;

    uint256 private listingIdCounter;

    enum ListingStatus {
        Active,
        Sold,
        Cancelled
    }

    struct Listing {
        uint256 listingId;
        uint256 tokenId;
        address seller;
        uint256 price;
        ListingStatus status;
        uint256 createdAt;
    }

    // listingId => Listing
    mapping(uint256 => Listing) public listings;

    // tokenId => listingId (0 = not listed)
    mapping(uint256 => uint256) public tokenListingId;

    /* ======================= EVENTS ======================= */

    event NFTListed(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );

    event NFTUnlisted(
        uint256 indexed listingId,
        uint256 indexed tokenId
    );

    event NFTSold(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price
    );

    /* ======================= CONSTRUCTOR ======================= */

    constructor(address _nftContract) Ownable(msg.sender) {
        require(_nftContract != address(0), "Invalid NFT address");
        nft = IERC721(_nftContract);
    }

    /* ======================= LIST NFT ======================= */

    function listNFT(
        uint256 tokenId,
        uint256 price
    ) external returns (uint256) {
        require(price > 0, "Price must be > 0");
        require(nft.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(tokenListingId[tokenId] == 0, "NFT already listed");

        // Marketplace phải được approve
        require(
            nft.getApproved(tokenId) == address(this) ||
            nft.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        uint256 listingId = ++listingIdCounter;

        listings[listingId] = Listing({
            listingId: listingId,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            status: ListingStatus.Active,
            createdAt: block.timestamp
        });

        tokenListingId[tokenId] = listingId;

        emit NFTListed(
            listingId,
            tokenId,
            msg.sender,
            price
        );

        return listingId;
    }

    /* ======================= UNLIST ======================= */

    function unlistNFT(uint256 listingId) external {
        Listing storage listing = listings[listingId];

        require(listing.status == ListingStatus.Active, "Not active");
        require(listing.seller == msg.sender, "Not seller");

        listing.status = ListingStatus.Cancelled;
        tokenListingId[listing.tokenId] = 0;

        emit NFTUnlisted(listingId, listing.tokenId);
    }

    /* ======================= BUY ======================= */

    function buyNFT(uint256 listingId) external payable {
        Listing storage listing = listings[listingId];

        require(listing.status == ListingStatus.Active, "Not active");
        require(msg.value >= listing.price, "Insufficient ETH");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");

        listing.status = ListingStatus.Sold;
        tokenListingId[listing.tokenId] = 0;

        // chuyển NFT
        nft.transferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        // trả ETH cho seller
        (bool success, ) = payable(listing.seller).call{
            value: listing.price
        }("");
        require(success, "ETH transfer failed");

        emit NFTSold(
            listingId,
            listing.tokenId,
            listing.seller,
            msg.sender,
            listing.price
        );
    }

    /* ======================= VIEW ======================= */

    function isNFTListed(uint256 tokenId) external view returns (bool) {
        return tokenListingId[tokenId] != 0;
    }

    function getListing(
        uint256 listingId
    ) external view returns (Listing memory) {
        return listings[listingId];
    }
}
