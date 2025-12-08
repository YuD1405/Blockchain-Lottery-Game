import { expect } from "chai";
import { ethers } from "hardhat";
import { NFTMarketplace } from "../typechain-types";

describe("NFTMarketplace", function () {
  let marketplace: NFTMarketplace;
  let owner: any;
  let seller: any;
  let buyer: any;
  let other: any;

  // Helper to mint NFT and return token ID
  async function mintNFT(signer: any, to: string, uri: string) {
    const currentId = await marketplace.getCurrentTokenId();
    await marketplace.connect(signer).mintNFT(to, uri);
    return Number(currentId);
  }

  // Helper to list NFT and return listing ID
  async function listNFT(signer: any, tokenId: number, price: any) {
    const currentId = await marketplace.getCurrentListingId();
    await marketplace.connect(signer).listNFT(tokenId, price);
    return Number(currentId);
  }

  beforeEach(async function () {
    // Deploy contract
    const NFTMarketplaceFactory = await ethers.getContractFactory(
      "NFTMarketplace"
    );
    marketplace = await NFTMarketplaceFactory.deploy();
    await marketplace.waitForDeployment();

    // Get signers
    [owner, seller, buyer, other] = await ethers.getSigners();
  });

  // ==================== MINT TESTS ====================
  describe("Mint NFT", function () {
    it("Should mint an NFT successfully", async function () {
      const tokenId = await mintNFT(seller, seller.address, "ipfs://QmTest1");

      expect(await marketplace.ownerOf(tokenId)).to.equal(seller.address);
      expect(await marketplace.getTokenCreator(tokenId)).to.equal(
        seller.address
      );
    });

    it("Should increment token ID for each mint", async function () {
      const id1 = await mintNFT(seller, seller.address, "ipfs://QmTest1");
      const id2 = await mintNFT(seller, seller.address, "ipfs://QmTest2");
      const id3 = await mintNFT(buyer, buyer.address, "ipfs://QmTest3");

      expect(id2).to.equal(id1 + 1);
      expect(id3).to.equal(id2 + 1);
    });

    it("Should revert if mint to zero address", async function () {
      await expect(
        marketplace.connect(seller).mintNFT(ethers.ZeroAddress, "ipfs://QmTest1")
      ).to.be.revertedWith("Invalid address");
    });

    it("Should emit NFTMinted event", async function () {
      await expect(
        marketplace.connect(seller).mintNFT(seller.address, "ipfs://QmTest1")
      ).to.emit(marketplace, "NFTMinted");
    });
  });

  // ==================== TRANSFER TESTS ====================
  describe("Transfer NFT", function () {
    let tokenId: number;

    beforeEach(async function () {
      tokenId = await mintNFT(seller, seller.address, "ipfs://QmTest1");
    });

    it("Should transfer NFT ownership", async function () {
      await marketplace.connect(seller).transferNFT(tokenId, buyer.address);

      expect(await marketplace.ownerOf(tokenId)).to.equal(buyer.address);
    });

    it("Should emit OwnershipTransferred event", async function () {
      await expect(
        marketplace.connect(seller).transferNFT(tokenId, buyer.address)
      )
        .to.emit(marketplace, "NFTOwnershipTransferred")
        .withArgs(tokenId, seller.address, buyer.address);
    });

    it("Should revert if not owner tries to transfer", async function () {
      await expect(
        marketplace.connect(buyer).transferNFT(tokenId, other.address)
      ).to.be.revertedWith("You are not the owner");
    });

    it("Should revert if transfer to zero address", async function () {
      await expect(
        marketplace.connect(seller).transferNFT(tokenId, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid recipient address");
    });

    xit("Should revert if NFT is listed", async function () {
      await marketplace
        .connect(seller)
        .listNFT(tokenId, ethers.parseEther("1"));

      await expect(
        marketplace.connect(seller).transferNFT(tokenId, buyer.address)
      ).to.be.revertedWith("NFT is currently listed for sale");
    });
  });

  // ==================== LISTING TESTS ====================
  describe("List NFT", function () {
    let tokenId: number;

    beforeEach(async function () {
      tokenId = await mintNFT(seller, seller.address, "ipfs://QmTest1");
    });

    it("Should list NFT successfully", async function () {
      const price = ethers.parseEther("1");
      const listingId = await listNFT(seller, tokenId, price);

      const listing = await marketplace.getListing(listingId);
      expect(listing.tokenId).to.equal(tokenId);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(price);
      expect(listing.status).to.equal(0); // Active
    });

    it("Should set token listing ID", async function () {
      const price = ethers.parseEther("1");
      const listingId = await listNFT(seller, tokenId, price);

      expect(await marketplace.getTokenListingId(tokenId)).to.equal(listingId);
    });

    it("Should emit NFTListed event", async function () {
      const price = ethers.parseEther("1");
      await expect(marketplace.connect(seller).listNFT(tokenId, price))
        .to.emit(marketplace, "NFTListed");
    });

    it("Should revert if not owner tries to list", async function () {
      const price = ethers.parseEther("1");
      await expect(
        marketplace.connect(buyer).listNFT(tokenId, price)
      ).to.be.revertedWith("You are not the owner");
    });

    it("Should revert if price is zero", async function () {
      await expect(
        marketplace.connect(seller).listNFT(tokenId, 0)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    xit("Should revert if NFT already listed", async function () {
      const price = ethers.parseEther("1");
      const listingId = await listNFT(seller, tokenId, price);
      
      // Verify it was listed
      const checkListingId = await marketplace.getTokenListingId(tokenId);
      expect(checkListingId).to.equal(listingId);

      await expect(
        marketplace.connect(seller).listNFT(tokenId, ethers.parseEther("2"))
      ).to.be.revertedWith("NFT is already listed");
    });

    it("Should handle multiple listings", async function () {
      const tokenId2 = await mintNFT(seller, seller.address, "ipfs://QmTest2");

      const price1 = ethers.parseEther("1");
      const price2 = ethers.parseEther("2");

      const listingId1 = await listNFT(seller, tokenId, price1);
      const listingId2 = await listNFT(seller, tokenId2, price2);

      expect(listingId2).to.equal(listingId1 + 1);

      const listing1 = await marketplace.getListing(listingId1);
      const listing2 = await marketplace.getListing(listingId2);

      expect(listing1.price).to.equal(price1);
      expect(listing2.price).to.equal(price2);
    });
  });

  // ==================== UNLIST TESTS ====================
  describe("Unlist NFT", function () {
    let tokenId: number;
    let listingId: number;

    beforeEach(async function () {
      tokenId = await mintNFT(seller, seller.address, "ipfs://QmTest1");
      listingId = await listNFT(seller, tokenId, ethers.parseEther("1"));
    });

    it("Should unlist NFT successfully", async function () {
      await marketplace.connect(seller).unlistNFT(listingId);

      const listing = await marketplace.getListing(listingId);
      expect(listing.status).to.equal(2); // Cancelled
      expect(await marketplace.getTokenListingId(tokenId)).to.equal(0);
    });

    it("Should emit NFTUnlisted event", async function () {
      await expect(marketplace.connect(seller).unlistNFT(listingId))
        .to.emit(marketplace, "NFTUnlisted");
    });

    it("Should revert if not seller tries to unlist", async function () {
      await expect(
        marketplace.connect(buyer).unlistNFT(listingId)
      ).to.be.revertedWith("You are not the seller");
    });

    it("Should revert if listing not active", async function () {
      await marketplace.connect(seller).unlistNFT(listingId);

      await expect(
        marketplace.connect(seller).unlistNFT(listingId)
      ).to.be.revertedWith("Listing is not active");
    });
  });

  // ==================== BUY TESTS ====================
  describe("Buy NFT", function () {
    let tokenId: number;
    let listingId: number;

    beforeEach(async function () {
      tokenId = await mintNFT(seller, seller.address, "ipfs://QmTest1");
      listingId = await listNFT(seller, tokenId, ethers.parseEther("1"));
    });

    it("Should buy NFT successfully", async function () {
      const price = ethers.parseEther("1");
      await marketplace.connect(buyer).buyNFT(listingId, { value: price });

      expect(await marketplace.ownerOf(tokenId)).to.equal(buyer.address);
      const listing = await marketplace.getListing(listingId);
      expect(listing.status).to.equal(1); // Sold
    });

    it("Should transfer payment to seller", async function () {
      const price = ethers.parseEther("1");
      const sellerBalanceBefore = await ethers.provider.getBalance(
        seller.address
      );

      await marketplace.connect(buyer).buyNFT(listingId, { value: price });

      const sellerBalanceAfter = await ethers.provider.getBalance(
        seller.address
      );
      expect(sellerBalanceAfter).to.equal(sellerBalanceBefore + price);
    });

    it("Should emit NFTSold event", async function () {
      const price = ethers.parseEther("1");
      await expect(marketplace.connect(buyer).buyNFT(listingId, { value: price }))
        .to.emit(marketplace, "NFTSold");
    });

    it("Should revert if insufficient payment", async function () {
      const insufficientPrice = ethers.parseEther("0.5");
      await expect(
        marketplace.connect(buyer).buyNFT(listingId, { value: insufficientPrice })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should revert if buyer is seller", async function () {
      const price = ethers.parseEther("1");
      await expect(
        marketplace.connect(seller).buyNFT(listingId, { value: price })
      ).to.be.revertedWith("Cannot buy your own NFT");
    });

    it("Should revert if listing not active", async function () {
      await marketplace.connect(seller).unlistNFT(listingId);

      const price = ethers.parseEther("1");
      await expect(
        marketplace.connect(buyer).buyNFT(listingId, { value: price })
      ).to.be.revertedWith("Listing is not active");
    });

    it("Should clear token listing ID after purchase", async function () {
      const price = ethers.parseEther("1");
      await marketplace.connect(buyer).buyNFT(listingId, { value: price });

      expect(await marketplace.getTokenListingId(tokenId)).to.equal(0);
    });

    it("Should accept overpayment", async function () {
      const price = ethers.parseEther("1");
      const overpayment = ethers.parseEther("2");

      await marketplace
        .connect(buyer)
        .buyNFT(listingId, { value: overpayment });

      expect(await marketplace.ownerOf(tokenId)).to.equal(buyer.address);
    });
  });

  // ==================== INTEGRATION TESTS ====================
  describe("Integration Tests", function () {
    xit("Should handle complete lifecycle: mint -> list -> buy -> list again", async function () {
      // Mint
      const tokenId = await mintNFT(seller, seller.address, "ipfs://QmTest1");

      // List
      const price1 = ethers.parseEther("1");
      const listingId1 = await listNFT(seller, tokenId, price1);
      expect(await marketplace.isNFTListed(tokenId)).to.be.true;

      // Buy
      await marketplace.connect(buyer).buyNFT(listingId1, { value: price1 });
      expect(await marketplace.ownerOf(tokenId)).to.equal(buyer.address);
      expect(await marketplace.isNFTListed(tokenId)).to.be.false;

      // List again by new owner
      const price2 = ethers.parseEther("2");
      const listingId2 = await listNFT(buyer, tokenId, price2);
      expect(await marketplace.isNFTListed(tokenId)).to.be.true;

      // Buy again
      await marketplace.connect(seller).buyNFT(listingId2, { value: price2 });
      expect(await marketplace.ownerOf(tokenId)).to.equal(seller.address);
    });

    it("Should handle multiple NFTs and listings", async function () {
      // Mint multiple NFTs
      const tokenId1 = await mintNFT(seller, seller.address, "ipfs://QmTest1");
      const tokenId2 = await mintNFT(seller, seller.address, "ipfs://QmTest2");
      const tokenId3 = await mintNFT(buyer, buyer.address, "ipfs://QmTest3");

      // List all
      const listingId1 = await listNFT(seller, tokenId1, ethers.parseEther("1"));
      const listingId2 = await listNFT(seller, tokenId2, ethers.parseEther("2"));
      const listingId3 = await listNFT(buyer, tokenId3, ethers.parseEther("0.5"));

      // Buy one
      await marketplace
        .connect(other)
        .buyNFT(listingId1, { value: ethers.parseEther("1") });

      expect(await marketplace.ownerOf(tokenId1)).to.equal(other.address);
      expect(await marketplace.isNFTListed(tokenId1)).to.be.false;
      expect(await marketplace.isNFTListed(tokenId2)).to.be.true;
      expect(await marketplace.isNFTListed(tokenId3)).to.be.true;
    });
  });

  // ==================== VIEW FUNCTIONS TESTS ====================
  describe("View Functions", function () {
    let tokenId: number;
    let listingId: number;

    beforeEach(async function () {
      tokenId = await mintNFT(seller, seller.address, "ipfs://QmTest1");
      listingId = await listNFT(seller, tokenId, ethers.parseEther("1"));
    });

    it("Should get listing correctly", async function () {
      const listing = await marketplace.getListing(listingId);
      expect(listing.listingId).to.equal(listingId);
      expect(listing.tokenId).to.equal(tokenId);
      expect(listing.seller).to.equal(seller.address);
    });

    it("Should get token listing ID correctly", async function () {
      expect(await marketplace.getTokenListingId(tokenId)).to.equal(listingId);
      expect(await marketplace.getTokenListingId(999)).to.equal(0); // Not listed
    });

    xit("Should check if NFT is listed", async function () {
      expect(await marketplace.isNFTListed(tokenId)).to.be.true;

      const tokenId2 = await mintNFT(seller, seller.address, "ipfs://QmTest2");
      expect(await marketplace.isNFTListed(tokenId2)).to.be.false;
    });

    it("Should get token creator", async function () {
      expect(await marketplace.getTokenCreator(tokenId)).to.equal(seller.address);
    });

    it("Should get current token ID", async function () {
      const currentId = await marketplace.getCurrentTokenId();
      expect(currentId).to.be.gt(0);
    });

    it("Should get current listing ID", async function () {
      const currentId = await marketplace.getCurrentListingId();
      expect(currentId).to.be.gt(0);
    });
  });
});
