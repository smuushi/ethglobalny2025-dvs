import { SuiClient } from "@mysten/sui/client";

interface GameNFT {
  id: string;
  gameId: string;
  title: string;
  walrusBlobId: string;
  sealPolicyId: string;
  currentOwner: string;
}

interface DownloadProgress {
  stage: "verifying" | "downloading" | "decrypting" | "complete" | "error";
  progress: number;
  message: string;
}

export class GameDownloadManager {
  private suiClient: SuiClient;
  private userAddress: string;

  constructor(suiClient: SuiClient, userAddress: string) {
    this.suiClient = suiClient;
    this.userAddress = userAddress;
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

      const decryptedGame = await this.decryptWithSeal(
        encryptedGame,
        game.sealPolicyId,
      );

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

  private async verifyOwnership(game: GameNFT): Promise<boolean> {
    try {
      console.log("🔍 Verifying ownership for game:", game.gameId);
      console.log("👤 User address:", this.userAddress);

      // Query user's owned NFTs from both contracts
      const [gameStoreNFTs, nftContractNFTs] = await Promise.all([
        this.queryGameStoreNFTs(),
        this.queryNFTContractNFTs(),
      ]);

      console.log("🏪 GameStore NFTs found:", gameStoreNFTs.length);
      console.log("🎫 NFT Contract NFTs found:", nftContractNFTs.length);

      // Check if user owns an NFT for this game
      const ownsGameStoreNFT = gameStoreNFTs.some((nft: any) => {
        const nftGameId = nft.data?.content?.fields?.game_id;
        console.log(`Checking GameStore NFT: ${nftGameId} vs ${game.gameId}`);
        return nftGameId === game.gameId;
      });

      const ownsNFTContractNFT = nftContractNFTs.some((nft: any) => {
        const nftGameId = nft.data?.content?.fields?.game_id;
        console.log(
          `Checking NFT Contract NFT: ${nftGameId} vs ${game.gameId}`,
        );
        return nftGameId === game.gameId;
      });

      const ownsGame = ownsGameStoreNFT || ownsNFTContractNFT;
      console.log(`🎯 Ownership result: ${ownsGame}`);

      return ownsGame;
    } catch (error) {
      console.error("❌ Ownership verification failed:", error);
      return false;
    }
  }

  private async queryGameStoreNFTs(): Promise<any[]> {
    try {
      const result = await this.suiClient.getOwnedObjects({
        owner: this.userAddress,
        filter: {
          StructType: "::game_store::GameNFT",
        },
        options: {
          showContent: true,
          showType: true,
        },
      });
      return result?.data || [];
    } catch (error) {
      console.warn("Failed to query GameStore NFTs:", error);
      return [];
    }
  }

  private async queryNFTContractNFTs(): Promise<any[]> {
    try {
      const result = await this.suiClient.getOwnedObjects({
        owner: this.userAddress,
        filter: {
          StructType: "::nft::GameNFT",
        },
        options: {
          showContent: true,
          showType: true,
        },
      });
      return result?.data || [];
    } catch (error) {
      console.warn("Failed to query NFT Contract NFTs:", error);
      return [];
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
    policyId: string,
  ): Promise<Blob> {
    // TODO: Implement actual Seal decryption when @mysten/seal is integrated
    // For now, return the raw data as a blob (assuming it's not encrypted yet)
    console.log("🔐 Seal decryption not yet implemented, returning raw blob");
    console.log("Policy ID:", policyId);

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return the raw data as a blob
    return new Blob([encryptedData]);
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
