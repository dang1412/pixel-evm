# Pixel EVM Project Guide for AI Agents

This document provides essential context for working on the `pixel-evm` codebase.

## Project Overview

`pixel-evm` is a web-based application that integrates a 2D game built with Pixi.js into a Next.js frontend. The application interacts with Ethereum-based smart contracts to manage in-game assets and state.

- **Frontend**: Next.js with TypeScript and the App Router (`src/app`).
- **Styling**: Tailwind CSS.
- **Game Engine**: Pixi.js for 2D rendering and game logic. Game components are located in `src/components/Game/`.
- **Blockchain**: Smart contracts are written in Solidity and managed with Hardhat. Frontend blockchain interaction is handled by `wagmi` and `viem`.
- **Assets**: Game assets (images, sounds, animations) are in the `public/` directory.

## Key Architectural Concepts

- **Web3 Integration**: The frontend is a dApp (decentralized application). Wallet connections and contract interactions are managed through `wagmi` hooks. Look for a `WagmiProvider` or similar setup, likely in `src/providers/` or `src/app/layout.tsx`.
- **Game Components**: The core game logic is encapsulated in React components that use Pixi.js. A key example is `src/components/Game/Bomb/BombGameComponent.tsx`, which shows how the game canvas is integrated into the React component tree.
- **Smart Contracts**: Solidity contracts are in the `contracts/` directory. These define the on-chain logic for game items, player state, etc.

## Developer Workflows

### Frontend Development

- **Run the development server**:
  ```bash
  npm run dev
  ```
- **Run frontend tests**:
  ```bash
  npm run test
  ```
  This executes Jest tests for the React components.

### Smart Contract Development

The `README.md` indicates that Hardhat is used for smart contract tasks, even though it's not in the `package.json`'s dependencies (it might be expected to be installed globally or via `npx`).

- **Compile contracts**:
  ```bash
  npx hardhat compile
  ```
- **Run contract tests**:
  ```bash
  npx hardhat test
  ```
- **Deploy contracts**:
  ```bash
  npx hardhat ignition deploy ./ignition/modules/Lock.ts
  ```

## Important Files and Directories

- `src/app/`: The Next.js application entry point and pages.
- `src/components/Game/`: Contains the Pixi.js game components. This is where most of the game logic resides.
- `contracts/`: Solidity smart contracts.
- `public/`: Static game assets.
- `package.json`: Lists all frontend dependencies and scripts.
- `hardhat.config.ts`: Configuration for the Hardhat development environment for smart contracts.
- `test/`: Contains tests for both smart contracts (`.ts` files for Hardhat) and potentially frontend components.
