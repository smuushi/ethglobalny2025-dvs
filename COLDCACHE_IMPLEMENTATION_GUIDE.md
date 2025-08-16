# ColdCache - Decentralized Video Game Store Implementation Guide

## Project Overview

ColdCache is a revolutionary platform that gives gamers true ownership of their
digital games through NFTs, eliminates censorship, and enables full resale
rights. Built on Sui blockchain with Walrus storage integration.

## Problem Statement

- **Censorship**: Games purchased on platforms like itch.io can be deleted due
  to payment processor issues
- **No Resale Rights**: Digital games cannot be resold, eliminating secondary
  markets and community resources like libraries
- **Platform Monopolies**: Consumers have zero control over their digital
  purchases, developers forced to accept 30% platform cuts

## ColdCache Solution

- **True Ownership**: Game purchases mint NFTs that prove ownership forever
- **Censorship Resistance**: Games stored on decentralized Walrus storage
- **Resale Rights**: NFT ownership enables peer-to-peer game transfers
- **Developer Friendly**: Minimal platform fees, just gas costs

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Sui Blockchain │    │ Walrus Storage  │
│   (Vite React)  │◄───┤  (Move Contracts)├───►│(Encrypted Games)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                  ┌────▼────┐             ┌────▼────┐
        │                  │   NFT   │             │ Tusky   │
        │                  │Contract │             │  SDK    │
        │                  └─────────┘             └─────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                         ┌──────▼──────┐
                         │    Seal     │
                         │ Token-Gated │
                         │ Encryption  │
                         └─────────────┘
```

**Key Components:**

- **Sui Move Contracts**: NFT ownership and game registry
- **Walrus Storage**: Decentralized storage for encrypted game files
- **Seal Encryption**: Token-gated access control with real-time verification
- **Tusky SDK**: Simplified Walrus integration
- **Real-time Verification**: Every download checks current NFT ownership

## Current Project Structure Analysis

Your project already has excellent foundations:

```
ColdCache/
├── src/
│   ├── App.tsx           ← Main app with Sui wallet integration ✅
│   ├── Counter.tsx       ← Basic Move contract interaction ✅
│   ├── CreateCounter.tsx ← Transaction handling example ✅
│   ├── constants.ts      ← Package IDs for different networks ✅
│   └── networkConfig.ts  ← Network configuration ✅
├── move/counter/
│   └── sources/
│       └── counter.move  ← Example Move contract ✅
├── package.json          ← Already includes @mysten/dapp-kit ✅
└── vite.config.mts       ← Vite configuration ✅
```

**What you already have:**

- ✅ Sui dApp Kit integration
- ✅ Wallet connection (`ConnectButton`)
- ✅ Move contract deployment
- ✅ Transaction signing and execution
- ✅ RadixUI for styling
- ✅ Network configuration

## Core Features Implementation

### 1. Store View - Game Catalog and Purchase

**Location**: `/src/pages/Store.tsx` (to be created)

**Key TODOs**:

- [ ] Integrate with Sui Move contract to fetch available games
- [ ] Implement game purchase flow (mint NFT)
- [ ] Add RadixUI components for modern game store UI
- [ ] Add search, filtering, and pagination
- [ ] Integrate with Walrus for game cover images

**Sui Integration** (building on your current pattern):

```typescript
// Following your CreateCounter.tsx pattern
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

const gameStorePackageId = useNetworkVariable("gameStorePackageId");

const { data: availableGames } = useSuiClientQuery("getOwnedObjects", {
  owner: gameStorePackageId,
  filter: { StructType: `${gameStorePackageId}::game_store::Game` },
});

const { mutate: purchaseGame } = useSignAndExecuteTransaction();

