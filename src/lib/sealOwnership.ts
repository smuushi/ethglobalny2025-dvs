// Simple Seal-based ownership verification
// No complex frontend logic - let Seal and the smart contract handle it

import { ColdCacheSeal, MoveCallConstructor } from "./seal";
import { SessionKey } from "@mysten/seal";
import { GameNFT } from "../schemas/nft";

/**
 * Simplified ownership verification using ONLY Seal
 * If Seal can decrypt the file, the user owns it. Simple.
 */
export class SealOwnershipVerifier {
  private seal: ColdCacheSeal;
  private gameStorePackageId: string;
  private suiClient: any;

  constructor(
    suiClient: any,
    network: "testnet" | "mainnet",
    gameStorePackageId: string,
  ) {
    this.seal = new ColdCacheSeal(suiClient, { network });
    this.gameStorePackageId = gameStorePackageId;
    this.suiClient = suiClient;
  }

  /**
   * The simplest possible ownership check: Can the user decrypt the file?
   * If yes = they own it. If no = they don't own it.
   * No frontend string matching required!
   */
  async verifyOwnership(
    gameId: string,
    userAddress: string,
    sessionKey: SessionKey,
  ): Promise<{ hasAccess: boolean; nftId?: string }> {
    try {
      console.log("🔐 Seal-only ownership verification");
      console.log("🎮 Game ID:", gameId);
      console.log("👤 User:", userAddress);

      // First, we need to find the user's NFT that grants access to this game
      // This is the key fix - we need the NFT ID, not the game ID
      const userNFTId = await this.findUserNFTForGame(gameId, userAddress);

      if (!userNFTId) {
        console.log("❌ No NFT found for this game");
        return { hasAccess: false };
      }

      console.log("🎫 Found user's NFT:", userNFTId);

      // Create the move call constructor with the actual NFT ID
      const moveCallConstructor: MoveCallConstructor = (tx, id) => {
        // This will be called with the Seal encryption ID
        // The Move contract will verify the user owns this specific NFT
        tx.moveCall({
          target: `${this.gameStorePackageId}::game_store::seal_approve_game_access`,
          arguments: [
            tx.pure.vector("u8", Array.from(new TextEncoder().encode(id))),
            tx.object(userNFTId), // Use the user's actual NFT ID
          ],
        });
      };

      // Try to verify using Seal - if this succeeds, user has access
      const hasAccess = await this.seal.verifyOwnership(
        gameId,
        userAddress,
        sessionKey,
        moveCallConstructor,
      );

      console.log("🎯 Seal verification result:", hasAccess);

      return {
        hasAccess,
        nftId: hasAccess ? userNFTId : undefined,
      };
    } catch (error) {
      console.error("❌ Seal ownership verification failed:", error);
      return { hasAccess: false };
    }
  }

  /**
   * Find the user's NFT that grants access to the specified game
   */
  private async findUserNFTForGame(
    gameId: string,
    userAddress: string,
  ): Promise<string | null> {
    try {
      console.log("🔍 Getting ALL owned objects for user:", userAddress);
      console.log("🔍 Looking for game ID:", gameId);

      let allObjects: any[] = [];
      let cursor: string | null = null;
      let hasNextPage = true;

      // Fetch ALL owned objects with pagination
      while (hasNextPage) {
        const response: any = await this.suiClient.getOwnedObjects({
          owner: userAddress,
          cursor,
          limit: 50, // Max per page
          options: {
            showContent: true,
            showType: true,
          },
        });

        if (response.data) {
          allObjects.push(...response.data);
        }

        cursor = response.nextCursor;
        hasNextPage = response.hasNextPage || false;

        console.log(
          `📄 Fetched page: ${allObjects.length} total objects so far, hasNextPage: ${hasNextPage}`,
        );
      }

      console.log(`🎯 Total objects fetched: ${allObjects.length}`);

      // Look for any NFT that references this game
      const matchingNFT = allObjects.find((obj: any) => {
        const content = obj.data?.content as any;
        if (!content || content.dataType !== "moveObject") return false;

        // Check if this is a GameNFT
        const isGameNFT = content.type?.includes("::GameNFT");
        if (!isGameNFT) return false;

        const fields = content.fields;
        const nftGameId = fields?.game_id;

        console.log(
          `🔍 Checking NFT: ${obj.data?.objectId}, game_id: ${nftGameId}, target: ${gameId}`,
        );

        // Check if this NFT references the game we want to download
        return nftGameId === gameId;
      });

      if (matchingNFT) {
        console.log(
          "✅ Found matching NFT for game:",
          matchingNFT.data?.objectId,
        );
        return matchingNFT.data?.objectId || null;
      }

      console.log("❌ No matching NFT found after checking all objects");
      return null;
    } catch (error) {
      console.error("❌ Failed to find user NFT for game:", error);
      return null;
    }
  }

  /**
   * Get the actual game data after verifying ownership
   */
  async getGameData(gameId: string, suiClient: any): Promise<GameNFT | null> {
    try {
      const gameResponse = await suiClient.getObject({
        id: gameId,
        options: { showContent: true, showDisplay: true },
      });

      if (!gameResponse?.data?.content) {
        return null;
      }

      const gameContent = gameResponse.data.content as any;
      const fields = gameContent.fields;

      return {
        id: gameId,
        gameId: gameId,
        title: fields.title,
        description: fields.description,
        genre: fields.genre,
        price: fields.price,
        publisher: fields.publisher,
        walrusBlobId: fields.walrus_blob_id,
        coverImageBlobId: fields.cover_image_blob_id,
        sealPolicyId: "",
        publishDate: fields.publish_date,
        mintDate: fields.publish_date,
        isPublished: true,
      };
    } catch (error) {
      console.error("❌ Failed to fetch game data:", error);
      return null;
    }
  }
}
