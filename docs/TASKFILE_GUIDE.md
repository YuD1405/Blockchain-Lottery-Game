# Taskfile Guide

This project uses [Task](https://taskfile.dev/) for easier command execution. Task is a modern task runner / build tool that aims to be simpler and easier to use than Make.

## Installation

### Linux / macOS
```bash
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b ~/.local/bin
```

### Or using package managers:
```bash
# macOS
brew install go-task

# Ubuntu/Debian
sudo snap install task --classic

# Arch Linux
pacman -S go-task
```

For other installation methods, visit: https://taskfile.dev/installation/

## Quick Start

List all available tasks:
```bash
task --list
```

## Common Tasks

### Compilation & Testing
```bash
task compile           # Compile smart contracts
task clean            # Clean artifacts and cache
task test             # Run all tests
task test:lottery     # Test Lottery contract only
task test:nft         # Test NFT contract only
task test:marketplace # Test NFTMarketplace contract only
task test:vrf         # Test VRF consumer only
```

### Deployment
```bash
task deploy                    # Deploy to Sepolia (default)
task deploy NETWORK=localhost  # Deploy to local network
task deploy:local              # Deploy to local network (shortcut)
```

### Verification (Easy! 🎉)
```bash
# Verify all contracts automatically (reads from .env.contracts)
task verify

# Verify specific contracts
task verify:random       # Verify RandomNumberConsumerV2Plus
task verify:nft         # Verify NFT
task verify:lottery     # Verify Lottery
task verify:marketplace # Verify NFTMarketplace

# Verify on different network
task verify NETWORK=mainnet
```

### VRF Operations
```bash
task check-vrf      # Check VRF subscription status
task request-vrf    # Request random words
task pick-winner    # Pick lottery winner
```

### Utilities
```bash
task accounts         # Show accounts and balances
task node            # Start local Hardhat node
task console         # Open Hardhat console
task show-addresses  # Display deployed contract addresses
```

### Combined Workflows
```bash
# Deploy and verify in one command
task deploy-and-verify

# Full workflow: clean, compile, deploy, verify
task full-deploy
```

## Advanced Usage

### Custom Network
Most tasks support the `NETWORK` variable:
```bash
task deploy NETWORK=mainnet
task verify NETWORK=goerli
```

### Environment Variables
Taskfile automatically loads:
- `.env` - Your configuration
- `.env.contracts` - Deployed contract addresses (auto-generated)

## Examples

### Deploy to Sepolia and verify:
```bash
task deploy-and-verify
```

### Test and deploy:
```bash
task test && task deploy
```

### Full CI/CD workflow:
```bash
task full-deploy
```

### Check deployment status:
```bash
task show-addresses
```

## Why Taskfile?

✅ **Simple syntax** - YAML instead of Makefile's cryptic syntax  
✅ **Auto-completion** - Works with shell auto-completion  
✅ **Cross-platform** - Works on Linux, macOS, Windows  
✅ **Fast** - Parallel execution support  
✅ **Clear output** - Better error messages and logging  
✅ **Environment variables** - Automatic .env loading  

## Troubleshooting

### Task command not found
Make sure Task is installed and in your PATH:
```bash
which task
```

If not installed, follow the installation instructions above.

### Variables not loading
Ensure your `.env` and `.env.contracts` files exist and are readable:
```bash
ls -la .env .env.contracts
```

### Contract addresses not found
Deploy contracts first to generate `.env.contracts`:
```bash
task deploy
```

## All Available Tasks

Run `task --list` or `task help` to see all available tasks with descriptions.