const handlePurchase = (gameId: string, price: string) => {
  const tx = new Transaction();

  tx.moveCall({
    target: `${gameStorePackageId}::game_store::purchase_game`,
    arguments: [tx.pure.string(gameId)],
    coins: [tx.splitCoins(tx.gas, [parseInt(price)])],
  });

  purchaseGame({ transaction: tx });
};
```

### 2. Library View - Owned Games and Downloads

**Location**: `/src/pages/Library.tsx` (to be created)

**Key TODOs**:

- [ ] Query owned game NFTs from Sui
- [ ] Implement real-time NFT ownership verification
- [ ] Integrate Seal for token-gated decryption
- [ ] Integrate Tusky SDK for encrypted file downloads from Walrus
- [ ] Implement download progress tracking
- [ ] Add game transfer/gift functionality

**Sui + Walrus Integration**:

```typescript
const downloadGame = async (game: OwnedGame) => {
  // 1. Verify NFT ownership on Sui (your current pattern)
  const { data: ownedObjects } = await suiClient.getOwnedObjects({
    owner: currentAccount?.address,
    filter: { StructType: `${gameStorePackageId}::game_store::GameNFT` },
  });

  const ownsGame = ownedObjects.data.some(
    (obj) => obj.data?.content?.fields?.game_id === game.gameId,
  );

  if (!ownsGame) {
    throw new Error("Game ownership verification failed");
  }

  // 2. Download encrypted game from Walrus
  const tusky = new Tusky({
    apiKey: process.env.VITE_TUSKY_API_KEY,
  });
  const encryptedGame = await tusky.file.arrayBuffer(game.walrusId);

  // 3. Use Seal for token-gated decryption
  const gameFile = await seal.decrypt(encryptedGame, {
    policyId: game.sealPolicyId,
    userAddress: currentAccount?.address,
  });

  // 4. Provide download to user
  downloadBlob(gameFile, `${game.title}.zip`);
};
```

### 3. Publisher Portal - Game Upload and Registration

**Location**: `/src/pages/Publisher.tsx` (to be created)

**Key TODOs**:

- [ ] Create Seal NFT-based access policies
- [ ] Encrypt game files with Seal before upload
- [ ] Upload encrypted games to Walrus using Tusky SDK
- [ ] Register games on Sui Move contract with Seal policy
- [ ] Handle metadata (cover images, descriptions)
- [ ] Publisher analytics and earnings tracking

**Sui Upload Flow**:

```typescript
const publishGame = async (gameFile: File, metadata: GameMetadata) => {
  // 1. Create Seal NFT-based access policy
  const sealPolicy = await seal.createPolicy({
    name: `ColdCache Game: ${metadata.title}`,
    type: "nft_ownership",
    contract: gameStorePackageId,
    network: "sui",
    verificationFunction: "verify_game_ownership",
  });

  // 2. Encrypt game with Seal policy
  const encryptedGame = await seal.encrypt(gameFile, sealPolicy.id);

  // 3. Upload encrypted game to Walrus
  const tusky = new Tusky({ apiKey: process.env.VITE_TUSKY_API_KEY });
  const vaultId = await tusky.vault.create(`Game: ${metadata.title}`);
  const walrusId = await tusky.file.upload(vaultId, encryptedGame);

  // 4. Register on Sui contract (following your transaction pattern)
  const tx = new Transaction();

  tx.moveCall({
    target: `${gameStorePackageId}::game_store::publish_game`,
    arguments: [
      tx.pure.string(metadata.title),
      tx.pure.string(metadata.description),
      tx.pure.u64(parseFloat(metadata.price) * 1000000000), // Convert to MIST
      tx.pure.string(walrusId),
      tx.pure.string(sealPolicy.id),
      tx.pure.string(metadata.genre),
    ],
  });

  signAndExecute({ transaction: tx });
};
```

## Move Smart Contract Implementation

### GameStore Contract (Sui Move)

**Location**: `/move/game_store/sources/game_store.move`

**Key TODOs**:

- [ ] Create new Move package for game store
- [ ] Implement game publishing with Seal policy integration
- [ ] Implement NFT minting for purchases
- [ ] Add real-time ownership verification for Seal
- [ ] Implement transfer tracking and royalties

**Core Move Contract** (replacing your counter.move):

```move
module game_store::game_store {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use std::string::String;

    /// Game information stored on-chain
    public struct Game has key, store {
        id: UID,
        title: String,
        description: String,
        price: u64,
        publisher: address,
        walrus_id: String,        // Encrypted game on Walrus
        seal_policy_id: String,   // Seal access policy ID
        cover_image_id: String,
        genre: String,
        publish_date: u64,
        is_active: bool,
    }

    /// NFT representing game ownership
    public struct GameNFT has key, store {
        id: UID,
        game_id: ID,
        owner: address,
        purchase_date: u64,
    }

    /// Game store registry
    public struct GameStore has key {
        id: UID,
        admin: address,
        games: vector<ID>,
    }

    /// Publish a new game
    public fun publish_game(
        _store: &mut GameStore,
        title: String,
        description: String,
        price: u64,
        walrus_id: String,
        seal_policy_id: String,
        genre: String,
        ctx: &mut TxContext
    ): ID {
        let game = Game {
            id: object::new(ctx),
            title,
            description,
            price,
            publisher: tx_context::sender(ctx),
            walrus_id,
            seal_policy_id,
            cover_image_id: std::string::utf8(b""),
            genre,
            publish_date: tx_context::epoch(ctx),
            is_active: true,
        };

        let game_id = object::id(&game);
        transfer::share_object(game);
        game_id
    }

