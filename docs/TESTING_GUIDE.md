# 🧪 Testing Guide - Blockchain Lottery & NFT Marketplace

## Hướng Dẫn Test Toàn Bộ Ứng Dụng

### Phase 1: Smart Contract Compilation & Testing

#### 1.1 Compile Smart Contracts
```bash
# Từ folder root (c:\Users\p14s\CODE\Blockchain-Lottery-Game)
npx hardhat compile
```
**Kỳ vọng:** Biên dịch thành công tất cả contracts mà không lỗi

#### 1.2 Chạy Test Suite
```bash
npx hardhat test
```

**Kết quả Mong Đợi:**
- 32 tests PASSING ✅
- 4 tests PENDING (skipped) ⏭️
- Pass rate: 88.9%

**Test Coverage:**
- Marketplace Mint Tests: 8/8 ✅
- Marketplace Transfer Tests: 4/4 ✅
- Marketplace Listing Tests: 8/8 ✅
- Marketplace Buy Tests: 6/6 ✅
- Integration Tests: 6/6 ✅

### Phase 2: Smart Contract Deployment

#### 2.1 Khởi Động Local Network
```bash
# Terminal 1 - Chạy Hardhat node
npx hardhat node
```

**Kỳ vọng:** 
- Network khởi động tại http://127.0.0.1:8545
- 20 test accounts được tạo
- Gas limit: 30,000,000

#### 2.2 Deploy Contracts
```bash
# Terminal 2 - Deploy
npx hardhat run scripts/deploy.ts --network localhost
```

**Kết Quả Mong Đợi:**
```
✅ RandomGenerator deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ NFT deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
✅ Lottery deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
✅ Marketplace deployed to: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
```

### Phase 3: Frontend Connection

#### 3.1 Cấu Hình MetaMask
1. Mở MetaMask
2. Thêm Network:
   - Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`
3. Import Account từ Hardhat:
   - Private Key: Lấy từ hardhat node output
   - Account: account[0] (deploy account)

#### 3.2 Chạy Frontend Server
```bash
# Terminal 3 - Frontend
cd frontend
npm start
# Server chạy tại http://localhost:8080
```

#### 3.3 Test Kết Nối Wallet
1. Mở http://localhost:8080
2. Click "🔗 Connect Wallet"
3. Xác nhận kết nối MetaMask

**Kỳ vọng:**
- Wallet address hiển thị
- ETH balance hiển thị đúng
- 2 section (Lottery & Marketplace) xuất hiện

### Phase 4: Lottery Feature Testing

#### Test Case 4.1: Join Lottery
**Steps:**
1. Click "Join Lottery"
2. Xác nhận transaction
3. Check message status

**Kỳ vọng:**
- ✅ Transaction successful
- ✅ Balance giảm theo ticket price
- ✅ "Players: 1/3" hiển thị

#### Test Case 4.2: Multiple Players
**Steps:**
1. Switch account (account[1])
2. Connect Wallet
3. Click "Join Lottery" (lặp cho account[2])

**Kỳ vọng:**
- ✅ "Players: 2/3" sau khi account[1] join
- ✅ "Players: 3/3" sau khi account[2] join

#### Test Case 4.3: Pick Winner
**Steps:**
1. Chuyển về account[0] (manager)
2. Click "Pick Winner"
3. Xác nhận transaction

**Kỳ vọng:**
- ✅ Transaction successful
- ✅ Status: "Winner picked!"
- ✅ Player account nhận NFT reward

#### Test Case 4.4: Reset Game
**Steps:**
1. Vẫn là account[0]
2. Click "Reset Game"
3. Xác nhận transaction

**Kỳ vọng:**
- ✅ Transaction successful
- ✅ "Players: 0/3" hiển thị
- ✅ Game sẵn sàng cho vòng mới

### Phase 5: Marketplace Feature Testing

#### Test Case 5.1: Mint NFT
**Steps:**
1. Click "Mint NFT"
2. Nhập URI: `ipfs://QmXxxx123456789` (hoặc URL bất kỳ)
3. Xác nhận transaction

**Kỳ vọng:**
- ✅ Transaction successful
- ✅ Status: "✅ NFT minted successfully!"
- ✅ Token ID auto-increments

#### Test Case 5.2: List NFT for Sale
**Steps:**
1. Click "List NFT for Sale"
2. Nhập Token ID: `1`
3. Nhập Price: `1.5` (ETH)
4. Xác nhận transaction

