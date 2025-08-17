import { z } from "zod";

// Sui address pattern (0x followed by 64 hex characters)
const SuiAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid Sui address format");

// Sui object ID pattern (0x followed by hex characters, can be shorter than 64)
const SuiObjectIdSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]+$/, "Invalid Sui object ID format");

// Walrus blob ID pattern (base64-like string ending with specific patterns)
const WalrusBlobIdSchema = z.string().min(1, "Walrus blob ID cannot be empty");

// Base NFT ID structure as it appears in Sui responses
const NFTIdSchema = z.object({
  id: SuiObjectIdSchema,
});

// Core GameNFT schema matching the on-chain struct
export const GameNFTFieldsSchema = z.object({
  // Core game metadata
  game_id: SuiObjectIdSchema,
  title: z.string(),
  description: z.string(),
  genre: z.string(),

  // Financial data
  price: z.string(), // String because it comes as string from blockchain (MIST units)
  publisher: SuiAddressSchema,

  // File storage
  walrus_blob_id: WalrusBlobIdSchema, // QuiltPatchId for downloading game file
  cover_image_blob_id: WalrusBlobIdSchema.optional().or(z.literal("")), // QuiltPatchId for cover image

  // Timestamps (as strings from blockchain)
  publish_date: z.string(), // Epoch timestamp as string
  purchase_date: z.string(), // Epoch timestamp as string

  // NFT metadata
  id: NFTIdSchema,
  is_publisher_nft: z.boolean(), // true = publisher copy, false = buyer copy
});

// Full Sui object response schema for GameNFT
export const SuiGameNFTObjectSchema = z.object({
  data: z.object({
    objectId: SuiObjectIdSchema,
    version: z.string(),
    digest: z.string(),
    type: z.string(), // e.g., "0x123::game_store::GameNFT"
    content: z.object({
      dataType: z.literal("moveObject"),
      type: z.string(),
      hasPublicTransfer: z.boolean(),
      fields: GameNFTFieldsSchema,
    }),
  }),
});

// Frontend-friendly GameNFT interface (normalized from blockchain data)
export const GameNFTSchema = z.object({
  // NFT identifiers
  id: SuiObjectIdSchema, // The NFT object ID
  gameId: SuiObjectIdSchema, // The game this NFT represents

  // Game metadata
  title: z.string(),
  description: z.string(),
  genre: z.string(),

  // Financial data
  price: z.string(), // In MIST units as string
  publisher: SuiAddressSchema,

  // File storage (QuiltPatchIds for Walrus CDN)
  walrusBlobId: WalrusBlobIdSchema, // For downloading game file
  coverImageBlobId: WalrusBlobIdSchema.optional().or(z.literal("")), // For cover image display
  sealPolicyId: z.string().optional().or(z.literal("")), // For future Seal integration

  // Timestamps (normalized to strings or numbers as needed)
  publishDate: z.string(),
  mintDate: z.string(),

  // Ownership info (derived/computed)
  owners: z.array(SuiAddressSchema).optional(), // For compatibility
  currentOwner: SuiAddressSchema.optional(), // For compatibility (Sui handles this automatically)

  // NFT type flags
  isPublished: z.boolean().optional(), // true if this is a publisher NFT
});

// Type exports for use in components
export type GameNFTFields = z.infer<typeof GameNFTFieldsSchema>;
export type SuiGameNFTObject = z.infer<typeof SuiGameNFTObjectSchema>;
export type GameNFT = z.infer<typeof GameNFTSchema>;

// Helper schemas for specific use cases
export const WalrusImageUrlSchema = z.string().url().or(z.null());

// Parse and validate a Sui GameNFT object response
export function parseGameNFTFromSui(obj: unknown): GameNFT | null {
  try {
    // Validate the input matches expected Sui object structure
    const validatedObj = SuiGameNFTObjectSchema.parse(obj);
    const fields = validatedObj.data.content.fields;

    // Transform to frontend-friendly format
    const gameNFT: GameNFT = {
      id: validatedObj.data.objectId,
      gameId: fields.game_id,
      title: fields.title,
      description: fields.description,
      genre: fields.genre,
      price: fields.price,
      publisher: fields.publisher,
      walrusBlobId: fields.walrus_blob_id,
      coverImageBlobId: fields.cover_image_blob_id || "",
      sealPolicyId: "", // TODO: Add when Seal integration is ready
      publishDate: fields.publish_date,
      mintDate: fields.purchase_date,
      isPublished: fields.is_publisher_nft,
    };

    // Validate the transformed object
    return GameNFTSchema.parse(gameNFT);
  } catch (error) {
    console.error("Failed to parse GameNFT from Sui object:", error);
    console.error("Input object:", obj);
    return null;
  }
}

// Helper to get Walrus CDN URL for images
export function getWalrusImageUrl(blobId: string): string | null {
  if (!blobId || blobId.trim() === "") return null;

  try {
    // Validate blob ID format
    WalrusBlobIdSchema.parse(blobId);
    return `https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-quilt-patch-id/${blobId}`;
  } catch {
    return null;
  }
}

// Helper to format price from MIST to SUI
export function formatPriceToSui(priceInMist: string): string {
  try {
    const price = parseInt(priceInMist);
    return (price / 1000000000).toFixed(2) + " SUI";
  } catch {
    return "0.00 SUI";
  }
}

// Helper to format timestamp
export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString();
  } catch {
    return "Unknown";
  }
}

// Validation helpers
export const validateGameNFT = (data: unknown): data is GameNFT => {
  return GameNFTSchema.safeParse(data).success;
};

export const validateSuiGameNFTObject = (
  data: unknown,
): data is SuiGameNFTObject => {
  return SuiGameNFTObjectSchema.safeParse(data).success;
};
