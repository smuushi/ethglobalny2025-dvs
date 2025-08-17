import { useState } from "react";
import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { WalrusFile } from "@mysten/walrus";
import { walrusClient } from "./lib/walrus";
import { fileTypeFromBuffer } from "file-type";
import { ColdCacheSeal } from "./lib/seal";
import {
  Button,
  Card,
  Flex,
  Text,
  TextField,
  TextArea,
  Box,
  Heading,
  Select,
  Progress,
  Callout,
} from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";
import { iglooTheme, iglooStyles } from "./theme";

// Maximum file size allowed by Walrus (13.3 GiB)
const MAX_FILE_SIZE = 13.3 * 1024 * 1024 * 1024; // 13.3 GiB in bytes

interface GameMetadata {
  title: string;
  description: string;
  price: string;
  genre: string;
  coverImage?: File;
  gameFile?: File;
}

export function GameUpload() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const gameStorePackageId = useNetworkVariable("gameStorePackageId");
  const gameStoreObjectId = useNetworkVariable("gameStoreObjectId");

  const [metadata, setMetadata] = useState<GameMetadata>({
    title: "",
    description: "",
    price: "0.1",
    genre: "action",
  });

  const [uploadProgress, setUploadProgress] = useState<{
    step: string;
    progress: number;
    isUploading: boolean;
    error?: string;
    success?: boolean;
    details?: string;
    retryAttempt?: number;
    walrusFlow?: any;
  }>({
    step: "Ready to upload",
    progress: 0,
    isUploading: false,
  });

  const { mutate: signAndExecute, isPending: isTransactionPending } =
    useSignAndExecuteTransaction();

  // Smart partial encryption for performance
  const encryptGameWithPartialSeal = async (
    gameFile: File,
    gameTitle: string,
  ): Promise<{
    encryptedChunk: File;
    unencryptedChunk: File;
    sealEncryptionId: string;
    chunkInfo: {
      encryptedSize: number;
      unencryptedSize: number;
      totalSize: number;
    };
  }> => {
    try {
      if (!currentAccount?.address || !gameStorePackageId) {
        throw new Error("Wallet not connected or package ID missing");
      }

      console.log("🔐 Starting partial encryption for:", gameTitle);

      const fileSizeMB = gameFile.size / 1024 / 1024;
      console.log(`📊 File size: ${fileSizeMB.toFixed(1)}MB`);

      // Determine encryption percentage based on file size
      let encryptionPercentage = 0.15; // 15% default
      if (gameFile.size > 500 * 1024 * 1024) encryptionPercentage = 0.1; // 10% for very large files
      if (gameFile.size > 1024 * 1024 * 1024) encryptionPercentage = 0.05; // 5% for huge files

      const encryptionChunkSize = Math.floor(
        gameFile.size * encryptionPercentage,
      );
      const minChunkSize = 1024 * 1024; // At least 1MB encrypted
      const finalEncryptionSize = Math.max(encryptionChunkSize, minChunkSize);

      console.log(`🔐 Encryption strategy:`, {
        totalSize: gameFile.size,
        encryptionPercentage: (encryptionPercentage * 100).toFixed(1) + "%",
        encryptedChunkSize: finalEncryptionSize,
        unencryptedChunkSize: gameFile.size - finalEncryptionSize,
        estimatedEncryptionTime: `~${Math.ceil(finalEncryptionSize / 1024 / 1024 / 5)} seconds`,
      });

      // Read only the portion we need to encrypt (critical file header + beginning)
      const encryptedChunkBuffer = await gameFile
        .slice(0, finalEncryptionSize)
        .arrayBuffer();
      const unencryptedChunkBuffer = await gameFile
        .slice(finalEncryptionSize)
        .arrayBuffer();

      console.log(
        `🔐 Encrypting critical chunk (${(finalEncryptionSize / 1024 / 1024).toFixed(1)}MB)...`,
      );

      // Initialize Seal service
      const seal = new ColdCacheSeal(suiClient);

      // Encrypt only the critical chunk
      const encryptedBytes = await seal.encryptGame(
        encryptedChunkBuffer,
        gameStorePackageId,
        gameStorePackageId,
      );

      // Create file chunks
      const encryptedChunk = new File(
        [new Uint8Array(encryptedBytes)],
        `${gameFile.name}.encrypted`,
        { type: "application/octet-stream" },
      );

      const unencryptedChunk = new File(
        [new Uint8Array(unencryptedChunkBuffer)],
        `${gameFile.name}.data`,
        { type: gameFile.type },
      );

      const sealEncryptionId = `partial_${gameStorePackageId}_${Date.now()}`;

      console.log("✅ Partial encryption complete:", {
        encryptedSize: encryptedChunk.size,
        unencryptedSize: unencryptedChunk.size,
        totalReconstructedSize: encryptedChunk.size + unencryptedChunk.size,
        sealId: sealEncryptionId,
      });

      return {
        encryptedChunk,
        unencryptedChunk,
        sealEncryptionId,
        chunkInfo: {
          encryptedSize: encryptedChunk.size,
          unencryptedSize: unencryptedChunk.size,
          totalSize: gameFile.size,
        },
      };
    } catch (error) {
      console.error("❌ Partial encryption failed:", error);
      throw new Error(
        `Failed to encrypt game: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  // Helper function to get the correct file extension based on MIME type
  const getFileExtension = (file: File): string => {
    const mimeType = file.type.toLowerCase();
    const filename = file.name.toLowerCase();
    console.log(
      `🔍 Detecting extension for "${file.name}" - MIME: ${mimeType}`,
    );

    // Image formats
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
      return ".jpg";
    } else if (mimeType.includes("png")) {
      return ".png";
    } else if (mimeType.includes("gif")) {
      return ".gif";
    } else if (mimeType.includes("webp")) {
      return ".webp";
    } else if (mimeType.includes("bmp")) {
      return ".bmp";
    } else if (mimeType.includes("svg")) {
      return ".svg";
    }
    // Archive formats (for game files)
    else if (mimeType.includes("zip") || mimeType.includes("application/zip")) {
      return ".zip";
    } else if (mimeType.includes("rar")) {
      return ".rar";
    } else if (mimeType.includes("7z")) {
      return ".7z";
    } else if (mimeType.includes("tar")) {
      return ".tar";
    }
    // Executable formats
    else if (
      mimeType.includes("application/x-msdownload") ||
      mimeType.includes("application/x-msdos-program")
    ) {
      return ".exe";
    } else if (mimeType.includes("application/x-apple-diskimage")) {
      return ".dmg";
    }
    // Fallback: try to get extension from filename
    else {
      // Extract extension from filename
      const lastDotIndex = filename.lastIndexOf(".");
      if (lastDotIndex > 0 && lastDotIndex < filename.length - 1) {
        const extension = filename.substring(lastDotIndex);
        console.log(`📁 Using extension from filename: ${extension}`);
        return extension;
      } else {
        console.log(
          `⚠️ Unknown file type "${mimeType}" and no extension in filename, defaulting to original name`,
        );
        return ""; // Keep original filename without adding extension
      }
    }
  };

  const handleFileChange =
    (field: "gameFile" | "coverImage") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Check file size constraint for game files
        if (field === "gameFile" && file.size > MAX_FILE_SIZE) {
          setUploadProgress((prev) => ({
            ...prev,
            error: `File too large. Maximum size allowed is 13.3 GiB. Your file is ${(file.size / 1024 / 1024 / 1024).toFixed(2)} GiB.`,
          }));
          // Clear the file input
          event.target.value = "";
          return;
        }

        // Clear any previous file size errors
        setUploadProgress((prev) => ({
          ...prev,
          error: prev.error?.includes("File too large")
            ? undefined
            : prev.error,
        }));

        setMetadata((prev) => ({ ...prev, [field]: file }));
      }
    };

  const handleMetadataChange =
    (field: keyof GameMetadata) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setMetadata((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const uploadToWalrus = async (
    file: File,
    identifier: string,
    retryCount: number = 0,
  ): Promise<{ blobId: string; patchId: string; actualSize: number }> => {
    if (!currentAccount) {
      throw new Error("Wallet not connected");
    }

    const maxRetries = 3;
    const isRetry = retryCount > 0;

    try {
      console.log(
        `🚀 ${isRetry ? `[Retry ${retryCount}/${maxRetries}] ` : ""}Starting Walrus upload: ${identifier} (${file.size} bytes)`,
      );

      // Use File directly as Blob - no conversion needed to avoid corruption
      console.log(`🔬 File integrity check:`, {
        identifier,
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name,
        lastModified: file.lastModified,
      });

      // Memory-efficient file type detection
      let fileType = null;
      if (file.size < 30 * 1024 * 1024) {
        // Only for files < 30MB
        const fileBuffer = await file.arrayBuffer();
        fileType = await fileTypeFromBuffer(new Uint8Array(fileBuffer));
      }
      console.log(`🔍 Detected file type for upload:`, {
        identifier,
        fileType,
        originalType: file.type,
        size: file.size,
      });

      let actualMimeType = file.type || "application/octet-stream";
      if (fileType) {
        actualMimeType = fileType.mime;
        console.log(
          `📁 Using detected MIME type: ${actualMimeType} (was: ${file.type})`,
        );
      }

      // Validate file type is appropriate
      if (identifier.includes("_cover")) {
        // Cover image validation
        if (fileType && !fileType.mime.startsWith("image/")) {
          throw new Error(
            `❌ Cover image must be an image file. Detected: ${fileType.mime}`,
          );
        }
      } else {
        // Game file validation - warn about unusual formats
        const gameFileFormats = [
          "application/zip",
          "application/x-rar-compressed",
          "application/x-7z-compressed",
          "application/x-tar",
          "application/gzip",
          "application/x-bzip2",
          "application/x-msdownload", // .exe
          "application/x-apple-diskimage", // .dmg
        ];

        if (fileType && !gameFileFormats.includes(fileType.mime)) {
          console.log(
            `⚠️ Unusual game file format: ${fileType.mime}. Continuing upload but verify this is correct.`,
          );
        }
      }

      // Memory-efficient WalrusFile creation
      console.log(
        `📦 Creating WalrusFile for ${file.name} without loading full file into memory`,
      );
      const walrusFile = WalrusFile.from({
        contents: file, // Pass File directly instead of loading into memory
        identifier: file.name,
        tags: {
          contentType: file.type,
        },
      });

      console.log(`📦 Created minimal WalrusFile for ${file.name}`, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      // Use writeFilesFlow for browser wallet compatibility
      console.log(`🔄 Starting Walrus upload flow...`);
      const uploadStart = Date.now();

      const flow = walrusClient.writeFilesFlow({
        files: [walrusFile],
      });

      console.log(`📁 Encoding file for upload...`);
      console.log(`🔬 Before encoding - original file size: ${file.size}`);
      await flow.encode();
      console.log(`✅ Encoding completed - checking for any changes...`);

      console.log(`📝 Creating register transaction...`);
      const registerTx = flow.register({
        epochs: 2, // Store for 2 epoch (~12 days) // for demo with limited testnet funds
        owner: currentAccount.address,
        deletable: false,
      });

      // Sign and execute the register transaction FIRST to reserve space
      console.log(`✍️ Signing register transaction to reserve space...`);
      const registerResult = await new Promise<any>((resolve, reject) => {
        signAndExecute(
          { transaction: registerTx },
          {
            onSuccess: (result) => {
              console.log(`✅ Space registered successfully:`, result.digest);
              resolve(result);
            },
            onError: (error) => {
              console.error(`❌ Space registration failed:`, error);
              reject(error);
            },
          },
        );
      });

      // Now upload the data to storage nodes using the registered digest
      console.log(`☁️ Uploading file data to Walrus storage nodes...`);
      console.log(`🔗 Using registered digest: ${registerResult.digest}`);
      await flow.upload({
        digest: registerResult.digest,
      });

      // Create and execute the certify transaction
      console.log(`📋 Creating certify transaction...`);
      const certifyTx = flow.certify();

      await new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: certifyTx },
          {
            onSuccess: (result) => {
              console.log(`✅ Certify transaction successful:`, result.digest);
              resolve(result);
            },
            onError: (error) => {
              console.error(`❌ Certify transaction failed:`, error);
              reject(error);
            },
          },
        );
      });

      // Get the final blob ID
      const files = await flow.listFiles();
      if (files.length === 0) {
        throw new Error("No files were uploaded successfully");
      }

      console.log(`🔍 Files uploaded:`, files);

      const uploadedFile = files[0];
      const blobId = uploadedFile.blobId;
      const patchId = uploadedFile.id; // This is the QuiltPatchId we need for downloading

      console.log(`✅ Upload completed in ${Date.now() - uploadStart}ms`, {
        blobId,
        patchId,
        identifier,
        retryCount,
      });
      console.log(`🎉 Walrus upload complete!`, {
        blobId,
        patchId,
        identifier,
        retryCount,
        fileSize: file.size,
      });

      return { blobId, patchId, actualSize: file.size };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`💥 Walrus upload error for ${identifier}:`, {
        error: errorMessage,
        retryCount,
        identifier,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Check if this is a retryable error and we haven't exceeded max retries
      const isRetryableError =
        errorMessage.includes("400") ||
        errorMessage.includes("Bad Request") ||
        errorMessage.includes("network") ||
        errorMessage.includes("timeout");

      if (isRetryableError && retryCount < maxRetries) {
        console.log(
          `🔄 Retrying upload for ${identifier} (attempt ${retryCount + 1}/${maxRetries + 1})`,
        );
        // Wait a bit before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1)),
        );
        return uploadToWalrus(file, identifier, retryCount + 1);
      }

      throw new Error(
        `Failed to upload ${identifier} after ${retryCount + 1} attempts: ${errorMessage}`,
      );
    }
  };

  const handlePublishGame = async () => {
    if (!currentAccount) {
      setUploadProgress({
        step: "Error: Please connect your wallet",
        progress: 0,
        isUploading: false,
        error: "Wallet not connected",
      });
      return;
    }

    if (!metadata.gameFile) {
      setUploadProgress({
        step: "Error: Please select a game file",
        progress: 0,
        isUploading: false,
        error: "Game file is required",
      });
      return;
    }

    try {
      setUploadProgress({
        step: "Step 1/5: Encrypting game with Seal...",
        progress: 20,
        isUploading: true,
        details: "Encrypting game file for NFT-gated access",
      });

      // Use smart partial encryption for performance
      let usePartialEncryption = metadata.gameFile.size > 30 * 1024 * 1024; // Use for files > 30MB
      let encryptionResult: any = null;
      let sealEncryptionId = "";

      if (usePartialEncryption) {
        try {
          console.log(
            "🚀 Using PARTIAL encryption for performance optimization",
          );
          encryptionResult = await encryptGameWithPartialSeal(
            metadata.gameFile,
            metadata.title,
          );
          sealEncryptionId = encryptionResult.sealEncryptionId;
          console.log(
            "✅ Partial encryption complete:",
            encryptionResult.chunkInfo,
          );
        } catch (error) {
          console.warn(
            "⚠️ Partial encryption failed, falling back to no encryption:",
            error,
          );
          usePartialEncryption = false;
        }
      }

      if (!usePartialEncryption) {
        console.log("🔓 Using standard upload (no encryption) for this file");
      }

      let gameWalrusId = "";
      let gameBlobId = "";
      let gameDataWalrusId = "";
      let actualGameFileSize = metadata.gameFile.size;

      if (usePartialEncryption && encryptionResult) {
        // Upload encrypted chunk first
        setUploadProgress({
          step: "Step 2a/6: Uploading encrypted chunk to Walrus...",
          progress: 30,
          isUploading: true,
          details: `Uploading critical encrypted portion (${(encryptionResult.chunkInfo.encryptedSize / 1024 / 1024).toFixed(1)}MB)`,
        });

        const encryptedUploadResult = await uploadToWalrus(
          encryptionResult.encryptedChunk,
          `${metadata.title}.encrypted`,
        );
        gameWalrusId = encryptedUploadResult.patchId;
        gameBlobId = encryptedUploadResult.blobId;

        // Upload unencrypted chunk second
        setUploadProgress({
          step: "Step 2b/6: Uploading data chunk to Walrus...",
          progress: 45,
          isUploading: true,
          details: `Uploading remaining data (${(encryptionResult.chunkInfo.unencryptedSize / 1024 / 1024).toFixed(1)}MB)`,
        });

        const dataUploadResult = await uploadToWalrus(
          encryptionResult.unencryptedChunk,
          `${metadata.title}.data`,
        );
        gameDataWalrusId = dataUploadResult.patchId;

        console.log("🎯 Dual-blob upload complete:", {
          encryptedBlobId: gameWalrusId,
          dataBlobId: gameDataWalrusId,
          totalSize: encryptionResult.chunkInfo.totalSize,
        });
      } else {
        // Standard single-file upload for smaller files
        setUploadProgress({
          step: "Step 2/5: Uploading game file to Walrus storage...",
          progress: 35,
          isUploading: true,
          details: "Uploading complete game file",
        });

        const gameExtension = getFileExtension(metadata.gameFile);
        const gameUploadResult = await uploadToWalrus(
          metadata.gameFile,
          `${metadata.title}${gameExtension}`,
        );
        gameWalrusId = gameUploadResult.patchId;
        gameBlobId = gameUploadResult.blobId;
        actualGameFileSize = gameUploadResult.actualSize;
      }

      setUploadProgress({
        step: "Step 3/5: Uploading cover image to Walrus...",
        progress: 55,
        isUploading: true,
        details: metadata.coverImage
          ? "Uploading cover image"
          : "Skipping cover image",
      });

      // Upload cover image to Walrus (or use placeholder)
      let coverImageWalrusId = "";
      if (metadata.coverImage) {
        // PRESERVE ORIGINAL FORMAT: Use actual file extension for proper format preservation
        const coverExtension = getFileExtension(metadata.coverImage);
        console.log(
          `📸 Cover image: ${metadata.coverImage.name} (${metadata.coverImage.type}) -> ${coverExtension}`,
        );

        const coverUploadResult = await uploadToWalrus(
          metadata.coverImage,
          `${metadata.title}_cover${coverExtension}`,
        );
        coverImageWalrusId = coverUploadResult.patchId; // Use patchId for downloading
      }

      setUploadProgress({
        step: "Step 4/5: Registering game on Sui blockchain...",
        progress: 80,
        isUploading: true,
      });

      // Register game on Sui blockchain with metadata
      const tx = new Transaction();

      // Prepare metadata for the contract
      const gameFileName = metadata.gameFile.name;
      const gameContentType =
        metadata.gameFile.type || "application/octet-stream";

      const coverFileName = metadata.coverImage?.name || "";
      const coverFileSize = metadata.coverImage?.size || 0;
      const coverContentType = metadata.coverImage?.type || "image/jpeg";

      // Prepare enhanced metadata for dual-blob approach
      const enhancedGameMetadata = {
        gameFile: {
          name: gameFileName,
          originalSize: metadata.gameFile.size,
          actualUploadedSize: actualGameFileSize,
          type: gameContentType,
          patchId: gameWalrusId, // Primary blob (encrypted chunk or full file)
          blobId: gameBlobId,
          // Dual-blob specific fields
          isPartiallyEncrypted: usePartialEncryption,
          dataBlobId: gameDataWalrusId || "", // Secondary blob for unencrypted chunk
          encryptionInfo: encryptionResult
            ? {
                encryptedSize: encryptionResult.chunkInfo.encryptedSize,
                unencryptedSize: encryptionResult.chunkInfo.unencryptedSize,
                encryptionPercentage: (
                  (encryptionResult.chunkInfo.encryptedSize /
                    encryptionResult.chunkInfo.totalSize) *
                  100
                ).toFixed(1),
              }
            : null,
        },
        coverImage: {
          name: coverFileName,
          size: coverFileSize,
          type: coverContentType,
          patchId: coverImageWalrusId,
        },
      };

      console.log(`📋 Enhanced metadata for contract:`, enhancedGameMetadata);

      tx.moveCall({
        target: `${gameStorePackageId}::game_store::publish_game_entry`,
        arguments: [
          tx.object(gameStoreObjectId), // GameStore shared object ID
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(metadata.title)),
          ),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(metadata.description)),
          ),
          tx.pure.u64(Math.floor(parseFloat(metadata.price) * 1000000000)), // Convert SUI to MIST
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(gameWalrusId)),
          ),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(coverImageWalrusId)),
          ),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(metadata.genre)),
          ),
          // Enhanced metadata with dual-blob support
          tx.pure.vector(
            "u8",
            Array.from(
              new TextEncoder().encode(JSON.stringify(enhancedGameMetadata)),
            ),
          ),
          // Secondary blob ID for partial encryption
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(gameDataWalrusId)),
          ),
          // Encryption ID
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(sealEncryptionId)),
          ),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            const encryptionPercentage = encryptionResult
              ? (
                  (encryptionResult.chunkInfo.encryptedSize /
                    encryptionResult.chunkInfo.totalSize) *
                  100
                ).toFixed(1)
              : "0";

            const successMessage = usePartialEncryption
              ? `🚀 SUCCESS: Game published with PARTIAL encryption optimization! Only ${encryptionPercentage}% of your file was encrypted for maximum performance. Your game is split across ${gameDataWalrusId ? "2 secure blobs" : "1 blob"} and only NFT owners can reconstruct and access it!`
              : `🔓 SUCCESS: Game published with NFT minted! Check your Library to download your game.`;

            setUploadProgress({
              step: "Game published successfully to ColdCache!",
              progress: 100,
              isUploading: false,
              success: true,
              details: successMessage,
            });

            // Reset form
            setMetadata({
              title: "",
              description: "",
              price: "0.1",
              genre: "action",
            });
          },
          onError: (error) => {
            setUploadProgress({
              step: "Failed to register game on blockchain",
              progress: 75,
              isUploading: false,
              error: error.message,
            });
          },
        },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("🚨 Game upload failed:", error);

      // Provide more user-friendly error messages
      let userFriendlyMessage = errorMessage;
      if (
        errorMessage.includes("400") ||
        errorMessage.includes("Bad Request")
      ) {
        userFriendlyMessage =
          "Storage nodes are having issues. This is usually temporary - please try again in a few minutes.";
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("timeout")
      ) {
        userFriendlyMessage =
          "Network connection issue. Please check your internet and try again.";
      } else if (errorMessage.includes("Wallet not connected")) {
        userFriendlyMessage = "Please connect your wallet and try again.";
      } else if (errorMessage.includes("rejected")) {
        userFriendlyMessage =
          "Transaction was rejected. Please try again and approve the transaction.";
      }

      setUploadProgress({
        step: "Upload failed",
        progress: 0,
        isUploading: false,
        error: userFriendlyMessage,
        details: `Technical details: ${errorMessage}`,
      });
    }
  };

  const isFormValid =
    metadata.title &&
    metadata.description &&
    metadata.gameFile &&
    metadata.price;

  return (
    <Card
      size="3"
      style={{
        ...iglooStyles.card,
        maxWidth: "600px",
        margin: "0 auto",
        background: iglooTheme.gradients.frostWhite,
      }}
    >
      <Flex direction="column" gap="4">
        <Flex align="center" gap="3">
          <Box
            style={{
              fontSize: "2rem",
              filter: "drop-shadow(0 2px 4px rgba(14, 165, 233, 0.3))",
            }}
          >
            📤
          </Box>
          <Heading
            size="6"
            style={{
              color: iglooTheme.colors.primary[700],
              textShadow: "0 1px 2px rgba(14, 165, 233, 0.1)",
            }}
          >
            Publish Your Game
          </Heading>
        </Flex>

        <Flex direction="column" gap="3">
          <Box>
            <Text as="label" size="2" weight="bold">
              Game Title *
            </Text>
            <TextField.Root
              placeholder="Enter your game title"
              value={metadata.title}
              onChange={handleMetadataChange("title")}
            />
          </Box>

          <Box>
            <Text as="label" size="2" weight="bold">
              Description *
            </Text>
            <TextArea
              placeholder="Describe your game..."
              value={metadata.description}
              onChange={handleMetadataChange("description")}
              rows={4}
            />
          </Box>

          <Flex gap="3">
            <Box style={{ flex: 1 }}>
              <Text as="label" size="2" weight="bold">
                Price (SUI) *
              </Text>
              <TextField.Root
                type="number"
                step="0.01"
                min="0"
                placeholder="0.1"
                value={metadata.price}
                onChange={handleMetadataChange("price")}
              />
            </Box>

            <Box style={{ flex: 1 }}>
              <Text as="label" size="2" weight="bold">
                Genre
              </Text>
              <Select.Root
                value={metadata.genre}
                onValueChange={(value) =>
                  setMetadata((prev) => ({ ...prev, genre: value }))
                }
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="action">Action</Select.Item>
                  <Select.Item value="adventure">Adventure</Select.Item>
                  <Select.Item value="puzzle">Puzzle</Select.Item>
                  <Select.Item value="strategy">Strategy</Select.Item>
                  <Select.Item value="rpg">RPG</Select.Item>
                  <Select.Item value="simulation">Simulation</Select.Item>
                  <Select.Item value="arcade">Arcade</Select.Item>
                  <Select.Item value="indie">Indie</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>
          </Flex>

          <Box>
            <Text as="label" size="2" weight="bold">
              Game File *
            </Text>
            <input
              type="file"
              accept=".zip,.rar,.7z,.tar,.exe,.dmg"
              onChange={handleFileChange("gameFile")}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid var(--gray-7)",
                borderRadius: "6px",
                marginTop: "4px",
              }}
              required
            />
            <Text size="1" color="gray">
              Supported: ZIP, RAR, 7Z, TAR, EXE, DMG files (Max size: 13.3 GiB)
            </Text>
            {metadata.gameFile && (
              <>
                <Text size="1" color="gray">
                  Selected: {metadata.gameFile.name} (
                  {(metadata.gameFile.size / 1024 / 1024).toFixed(1)} MB)
                </Text>
                {metadata.gameFile.size > 30 * 1024 * 1024 && (
                  <Text
                    size="1"
                    color="blue"
                    style={{
                      marginTop: "4px",
                      display: "block",
                      fontWeight: "500",
                      background: "#e3f2fd",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid #bbdefb",
                    }}
                  >
                    ⚡ Large file: Will use PARTIAL encryption for fast upload
                    (only ~
                    {metadata.gameFile.size > 1024 * 1024 * 1024
                      ? "5"
                      : metadata.gameFile.size > 500 * 1024 * 1024
                        ? "10"
                        : "15"}
                    % encrypted)
                  </Text>
                )}
              </>
            )}
          </Box>

          <Box>
            <Text as="label" size="2" weight="bold">
              Cover Image (Optional)
            </Text>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileChange("coverImage")}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid var(--gray-7)",
                borderRadius: "6px",
                marginTop: "4px",
              }}
            />
            <Text size="1" color="gray">
              Supported: JPG, PNG, GIF, WebP images
            </Text>
            {metadata.coverImage && (
              <Text size="1" color="gray">
                Selected: {metadata.coverImage.name} (
                {(metadata.coverImage.size / 1024).toFixed(1)} KB)
              </Text>
            )}
          </Box>
        </Flex>

        {/* Upload Progress */}
        {(uploadProgress.isUploading ||
          uploadProgress.error ||
          uploadProgress.success) && (
          <Box>
            <Flex direction="column" gap="2">
              <Text size="2" weight="medium">
                {uploadProgress.step}
                {uploadProgress.retryAttempt && (
                  <Text size="1" color="gray" ml="2">
                    (Retry attempt {uploadProgress.retryAttempt})
                  </Text>
                )}
              </Text>

              {uploadProgress.details && (
                <Text size="1" color="gray">
                  {uploadProgress.details}
                </Text>
              )}

              {uploadProgress.isUploading && (
                <Progress value={uploadProgress.progress} />
              )}

              {uploadProgress.error && (
                <Callout.Root color="red" size="1">
                  <Callout.Text>{uploadProgress.error}</Callout.Text>
                  {uploadProgress.details &&
                    uploadProgress.details.startsWith("Technical") && (
                      <Text
                        size="1"
                        color="gray"
                        mt="1"
                        style={{ fontFamily: "monospace", fontSize: "11px" }}
                      >
                        {uploadProgress.details}
                      </Text>
                    )}
                </Callout.Root>
              )}

              {uploadProgress.success && (
                <Callout.Root color="green" size="1">
                  <Callout.Text>
                    🎉 Your game has been published successfully!
                  </Callout.Text>
                </Callout.Root>
              )}
            </Flex>
          </Box>
        )}

        <Button
          size="3"
          onClick={handlePublishGame}
          disabled={
            !isFormValid || uploadProgress.isUploading || isTransactionPending
          }
          style={{
            ...iglooStyles.button.primary,
            width: "100%",
            marginTop: "16px",
          }}
        >
          {uploadProgress.isUploading || isTransactionPending ? (
            <Flex align="center" gap="2">
              <ClipLoader size={16} color="white" />
              Publishing...
            </Flex>
          ) : (
            "❄️ Publish Game"
          )}
        </Button>

        <Text size="1" color="gray">
          * Your game will be uploaded to decentralized Walrus storage and
          registered as an NFT on Sui blockchain. This process involves multiple
          wallet signatures for secure storage.
        </Text>
      </Flex>
    </Card>
  );
}
