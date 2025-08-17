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
      const userNFTId = await this.findUserNFTForGame(gameId, userAddress);

      if (!userNFTId) {
        return { hasAccess: false };
      }

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

      const hasAccess = await this.seal.verifyOwnership(
        gameId,
        userAddress,
        sessionKey,
        moveCallConstructor,
      );

      return {
        hasAccess,
        nftId: hasAccess ? userNFTId : undefined,
      };
    } catch (error) {
      console.error("❌ Ownership verification failed:", error);
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
      let allObjects: any[] = [];
      let cursor: string | null = null;
      let hasNextPage = true;

      // Fetch ALL owned objects with pagination
      while (hasNextPage) {
        const response: any = await this.suiClient.getOwnedObjects({
          owner: userAddress,
          cursor,
          limit: 50,
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
      }

      // Look for any NFT that references this game
      const matchingNFT = allObjects.find((obj: any) => {
        const content = obj.data?.content as any;
        if (!content || content.dataType !== "moveObject") return false;

        const isGameNFT = content.type?.includes("::GameNFT");
        if (!isGameNFT) return false;

        const fields = content.fields;
        const nftGameId = fields?.game_id;

        return nftGameId === gameId;
      });

      return matchingNFT?.data?.objectId || null;
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
