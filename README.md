# Blockchain-Lottery-Game
---

## 🧩 Project Structure

```

blockchain-lottery-game/
├── contracts/           # Solidity smart contracts
│   └── HelloWorld.sol
│
├── scripts/             # Deployment & interaction scripts
│   └── deploy.ts
│
├── test/                # Unit tests (Mocha + Chai)
│   └── helloTest.ts
│
├── frontend/            # Web UI
│   └── html, js / ts, css
│
├── hardhat.config.ts    # Main Hardhat configuration file
├── package.json         # NPM dependencies & scripts
├── tsconfig.json        # TypeScript configuration
└── node_modules/        # Installed libraries

````

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone https://github.com/<your-org>/blockchain-lottery-game.git
cd blockchain-lottery-game
````

### 2️⃣ Install dependencies

```bash
npm install
```

If you encounter peer dependency conflicts, use:

```bash
npm install --legacy-peer-deps
```

---

## 💻 Common Commands

| Command                                                 | Description                             |
| ------------------------------------------------------- | --------------------------------------- |
| `npx hardhat compile`                                   | Compile Solidity contracts              |
| `npx hardhat test`                                      | Run all tests in `/test`                |
| `npx hardhat node`                                      | Start a local blockchain node           |
| `npx hardhat run scripts/deploy.ts --network localhost` | Deploy contract to local node           |
| `npx hardhat accounts`                                  | List sample wallet addresses & balances |

---

## 🧰 Example Workflow

### ▶️ Step-by-step

```bash
# 1. Compile contracts
npx hardhat compile

# 2. Start local blockchain node
npx hardhat node
```

(Open a new terminal tab)

```bash
# 3. Deploy contract to local network
npx hardhat run scripts/deploy.ts --network localhost
```

```bash
# 4. Run tests (in-memory network)
npx hardhat test
```

---

## 🧠 Developer Notes

* Contracts are compiled into `/artifacts/`.
* Hardhat network (default) resets state for every command.
* Use `localhost` network for persistent local testing.
* Each run of `hardhat node` generates 20 funded test accounts.

---

## 🧑‍💻 Contributors Guide

When cloning this repo:

1. Run `npm install`
2. Run `npx hardhat compile`
3. Start a local node with `npx hardhat node`
4. Deploy contracts using the provided script
5. Write or run tests in `/test`

That’s it! You’re ready to build your own blockchain lottery logic.

---