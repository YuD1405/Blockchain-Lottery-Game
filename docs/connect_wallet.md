# **MetaMask Local Development Guide**

---

## **1. Install MetaMask**

1. Open Chrome / Brave / Edge
2. Visit: [https://metamask.io](https://metamask.io)
3. Download the browser extension
4. Create a new wallet or import an existing one
5. Save your **Secret Recovery Phrase** securely

---

## **2. Start your Local Hardhat Network**

Inside your project folder, run:

```bash
npx hardhat node
```

Hardhat will start a local blockchain on:

```
RPC URL: http://127.0.0.1:8545
Chain ID: 31337   (or your custom chainId)
```

It will also generate **20 unlocked accounts** with private keys.

---

## **3. Add a Local Network to MetaMask**

1. Open MetaMask
2. Click the network dropdown (top-left)
3. Select **Add Network**
4. Choose **Add a network manually**
5. Enter:

| Field                  | Value                                          |
| ---------------------- | ---------------------------------------------- |
| **Network Name**       | Hardhat Local                                  |
| **RPC URL**            | [http://127.0.0.1:8545](http://127.0.0.1:8545) |
| **Chain ID**           | 31337 *(or the one in your config)*             |
| **Currency Symbol**    | ETH                                            |
| **Block Explorer URL** | *(leave empty)*                                |

6. Click **Save**

MetaMask is now connected to your local blockchain.

---

## **4. Import Local Accounts into MetaMask**

Hardhat exposes accounts with private keys in the terminal.

To import one:

1. MetaMask → Account icon → **Import Account**
2. Paste a private key from Hardhat output
3. Done. You now control a local dev account with **10,000 ETH (fake)**

Repeat if you want multiple accounts for testing.

---

## **5. Verify Connection**

Open the MetaMask network dropdown → ensure **Hardhat Local** is selected.

Then check:

* The ETH balance (should be large, e.g., 10000 ETH)
* You can switch between imported dev accounts
* Sending ETH between accounts works instantly

---
