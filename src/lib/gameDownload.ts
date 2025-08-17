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
      // Query the specific NFT object to verify current ownership
      const nftObject = await this.suiClient.getObject({
        id: game.id,
        options: { showContent: true },
      });

      if (!nftObject.data?.content) {
        return false;
      }

      const fields = (nftObject.data.content as any).fields;
      return fields.current_owner === this.userAddress;
    } catch (error) {
      console.error("Ownership verification failed:", error);
      return false;
    }
  }

  private async downloadFromWalrus(blobId: string): Promise<ArrayBuffer> {
    // TODO: Implement actual Walrus download using Tusky SDK
    // For now, simulate the download
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // This would be replaced with actual Walrus API call:
    // const tusky = new Tusky({ apiKey: process.env.VITE_TUSKY_API_KEY });
    // return await tusky.file.arrayBuffer(blobId);

    throw new Error("Walrus integration not yet implemented");
  }

  private async decryptWithSeal(
    encryptedData: ArrayBuffer,
    policyId: string,
  ): Promise<Blob> {
    // TODO: Implement actual Seal decryption
    // For now, simulate the decryption
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // This would be replaced with actual Seal API call:
    // const seal = new Seal({ network: 'testnet' });
    // return await seal.decrypt(encryptedData, {
    //   policyId,
    //   userAddress: this.userAddress
    // });

    throw new Error("Seal integration not yet implemented");
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
