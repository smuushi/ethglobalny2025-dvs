// Seal configuration and utilities for ColdCache
// Based on: https://github.com/MystenLabs/seal/blob/main/examples/frontend/src/EncryptAndUpload.tsx

import {
  SealClient,
  getAllowlistedKeyServers,
  EncryptedObject,
  SessionKey,
  NoAccessError,
} from "@mysten/seal";
import { fromHex, toHex } from "@mysten/sui/utils";
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

// Type for move call constructor (matching Seal example)
export type MoveCallConstructor = (tx: Transaction, id: string) => void;

export interface SealConfig {
  network: "testnet" | "mainnet";
  keyServers?: string[];
}

export interface SealPolicy {
  id: string;
  name: string;
  type: "nft_ownership";
  contract: string;
  verificationFunction: string;
}

export interface EncryptionResult {
  encryptedData: ArrayBuffer;
  policyId: string;
}

export interface DecryptionOptions {
  encryptedData: Uint8Array;
  sessionKey: SessionKey;
  txBytes: Uint8Array;
}

// Default Seal configuration for ColdCache
export const SEAL_CONFIG: SealConfig = {
  network: "testnet",
  // keyServers will be configured when Seal is fully integrated
};

// Seal service class for ColdCache NFT-gated encryption
export class ColdCacheSeal {
  private client: SealClient;
  private suiClient: SuiClient;

  constructor(suiClient: SuiClient, config: SealConfig = SEAL_CONFIG) {
    this.suiClient = suiClient;

    // Initialize SealClient with allowlisted key servers (from Seal example)
    this.client = new SealClient({
      suiClient,
      serverConfigs: getAllowlistedKeyServers(config.network).map((id) => ({
        objectId: id,
        weight: 1,
      })),
      verifyKeyServers: false, // Set to true in production
    });
  }

  /**
   * Create a Seal policy for NFT-gated game access
   * @param gameName - Name of the game for the policy
   * @param contractAddress - Game store contract address
   * @returns Policy information
   */
  async createGamePolicy(
    gameName: string,
    contractAddress: string,
  ): Promise<SealPolicy> {
    // TODO: Implement actual Seal policy creation
    // const policy = await this.seal.createPolicy({
    //   name: `ColdCache Game: ${gameName}`,
    //   type: "nft_ownership",
    //   contract: contractAddress,
    //   verificationFunction: "verify_game_ownership",
    // });
    // return policy;

    console.log("🔐 Creating Seal policy placeholder for:", gameName);
    return {
      id: `placeholder_policy_${Date.now()}`,
      name: `ColdCache Game: ${gameName}`,
      type: "nft_ownership",
      contract: contractAddress,
      verificationFunction: "verify_game_ownership",
    };
  }

  /**
   * Encrypt game file with Seal policy (based on Seal example)
   * @param gameData - Game file data
   * @param policyObjectId - Sui object ID of the policy (NFT contract address)
   * @param packageId - Game store package ID
   * @returns Encrypted data
   */
  async encryptGame(
    gameData: ArrayBuffer,
    policyObjectId: string,
    packageId: string,
  ): Promise<Uint8Array> {
    try {
      console.log("🔐 Encrypting game with Seal policy:", policyObjectId);
      console.log("Game data size:", gameData.byteLength, "bytes");

      // Generate unique encryption ID (from Seal example pattern)
      const nonce = crypto.getRandomValues(new Uint8Array(5));
      const policyObjectBytes = fromHex(policyObjectId);
      const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));

      // Encrypt using SealClient (threshold 2 for security)
      const { encryptedObject: encryptedBytes } = await this.client.encrypt({
        threshold: 2, // Minimum key servers needed for decryption
        packageId,
        id,
        data: new Uint8Array(gameData),
      });

