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

  constructor(
    suiClient: any,
    network: "testnet" | "mainnet",
    gameStorePackageId: string,
  ) {
    this.seal = new ColdCacheSeal(suiClient, { network });
    this.gameStorePackageId = gameStorePackageId;
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

      // Create a generic move call constructor
      // The actual NFT will be determined by what the user can access
      const moveCallConstructor: MoveCallConstructor = (tx, id) => {
        // This will be called with the Seal encryption ID
        // The Move contract will verify the user owns an NFT for this game
        tx.moveCall({
          target: `${this.gameStorePackageId}::game_store::seal_approve_game_access`,
          arguments: [
            tx.pure.vector("u8", Array.from(new TextEncoder().encode(id))),
            tx.object(gameId), // The game/NFT the user is trying to access
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
        nftId: hasAccess ? gameId : undefined, // If they have access, return the game ID
      };
    } catch (error) {
      console.error("❌ Seal ownership verification failed:", error);
      return { hasAccess: false };
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
