import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { GameNFT } from "../schemas/nft";
import { SealOwnershipVerifier } from "./sealOwnership";

// Type for move call constructor (from Seal example)
export type MoveCallConstructor = (tx: Transaction, id: string) => void;

interface DownloadProgress {
  stage:
    | "verifying"
    | "downloading"
    | "decrypting"
    | "reconstructing"
    | "complete"
    | "error";
  progress: number;
  message: string;
}

interface GameEncryptionInfo {
  isPartiallyEncrypted: boolean;
  enhancedMetadata: any;
  secondaryBlobId: string;
  sealEncryptionId: string;
}

export class GameDownloadManager {
  private suiClient: SuiClient;
  private userAddress: string;
  private sessionKey?: any; // SessionKey from @mysten/seal
  private sealVerifier: SealOwnershipVerifier;
  private verifiedNFTId?: string; // Store the actual NFT ID after verification

  constructor(suiClient: SuiClient, userAddress: string, sessionKey?: any) {
    this.suiClient = suiClient;
    this.userAddress = userAddress;
    this.sessionKey = sessionKey;

    // Initialize Seal-based verification (will get package ID dynamically)
    this.sealVerifier = new SealOwnershipVerifier(suiClient, "testnet", "");
  }

  /**
   * Fetch game encryption information from the blockchain
   */
  private async getGameEncryptionInfo(
    gameId: string,
  ): Promise<GameEncryptionInfo> {
    try {
      const gameObject = await this.suiClient.getObject({
        id: gameId,
        options: { showContent: true },
      });

      if (gameObject.data?.content && "fields" in gameObject.data.content) {
        const fields = gameObject.data.content.fields as any;

        const secondaryBlobId = fields.secondary_blob_id || "";
        const enhancedMetadataStr = fields.enhanced_metadata || "{}";
        const sealEncryptionId = fields.seal_encryption_id || "";

        // Parse enhanced metadata JSON
        let enhancedMetadata = {};
        try {
          enhancedMetadata = JSON.parse(enhancedMetadataStr);
        } catch (error) {
          console.warn("Failed to parse enhanced metadata:", error);
        }

        return {
          isPartiallyEncrypted: secondaryBlobId.length > 0,
          enhancedMetadata,
          secondaryBlobId,
          sealEncryptionId,
        };
      }
    } catch (error) {
      console.error("Failed to fetch game encryption info:", error);
    }

    // Fallback for games without partial encryption
    return {
      isPartiallyEncrypted: false,
      enhancedMetadata: {},
      secondaryBlobId: "",
      sealEncryptionId: "",
    };
  }