**Kỳ vọng:**
- ✅ Transaction successful
- ✅ Status: "✅ NFT listed successfully!"
- ✅ Listing ID được tạo

#### Test Case 5.3: View Listing Details
**Steps:**
1. Click "View Listing"
2. Nhập Listing ID: `0`

**Kỳ vọng:**
- ✅ Hiển thị chi tiết listing:
  - Token ID
  - Seller address
  - Price (1.5 ETH)
  - Status (Active)
  - Created timestamp

#### Test Case 5.4: Buy NFT
**Steps:**
1. Switch account (account[1])
2. Connect Wallet
3. Click "Buy NFT"
4. Nhập Listing ID: `0`
5. Xác nhận transaction (sẽ tự động gửi tiền đúng giá)

**Kỳ vọng:**
- ✅ Transaction successful
- ✅ Status: "✅ NFT purchased successfully!"
- ✅ Ownership transfer to buyer
- ✅ Seller nhận ETH

#### Test Case 5.5: Multi-NFT Trading
**Steps:**
1. Account[0] mint 3 NFTs
2. Account[0] list 2 NFTs
3. Account[1] buy NFT #1
4. Account[2] buy NFT #2

**Kỳ vọng:**
- ✅ Tất cả transactions successful
- ✅ 2 NFTs đã sold (status)
- ✅ 1 NFT vẫn listed
- ✅ Seller accounts nhận đúng số ETH

### Phase 6: Integration Testing

#### Test Case 6.1: Lottery + NFT Combination
**Steps:**
1. Account[0], [1], [2] join lottery
2. Account[0] pick winner
3. Winner (e.g., Account[1]) nhận NFT
4. Account[1] mint thêm NFTs
5. Account[1] list NFT
6. Account[2] buy NFT từ Account[1]

**Kỳ vọng:**
- ✅ Tất cả transactions thành công
- ✅ NFT flow từ lottery → listing → sale

#### Test Case 6.2: Error Handling
**Test Cases:**
- Mint NFT không kết nối wallet
- Join lottery với số tiền không đủ
- Buy NFT từ listing đã sold
- List NFT không sở hữu

**Kỳ vọng:**
- ✅ Hiển thị error messages rõ ràng
- ✅ Transaction không thực hiện
- ✅ User có thể thử lại

### Phase 7: Performance Testing

#### Metrics to Track:
1. **Block Time:** < 2 seconds
2. **Transaction Confirmation:** < 5 seconds
3. **UI Response:** < 100ms
4. **Gas Usage:**
   - Mint NFT: ~50,000 gas
   - List NFT: ~80,000 gas
   - Buy NFT: ~150,000 gas
   - Join Lottery: ~100,000 gas

### Phase 8: Security Testing

#### Test Case 8.1: Authorization
- Non-manager không thể pick winner ❌
- Non-owner không thể list NFT ❌
- Buyer không thể buy NFT không tồn tại ❌

#### Test Case 8.2: State Validation
- NFT không thể list khi đã sold
- Listing không thể buy 2 lần
- Game không reset khi đang có players

## 📊 Test Summary Template

```
=== TEST EXECUTION REPORT ===
Date: [Date]
Network: Hardhat Local
Tester: [Name]

Smart Contracts:
- Compilation: ✅ PASS
- Unit Tests: ✅ 32/32 PASS
- Coverage: 89% ✅

Deployment:
- RandomGenerator: ✅ Deployed
- NFT: ✅ Deployed
- Lottery: ✅ Deployed
- Marketplace: ✅ Deployed

Frontend:
- Wallet Connection: ✅ PASS
- Lottery Features: ✅ PASS
- Marketplace Features: ✅ PASS
- Integration: ✅ PASS

Issues Found:
- None ✅

Recommendations:
- Ready for production
```

## 🔧 Debugging Tips

### Common Issues & Solutions

1. **"Contract Not Initialized"**
   - Solution: Luôn click "Connect Wallet" trước
   
2. **"Wrong Network"**
   - Solution: Đảm bảo MetaMask kết nối đến Hardhat (31337)
   
3. **"Insufficient Funds"**
   - Solution: Chuyển lại account hoặc mint mới tokens
   
4. **Browser Console Errors**
   - Check browser F12 → Console tab cho detailed errors

---

**Good luck with testing! 🚀**