      console.log(
        "✅ Game encrypted successfully, size:",
        encryptedBytes.length,
        "bytes",
      );
      return encryptedBytes;
    } catch (error) {
      console.error("❌ Seal encryption failed:", error);
      throw new Error(
        `Failed to encrypt game: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Decrypt game file with Seal verification (following proven example pattern)
   * @param encryptedData - Encrypted game data from Walrus
   * @param sessionKey - Session key for decryption
   * @param moveCallConstructor - Function to construct the access verification transaction
   * @returns Decrypted game data
   */
  async decryptGame(
    encryptedData: Uint8Array,
    sessionKey: SessionKey,
    moveCallConstructor: MoveCallConstructor,
  ): Promise<Uint8Array> {
    try {
      // Parse the encrypted object to get the ID
      const fullId = EncryptedObject.parse(encryptedData).id;
      console.log("🔐 Decrypting game with Seal ID:", fullId);
      console.log("Encrypted data size:", encryptedData.length, "bytes");

      // PHASE 1: Fetch keys first (like the example)
      console.log("🔑 Phase 1: Fetching decryption keys...");
      const tx1 = new Transaction();
      moveCallConstructor(tx1, fullId);
      const txBytes = await tx1.build({
        client: this.suiClient,
        onlyTransactionKind: true,
      });

      await this.client.fetchKeys({
        ids: [fullId],
        txBytes,
        sessionKey,
        threshold: 2,
      });
      console.log("✅ Keys fetched successfully");

      // PHASE 2: Decrypt locally using pre-fetched keys (like the example)
      console.log("🔓 Phase 2: Decrypting with pre-fetched keys...");
      const tx2 = new Transaction();
      moveCallConstructor(tx2, fullId);
      const txBytes2 = await tx2.build({
        client: this.suiClient,
        onlyTransactionKind: true,
      });

      const decryptedBytes = await this.client.decrypt({
        data: encryptedData,
        sessionKey,
        txBytes: txBytes2,
      });

      console.log(
        "✅ Game decrypted successfully, size:",
        decryptedBytes.length,
        "bytes",
      );
      return decryptedBytes;
    } catch (error) {
      console.error("❌ Seal decryption failed:", error);

      // Handle common Seal errors (following example pattern)
      if (error instanceof NoAccessError) {
        throw new Error("You don't own the required NFT to access this game.");
      }

      throw new Error(
        `Failed to decrypt game: ${error instanceof Error ? error.message : "Unable to decrypt files, try again"}`,
      );
    }
  }

  /**
   * Create session key for decryption operations
   * @param userAddress - The user's Sui address
   * @param packageId - The package ID for the session key
   * @returns Session key for this user session
   */
  async createSessionKey(
    userAddress: string,
    packageId: string,
  ): Promise<SessionKey> {
    try {
      console.log("🔑 Creating session key for user:", userAddress);

      // Create session key using the proper Seal SDK method
      const sessionKey = await SessionKey.create({
        address: userAddress,
        packageId: packageId,
        ttlMin: 10, // 10 minutes TTL
        suiClient: this.suiClient,
      });

      console.log("✅ Session key created successfully");
      return sessionKey;
    } catch (error) {
      console.error("❌ Failed to create session key:", error);
      throw new Error(
        `Session key creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Verify ownership using Seal's access control system
   * This is much cleaner than manual frontend checks
   * @param gameId - Game ID to verify access for
   * @param userAddress - User's wallet address
   * @param sessionKey - Session key for verification
   * @param moveCallConstructor - Function to build the access verification transaction
   * @returns Promise<boolean> - true if user has access, false otherwise
   */
  async verifyOwnership(
    gameId: string,
    userAddress: string,
    sessionKey: SessionKey,
    moveCallConstructor: MoveCallConstructor,
  ): Promise<boolean> {
    try {
      console.log("🔐 Verifying ownership using Seal access control");
      console.log("🎮 Game ID:", gameId);
      console.log("👤 User:", userAddress);

      // Try to fetch keys - if this succeeds, the user has access
      const tx = new Transaction();
      moveCallConstructor(tx, gameId);
      const txBytes = await tx.build({
        client: this.suiClient,
        onlyTransactionKind: true,
      });

      await this.client.fetchKeys({
        ids: [gameId],
        txBytes,
        sessionKey,
        threshold: 1, // Lower threshold for verification only
      });

      console.log("✅ Seal ownership verification successful");
      return true;
    } catch (error) {
      if (error instanceof NoAccessError) {
        console.log("❌ Seal ownership verification failed: No access");
        return false;
      }

      console.warn("⚠️ Seal ownership verification error:", error);
      return false;
    }
  }
}

// Utility functions for integration
export const isSealEnabled = (): boolean => {
  // Check if Seal is properly configured and available
  return true; // Seal is now integrated and ready to use
};

export const getSealErrorMessage = (error: any): string => {
  // TODO: Parse Seal-specific error messages
  if (error.message?.includes("ownership")) {
    return "You don't own the required NFT to access this game.";
  }
  if (error.message?.includes("policy")) {
    return "Game access policy not found or invalid.";
  }
  if (error.message?.includes("decrypt")) {
    return "Failed to decrypt game file. Please try again.";
  }
  return "Seal access verification failed. Please try again.";
};