  async downloadGame(
    game: GameNFT,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<Blob> {
    try {
      // Stage 1: Verify ownership
      onProgress?.({
        stage: "verifying",
        progress: 5,
        message: "Verifying NFT ownership...",
      });

      const isOwner = await this.verifyOwnership(game);
      if (!isOwner) {
        throw new Error("Ownership verification failed");
      }

      // Stage 2: Get encryption information
      onProgress?.({
        stage: "verifying",
        progress: 15,
        message: "Checking game encryption type...",
      });

      const encryptionInfo = await this.getGameEncryptionInfo(
        game.gameId || game.id,
      );

      if (encryptionInfo.isPartiallyEncrypted) {
        console.log("🔐 Game uses PARTIAL encryption - downloading dual blobs");
        return await this.downloadPartiallyEncryptedGame(
          game,
          encryptionInfo,
          onProgress,
        );
      } else {
        console.log("🔒 Game uses FULL encryption - downloading single blob");
        return await this.downloadFullyEncryptedGame(game, onProgress);
      }
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
   * Download and reconstruct partially encrypted game (dual-blob approach)
   */
  private async downloadPartiallyEncryptedGame(
    game: GameNFT,
    encryptionInfo: GameEncryptionInfo,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<Blob> {
    // Stage 1: Download encrypted chunk
    onProgress?.({
      stage: "downloading",
      progress: 25,
      message: "Downloading encrypted chunk from Walrus...",
    });

    const encryptedChunk = await this.downloadFromWalrus(game.walrusBlobId);

    // Stage 2: Download unencrypted chunk
    onProgress?.({
      stage: "downloading",
      progress: 45,
      message: "Downloading data chunk from Walrus...",
    });

    const unencryptedChunk = await this.downloadFromWalrus(
      encryptionInfo.secondaryBlobId,
    );

    // Stage 3: Decrypt only the encrypted chunk
    onProgress?.({
      stage: "decrypting",
      progress: 70,
      message: "Decrypting encrypted chunk with Seal...",
    });

    const decryptedChunk = await this.decryptWithSeal(encryptedChunk, game);

    // Stage 4: Reconstruct original file
    onProgress?.({
      stage: "reconstructing",
      progress: 85,
      message: "Reconstructing original file...",
    });

    const reconstructedFile = await this.reconstructFile(
      decryptedChunk,
      unencryptedChunk,
      encryptionInfo,
    );

    onProgress?.({
      stage: "complete",
      progress: 100,
      message: "Partial encryption download complete!",
    });

    return reconstructedFile;
  }

  /**
   * Download fully encrypted game (legacy single-blob approach)
   */
  private async downloadFullyEncryptedGame(
    game: GameNFT,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<Blob> {
    // Stage 1: Download encrypted game from Walrus
    onProgress?.({
      stage: "downloading",
      progress: 30,
      message: "Downloading encrypted game from Walrus...",
    });

    const encryptedGame = await this.downloadFromWalrus(game.walrusBlobId);

    // Stage 2: Decrypt with Seal
    onProgress?.({
      stage: "decrypting",
      progress: 70,
      message: "Decrypting game with Seal...",
    });

    const decryptedGame = await this.decryptWithSeal(encryptedGame, game);

    // Stage 3: Complete
    onProgress?.({
      stage: "complete",
      progress: 100,
      message: "Download complete!",
    });

    return decryptedGame;
  }

  /**
   * Reconstruct original file from decrypted chunk + unencrypted chunk
   */
  private async reconstructFile(
    decryptedChunk: Blob,
    unencryptedChunk: ArrayBuffer,
    encryptionInfo: GameEncryptionInfo,
  ): Promise<Blob> {
    try {
      // Convert decrypted chunk to ArrayBuffer
      const decryptedBuffer = await decryptedChunk.arrayBuffer();

      console.log("🔧 Reconstructing file:", {
        decryptedChunkSize: decryptedBuffer.byteLength,
        unencryptedChunkSize: unencryptedChunk.byteLength,
        totalReconstructedSize:
          decryptedBuffer.byteLength + unencryptedChunk.byteLength,
        enhancedMetadata: encryptionInfo.enhancedMetadata,
      });

      // Combine the chunks: encrypted chunk first, then unencrypted chunk
      // This matches how the upload splits the file (beginning encrypted, rest unencrypted)
      const reconstructedSize =
        decryptedBuffer.byteLength + unencryptedChunk.byteLength;
      const reconstructedBuffer = new ArrayBuffer(reconstructedSize);
      const reconstructedView = new Uint8Array(reconstructedBuffer);

      // Copy decrypted chunk to beginning
      const decryptedView = new Uint8Array(decryptedBuffer);
      reconstructedView.set(decryptedView, 0);

      // Copy unencrypted chunk after decrypted chunk
      const unencryptedView = new Uint8Array(unencryptedChunk);
      reconstructedView.set(unencryptedView, decryptedBuffer.byteLength);

      // Determine MIME type from enhanced metadata if available
      let mimeType = "application/octet-stream";
      if (encryptionInfo.enhancedMetadata?.gameFile?.type) {
        mimeType = encryptionInfo.enhancedMetadata.gameFile.type;
      }

      console.log("✅ File reconstruction complete:", {
        originalSize:
          encryptionInfo.enhancedMetadata?.gameFile?.originalSize || "unknown",
        reconstructedSize: reconstructedBuffer.byteLength,
        mimeType,
      });

      return new Blob([reconstructedBuffer], { type: mimeType });
    } catch (error) {
      console.error("❌ File reconstruction failed:", error);
      throw new Error(
        `Failed to reconstruct original file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Simple Seal-based ownership verification
   * No complex frontend logic - let Seal and smart contracts handle it
   */
  private async verifyOwnership(game: GameNFT): Promise<boolean> {
    try {
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

      // Verify ownership using Seal
      const { hasAccess, nftId } = await this.sealVerifier.verifyOwnership(
        game.gameId || game.id,
        this.userAddress,
        sessionKey,
      );

      if (hasAccess && nftId) {
        this.verifiedNFTId = nftId;
      }
      return hasAccess;
    } catch (error) {
      console.error("❌ Ownership verification failed:", error);
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

    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to download from Walrus: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  }

  private async decryptWithSeal(
    encryptedData: ArrayBuffer,
    game: GameNFT,
  ): Promise<Blob> {
    try {
      const { ColdCacheSeal } = await import("./seal");
      const { TESTNET_GAME_STORE_PACKAGE_ID } = await import("../constants");

      const seal = new ColdCacheSeal(this.suiClient);

      let sessionKey = this.sessionKey;
      if (!sessionKey) {
        sessionKey = await seal.createSessionKey(
          this.userAddress,
          TESTNET_GAME_STORE_PACKAGE_ID,
        );
      }

      // Use the verified NFT ID from ownership verification
      const gameNFTId = this.verifiedNFTId || game.gameId || game.id;

      // Create move call constructor for access verification (synchronous, imports cached)
      const { fromHex } = await import("@mysten/sui/utils");

      const moveCallConstructor: MoveCallConstructor = (
        tx: Transaction,
        id: string,
      ) => {
        try {
          const idBytes = fromHex(id);
          tx.moveCall({
            target: `${TESTNET_GAME_STORE_PACKAGE_ID}::game_store::seal_approve_game_access`,
            arguments: [
              tx.pure.vector("u8", Array.from(idBytes)),
              tx.object(gameNFTId),
            ],
          });
        } catch (error) {
          console.error(
            "❌ Failed to build Seal verification transaction:",
            error,
          );
          throw error;
        }
      };

      const decryptedBytes = await seal.decryptGame(
        new Uint8Array(encryptedData),
        sessionKey,
        moveCallConstructor,
      );

      return new Blob([new Uint8Array(decryptedBytes)]);
    } catch (error) {
      if (error instanceof Error && error.message.includes("NoAccessError")) {
        throw new Error("You don't own the required NFT to access this game.");
      }

      console.error("❌ Decryption failed:", error);
      throw new Error(
        "Access denied: You don't own the required NFT to decrypt this game.",
      );
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
