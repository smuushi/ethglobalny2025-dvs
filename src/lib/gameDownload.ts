import { SuiClient } from "@mysten/sui/client";
import { GameNFT } from "../schemas/nft";
// import { Seal } from "@mysten/seal"; // TODO: Import when implementing Seal integration

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
        game.sealPolicyId || "",
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

      // Debug: Log all NFT data first
      console.log(
        "🔍 All GameStore NFTs:",
        JSON.stringify(gameStoreNFTs, null, 2),
      );
      console.log(
        "🔍 All NFT Contract NFTs:",
        JSON.stringify(nftContractNFTs, null, 2),
      );
      console.log("🔍 Looking for game ID:", game.gameId);
      console.log("🔍 Game object:", JSON.stringify(game, null, 2));

      // Ownership check: Do you own an NFT for this game?
      // The game object represents a game you want to download
      // We need to check if you own ANY NFT that gives you access to this game
      const ownsGameStoreNFT = gameStoreNFTs.some((nft: any) => {
        const nftId = nft.data?.objectId;
        const nftGameId = nft.data?.content?.fields?.game_id;
        const nftWalrusBlobId = nft.data?.content?.fields?.walrus_blob_id;

        // Check multiple ways to match:
        // 1. NFT ID matches the game's NFT ID (exact NFT match)
        // 2. NFT's game_id matches what we're trying to download
        // 3. NFT's walrus_blob_id matches (same game file)
        const matchesNftId = nftId === game.id;
        const matchesGameId = nftGameId === game.gameId;
        const matchesWalrusBlobId = nftWalrusBlobId === game.walrusBlobId;

        console.log(
          `Checking GameStore NFT: ${nftId}`,
          `\n  - NFT ID match: ${matchesNftId} (${nftId} === ${game.id})`,
          `\n  - Game ID match: ${matchesGameId} (${nftGameId} === ${game.gameId})`,
          `\n  - Walrus blob match: ${matchesWalrusBlobId} (${nftWalrusBlobId} === ${game.walrusBlobId})`,
        );

        return matchesNftId || matchesGameId || matchesWalrusBlobId;
      });

      const ownsNFTContractNFT = nftContractNFTs.some((nft: any) => {
        const nftId = nft.data?.objectId;
        const nftGameId = nft.data?.content?.fields?.game_id;
        const nftWalrusBlobId = nft.data?.content?.fields?.walrus_blob_id;

        const matchesNftId = nftId === game.id;
        const matchesGameId = nftGameId === game.gameId;
        const matchesWalrusBlobId = nftWalrusBlobId === game.walrusBlobId;

        console.log(
          `Checking NFT Contract NFT: ${nftId}`,
          `\n  - NFT ID match: ${matchesNftId}`,
          `\n  - Game ID match: ${matchesGameId}`,
          `\n  - Walrus blob match: ${matchesWalrusBlobId}`,
        );

        return matchesNftId || matchesGameId || matchesWalrusBlobId;
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
      // Get the package IDs from the network config
      // We need to construct the full StructType with the actual package ID
      const result = await this.suiClient.getOwnedObjects({
        owner: this.userAddress,
        options: {
          showContent: true,
          showType: true,
        },
      });

      // Filter for GameStore NFTs by checking the type
      const gameStoreNFTs =
        result?.data?.filter((nft: any) => {
          const type = nft.data?.type;
          return type && type.includes("::game_store::GameNFT");
        }) || [];

      console.log("🔍 All owned objects:", result?.data?.length);
      console.log("🏪 Filtered GameStore NFTs:", gameStoreNFTs.length);

      return gameStoreNFTs;
    } catch (error) {
      console.warn("Failed to query GameStore NFTs:", error);
      return [];
    }
  }

  private async queryNFTContractNFTs(): Promise<any[]> {
    try {
      // Get all owned objects and filter for NFT contract NFTs
      const result = await this.suiClient.getOwnedObjects({
        owner: this.userAddress,
        options: {
          showContent: true,
          showType: true,
        },
      });

      // Filter for NFT Contract NFTs by checking the type
      const nftContractNFTs =
        result?.data?.filter((nft: any) => {
          const type = nft.data?.type;
          return type && type.includes("::nft::GameNFT");
        }) || [];

      console.log("🎫 Filtered NFT Contract NFTs:", nftContractNFTs.length);

      return nftContractNFTs;
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
    // TODO: Implement actual Seal decryption
    // When ready, this will use:
    // const seal = new Seal({ network: "testnet" });
    // const decryptedData = await seal.decrypt(encryptedData, {
    //   policyId,
    //   userAddress: this.userAddress,
    //   suiClient: this.suiClient,
    // });
    // return new Blob([decryptedData]);

    console.log("🔐 Seal decryption placeholder - returning raw data");
    console.log("Policy ID:", policyId);
    console.log("User address:", this.userAddress);

    // For now, games are not encrypted yet, so return raw data
    // This allows the download system to work while we prepare Seal integration
    await new Promise((resolve) => setTimeout(resolve, 500));
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
