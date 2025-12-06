# 🎰 Blockchain Lottery & NFT Marketplace Frontend

## Cấu trúc Dự án

```
frontend/
├── index.html          # Main HTML file
├── app.js              # Main application logic (ES6 Module)
├── contracts.js        # Contract addresses & ABIs
├── style.css           # Styling
├── package.json        # Frontend dependencies
└── README.md           # This file
```

## Cài đặt & Chạy

### 1. Cài đặt Dependencies
```bash
cd frontend
npm install
```

### 2. Chạy HTTP Server
```bash
npm start
# hoặc
npm run serve
```

Server sẽ khởi động tại: **http://localhost:8080**

## 🔌 Kết nối Ví

1. Mở **http://localhost:8080** trong trình duyệt
2. Cài đặt **MetaMask** nếu chưa có
3. Kết nối MetaMask đến **Hardhat Local Network**:
   - Network Name: `Hardhat`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
4. Click nút **"🔗 Connect Wallet"**

## 📋 Các Chính Năng

### 🎲 Lottery Game
- **Join Lottery** - Tham gia xổ số (trả phí vé)
- **Pick Winner** - Chọn người thắng (chỉ manager)
- **Reset Game** - Đặt lại game (chỉ manager)
- **Lottery Info** - Hiển thị thông tin game

### 🛒 NFT Marketplace
- **Mint NFT** - Tạo NFT mới
- **List NFT for Sale** - Đăng ký NFT để bán
- **Buy NFT** - Mua NFT từ listing
- **View Listing** - Xem chi tiết listing

## 📝 Contract Addresses

| Contract | Address |
|----------|---------|
| RandomGenerator | 0x5FbDB2315678afecb367f032d93F642f64180aa3 |
| NFT | 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 |
| Lottery | 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 |
| Marketplace | 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 |

## 🔧 Cấu Hình Hệ Thống

### app.js
- Kết nối MetaMask qua BrowserProvider
- Khởi tạo 4 contract instances
- Quản lý wallet state (address, signer, provider)

### contracts.js
- Xuất contract addresses
- Xuất ABIs cho tất cả contracts
- Cho phép app.js import dễ dàng

### style.css
- Responsive design
- Dark mode friendly
- Button states & animations
- Status message styling

## 🚀 Quy Trình Sử Dụng

### Tham gia Lottery
```
1. Connect Wallet
2. Click "Join Lottery"
3. Trả lệ phí vé (hiển thị tự động)
4. Xác nhận transaction
5. Xem cập nhật thông tin game
```

### Mua & Bán NFT
```
1. Connect Wallet
2. Click "Mint NFT" → nhập URI
3. Click "List NFT for Sale" → nhập Token ID & giá
4. Người khác click "Buy NFT" → nhập Listing ID
5. Xác nhận và hoàn thành giao dịch
```

## 🐛 Troubleshooting

### "MetaMask not found"
- Cài đặt MetaMask Chrome extension

### "Wrong Network"
- Đảm bảo kết nối đến Hardhat network (Chain ID: 31337)

### "Contract Not Initialized"
- Nhấn "Connect Wallet" trước khi thực hiện bất kỳ hành động nào

### Transaction Failed
- Kiểm tra gas fees có đủ không
- Kiểm tra account có token/NFT không
- Kiểm tra browser console để xem error details

## 📚 Tài Liệu Tham Khảo

- [ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Solidity Documentation](https://docs.soliditylang.org/)

## 📄 License

MIT License

---

**Tác Giả:** Blockchain Lottery Team  
**Cập Nhật:** 2024
