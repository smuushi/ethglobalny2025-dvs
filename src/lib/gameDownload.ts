import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { GameNFT } from "../schemas/nft";
import { SealOwnershipVerifier } from "./sealOwnership";

// Type for move call constructor (from Seal example)
export type MoveCallConstructor = (tx: Transaction, id: string) => void;

interface DownloadProgress {
  stage: "verifying" | "downloading" | "decrypting" | "complete" | "error";
  progress: number;
  message: string;
}

export class GameDownloadManager {
  private suiClient: SuiClient;
  private userAddress: string;
  private sessionKey?: any; // SessionKey from @mysten/seal
  private sealVerifier: SealOwnershipVerifier;

  constructor(suiClient: SuiClient, userAddress: string, sessionKey?: any) {
    this.suiClient = suiClient;
    this.userAddress = userAddress;
    this.sessionKey = sessionKey;

    // Initialize Seal-based verification (will get package ID dynamically)
    this.sealVerifier = new SealOwnershipVerifier(suiClient, "testnet", "");
  }

  async downloadGame(
    game: GameNFT,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<Blob> {
    try {
      // Stage 1: Verify ownership
      onProgress?.({
        stage: "verifying",
        progress: 10,
        message: "Verifying NFT ownership...",
      });

      const isOwner = await this.verifyOwnership(game);
      if (!isOwner) {
        throw new Error("Ownership verification failed");
      }

      // Stage 2: Download encrypted game from Walrus
      onProgress?.({
        stage: "downloading",
        progress: 30,
        message: "Downloading encrypted game from Walrus...",
      });

      const encryptedGame = await this.downloadFromWalrus(game.walrusBlobId);

      // Stage 3: Decrypt with Seal
      onProgress?.({
        stage: "decrypting",
        progress: 70,
        message: "Decrypting game with Seal...",
      });

      const decryptedGame = await this.decryptWithSeal(encryptedGame, game);

      // Stage 4: Complete
      onProgress?.({
        stage: "complete",
        progress: 100,
        message: "Download complete!",
      });

      return decryptedGame;
    } catch (error) {
      onProgress?.({
        stage: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Download failed",
      });
      throw error;
    }
  }

  /**
   * Simple Seal-based ownership verification
   * No complex frontend logic - let Seal and smart contracts handle it
   */
  private async verifyOwnership(game: GameNFT): Promise<boolean> {
    try {
      console.log("🔐 Using Seal-based ownership verification");
      console.log("🎮 Game ID:", game.gameId);
      console.log("👤 User:", this.userAddress);

      // Get the package ID dynamically
      const { TESTNET_GAME_STORE_PACKAGE_ID } = await import("../constants");

      // Update the verifier with the correct package ID
      this.sealVerifier = new SealOwnershipVerifier(
        this.suiClient,
        "testnet",
        TESTNET_GAME_STORE_PACKAGE_ID,
      );

      // Use session key or create one if needed
      let sessionKey = this.sessionKey;
      if (!sessionKey) {
        const { ColdCacheSeal } = await import("./seal");
        const seal = new ColdCacheSeal(this.suiClient, { network: "testnet" });
        sessionKey = await seal.createSessionKey(
          this.userAddress,
          TESTNET_GAME_STORE_PACKAGE_ID,
        );
      }

      // Let Seal verify ownership - much simpler!
      const { hasAccess } = await this.sealVerifier.verifyOwnership(
        game.gameId || game.id,
        this.userAddress,
        sessionKey,
      );

      console.log("🎯 Seal verification result:", hasAccess);
      return hasAccess;
    } catch (error) {
      console.error("❌ Seal ownership verification failed:", error);
      return false;
    }
  }

  private async downloadFromWalrus(blobId: string): Promise<ArrayBuffer> {
    if (!blobId || blobId.startsWith("walrus_")) {
      throw new Error(
        "Invalid Walrus blob ID. This game may not have been uploaded correctly.",
      );
    }

    const AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space";
    const downloadUrl = `${AGGREGATOR_URL}/v1/blobs/by-quilt-patch-id/${blobId}`;

    console.log("📡 Downloading from Walrus:", downloadUrl);

    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to download from Walrus: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log("📦 Downloaded game size:", arrayBuffer.byteLength, "bytes");

    return arrayBuffer;
  }

  private async decryptWithSeal(
    encryptedData: ArrayBuffer,
    game: GameNFT,
  ): Promise<Blob> {
    try {
      console.log("🔐 Attempting Seal decryption for game:", game.title);

      // Import necessary dependencies dynamically
      const { ColdCacheSeal } = await import("./seal");
      const { TESTNET_GAME_STORE_PACKAGE_ID } = await import("../constants");

      // Initialize Seal service
      const seal = new ColdCacheSeal(this.suiClient);

      // Use existing session key or create a new one
      let sessionKey = this.sessionKey;
      if (!sessionKey) {
        console.log("⚠️ No session key provided, creating new one");
        sessionKey = await seal.createSessionKey(
          this.userAddress,
          TESTNET_GAME_STORE_PACKAGE_ID,
        );
      }
      console.log("✅ Session key ready for decryption");

      // Since ownership was already verified, use the game ID for Seal verification
      const gameNFTId = game.gameId || game.id;
      console.log("🎫 Using game/NFT ID for Seal decryption:", gameNFTId);

      // Create move call constructor for access verification (synchronous, imports cached)
      const { fromHex } = await import("@mysten/sui/utils");

      const moveCallConstructor: MoveCallConstructor = (
        tx: Transaction,
        id: string,
      ) => {
        console.log("🔗 Building access verification transaction with ID:", id);
        console.log("🔗 Using NFT object ID:", gameNFTId);
        console.log(
          "🔗 Target function:",
          `${TESTNET_GAME_STORE_PACKAGE_ID}::game_store::seal_approve_game_access`,
        );

        try {
          // Convert hex ID to bytes for the transaction (like the Seal example)
          const idBytes = fromHex(id);
          console.log("🔗 ID hex:", id);
          console.log(
            "🔗 ID bytes length:",
            idBytes.length,
            "first few:",
            Array.from(idBytes).slice(0, 10),
          );

          tx.moveCall({
            target: `${TESTNET_GAME_STORE_PACKAGE_ID}::game_store::seal_approve_game_access`,
            arguments: [
              tx.pure.vector("u8", Array.from(idBytes)),
              tx.object(gameNFTId), // User's NFT for this game
            ],
          });

          console.log("🔗 Transaction built successfully");
        } catch (error) {
          console.error("❌ Failed to build transaction:", error);
          throw error;
        }
      };

      // Decrypt using Seal
      const decryptedBytes = await seal.decryptGame(
        new Uint8Array(encryptedData),
        sessionKey,
        moveCallConstructor,
      );

      console.log("✅ Game decrypted successfully with Seal");
      return new Blob([new Uint8Array(decryptedBytes)]);
    } catch (error) {
      console.error("❌ Seal decryption failed:", error);

      // Handle specific Seal errors (import NoAccessError if needed)
      if (
        error instanceof Error &&
        error.message.includes("You don't own the required NFT")
      ) {
        throw new Error(
          "Access denied: You don't own the required NFT to decrypt this game.",
        );
      }

      // If Seal decryption fails, try returning raw data for backwards compatibility
      // This handles games that were uploaded before encryption was enabled
      console.log(
        "⚠️ Seal decryption failed, trying raw data (game may not be encrypted)",
      );
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate processing time
      return new Blob([encryptedData]);
    }
  }

  // Utility method to trigger browser download
  static triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Helper function to format file sizes
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Helper function to estimate download time
export function estimateDownloadTime(
  fileSize: number,
  speedMbps: number = 10,
): string {
  const fileSizeMb = fileSize / (1024 * 1024);
  const timeSeconds = (fileSizeMb * 8) / speedMbps;

  if (timeSeconds < 60) {
    return `~${Math.ceil(timeSeconds)} seconds`;
  } else if (timeSeconds < 3600) {
    return `~${Math.ceil(timeSeconds / 60)} minutes`;
  } else {
    return `~${Math.ceil(timeSeconds / 3600)} hours`;
  }
}
