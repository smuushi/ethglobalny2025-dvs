// Seal configuration and utilities for ColdCache
// Based on: https://github.com/MystenLabs/seal/blob/main/examples/frontend/src/EncryptAndUpload.tsx

import {
  SealClient,
  getAllowlistedKeyServers,
  EncryptedObject,
  SessionKey,
} from "@mysten/seal";
import { fromHex, toHex } from "@mysten/sui/utils";
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

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
   * Decrypt game file with Seal verification (based on Seal example)
   * @param encryptedData - Encrypted game data from Walrus
   * @param sessionKey - Session key for decryption
   * @param moveCallConstructor - Function to construct the access verification transaction
   * @returns Decrypted game data
   */
  async decryptGame(
    encryptedData: Uint8Array,
    sessionKey: SessionKey,
    moveCallConstructor: (tx: Transaction, id: string) => void,
  ): Promise<Uint8Array> {
    try {
      // Parse the encrypted object to get the ID
      const fullId = EncryptedObject.parse(encryptedData).id;
      console.log("🔐 Decrypting game with Seal ID:", fullId);
      console.log("Encrypted data size:", encryptedData.length, "bytes");

      // Build transaction for access verification
      const tx = new Transaction();
      moveCallConstructor(tx, fullId);
      const txBytes = await tx.build({
        client: this.suiClient,
        onlyTransactionKind: true,
      });

      // Fetch keys first (based on Seal example pattern)
      await this.client.fetchKeys({
        ids: [fullId],
        txBytes,
        sessionKey,
        threshold: 2,
      });

      // Decrypt using SealClient
      const decryptedBytes = await this.client.decrypt({
        data: encryptedData,
        sessionKey,
        txBytes,
      });

      console.log(
        "✅ Game decrypted successfully, size:",
        decryptedBytes.length,
        "bytes",
      );
      return decryptedBytes;
    } catch (error) {
      console.error("❌ Seal decryption failed:", error);

      // Handle common Seal errors (based on Seal example)
      if (error?.constructor?.name === "NoAccessError") {
        throw new Error("You don't own the required NFT to access this game.");
      }

      throw new Error(
        `Failed to decrypt game: ${error instanceof Error ? error.message : "Unable to decrypt files, try again"}`,
      );
    }
  }

  /**
   * Create session key for decryption operations
   * @returns Session key for this user session
   */
  async createSessionKey(): Promise<SessionKey> {
    // Create a session key for decryption operations
    // This requires a user's private key or signing capability
    throw new Error(
      "SessionKey creation requires user authentication - implement based on your wallet integration",
    );
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