    /// Purchase a game (mint NFT)
    public fun purchase_game(
        game: &Game,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ): GameNFT {
        assert!(coin::value(&payment) >= game.price, 0);

        // Transfer payment to publisher
        transfer::public_transfer(payment, game.publisher);

        // Mint NFT to buyer
        let nft = GameNFT {
            id: object::new(ctx),
            game_id: object::id(game),
            owner: tx_context::sender(ctx),
            purchase_date: tx_context::epoch(ctx),
        };

        nft
    }

    /// Verify game ownership (called by Seal)
    public fun verify_game_ownership(
        nft: &GameNFT,
        game_id: ID,
        owner: address
    ): bool {
        nft.game_id == game_id && nft.owner == owner
    }

    /// Transfer game NFT (automatic access transfer)
    public fun transfer_game(nft: GameNFT, to: address) {
        transfer::public_transfer(nft, to);
        // Access automatically transfers with NFT - Seal verifies on next download
    }
}
```

## Integration Requirements

### 1. Sui Blockchain Integration (Already ✅)

Your current dependencies are perfect:

```json
{
  "@mysten/dapp-kit": "0.17.3",
  "@mysten/sui": "1.37.2"
}
```

**What you need to add**:

```json
{
  "@mysten/seal": "latest",
  "@tusky-io/ts-sdk": "latest"
}
```

### 2. Navigation Updates

Update your current `App.tsx` to include ColdCache branding and navigation:

```typescript
// Replace line 27 in App.tsx
<Heading>ColdCache - Decentralized Game Store</Heading>

// Add navigation tabs
<Tabs.Root defaultValue="store">
  <Tabs.List>
    <Tabs.Trigger value="store">Store</Tabs.Trigger>
    <Tabs.Trigger value="library">Library</Tabs.Trigger>
    <Tabs.Trigger value="publisher">Publisher</Tabs.Trigger>
  </Tabs.List>

  <Tabs.Content value="store"><Store /></Tabs.Content>
  <Tabs.Content value="library"><Library /></Tabs.Content>
  <Tabs.Content value="publisher"><Publisher /></Tabs.Content>
</Tabs.Root>
```

### 3. Environment Configuration

Update your environment with:

```bash
# Seal configuration for token-gated encryption
VITE_SEAL_NETWORK=testnet
VITE_SEAL_KEY_SERVERS=https://seal1.mystenlabs.com,https://seal2.mystenlabs.com

# Walrus configuration (uses your existing Sui client)
VITE_WALRUS_NETWORK=testnet

# Game Store Package IDs (add to constants.ts)
VITE_DEVNET_GAME_STORE_PACKAGE_ID=0xTODO
VITE_TESTNET_GAME_STORE_PACKAGE_ID=0xTODO
VITE_MAINNET_GAME_STORE_PACKAGE_ID=0xTODO
```

## Development Roadmap

### Phase 1: Foundation ✅ (You're here!)

- [x] Set up Vite + Sui dApp Kit
- [x] Basic wallet connection
- [x] Move contract deployment
- [x] Transaction handling
- [ ] Add navigation and ColdCache branding
- [ ] Add Seal + Walrus SDK dependencies

### Phase 2: Core Game Store

- [ ] Create game_store.move contract
- [ ] Implement Store page with game catalog
- [ ] Implement purchase flow with NFT minting
- [ ] Test basic contract interactions

### Phase 3: Walrus Integration

- [ ] Set up official Walrus SDK integration
- [ ] Implement encrypted file upload to Walrus using WalrusClient
- [ ] Implement Seal token-gated decryption
- [ ] Test upload/download flows

### Phase 4: Complete Features

- [ ] Complete Library page with owned games
- [ ] Complete Publisher portal
- [ ] Implement game transfer functionality
- [ ] End-to-end testing

## Key Advantages of Your Current Sui Stack

1. **Better Performance**: Sui's parallel execution vs Flow's sequential
2. **Lower Costs**: More efficient gas model
3. **Rich Move Language**: Better smart contract capabilities
4. **Growing Ecosystem**: Strong DeFi and gaming focus
5. **Object Model**: Perfect for NFT ownership tracking

## Quick Next Steps

1. **Add dependencies**:

```bash
pnpm add @mysten/seal @mysten/walrus
```

2. **Update branding** in `App.tsx`:

```typescript
<Heading>ColdCache - Decentralized Game Store</Heading>
```

3. **Create Move package**:

```bash
cd move
sui move new game_store
```

4. **Add navigation structure** to replace counter functionality

Your foundation is excellent! The Sui integration is already solid, and you just
need to build the game store features on top of your existing architecture.

---

**ColdCache delivers the promise of Web3: true ownership that actually
transfers.** 🎮✨
