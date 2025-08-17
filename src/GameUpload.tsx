import { useState } from "react";
import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { WalrusFile } from "@mysten/walrus";
import { walrusClient } from "./lib/walrus";
import { fileTypeFromBuffer } from "file-type";
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
  }>({
    step: "Ready to upload",
    progress: 0,
    isUploading: false,
  });

  const { mutate: signAndExecute, isPending: isTransactionPending } =
    useSignAndExecuteTransaction();

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

      // Use file-type library to validate and detect actual format
      const fileBuffer = await file.arrayBuffer();
      const fileType = await fileTypeFromBuffer(new Uint8Array(fileBuffer));
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

      // Use Uint8Array conversion like the working example
      const walrusFile = WalrusFile.from({
        contents: new Uint8Array(await file.arrayBuffer()),
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
        epochs: 5, // Store for 5 epochs (~30 days)
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
        step: "Step 1/4: Uploading game file to Walrus storage...",
        progress: 25,
        isUploading: true,
        details: "Preparing game file for upload",
      });

      // Upload game file to Walrus
      const gameExtension = getFileExtension(metadata.gameFile);
      console.log(
        `🎮 Game file: ${metadata.gameFile.name} (${metadata.gameFile.type}) -> ${gameExtension}`,
      );

      const gameUploadResult = await uploadToWalrus(
        metadata.gameFile,
        `${metadata.title}${gameExtension}`,
      );
      const gameWalrusId = gameUploadResult.patchId; // Use patchId for downloading
      const gameBlobId = gameUploadResult.blobId;
      const actualGameFileSize = gameUploadResult.actualSize;

      setUploadProgress({
        step: "Step 2/4: Uploading cover image to Walrus...",
        progress: 50,
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
        step: "Step 3/4: Registering game on Sui blockchain...",
        progress: 75,
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

      console.log(`📋 Uploading metadata to contract:`, {
        gameFile: {
          name: gameFileName,
          originalSize: metadata.gameFile.size,
          actualUploadedSize: actualGameFileSize,
          type: gameContentType,
          patchId: gameWalrusId, // QuiltPatchId for downloading
          blobId: gameBlobId, // Base blob ID
        },
        coverImage: {
          name: coverFileName,
          size: coverFileSize,
          type: coverContentType,
          patchId: coverImageWalrusId, // QuiltPatchId for downloading
        },
      });

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
          // Game file metadata
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(gameFileName)),
          ),
          tx.pure.u64(actualGameFileSize),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(gameContentType)),
          ),
          // Cover image metadata
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(coverFileName)),
          ),
          tx.pure.u64(coverFileSize),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(coverContentType)),
          ),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            setUploadProgress({
              step: "Step 4/4: Game published successfully to ColdCache!",
              progress: 100,
              isUploading: false,
              success: true,
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
              Supported: ZIP, RAR, 7Z, TAR, EXE, DMG files
            </Text>
            {metadata.gameFile && (
              <Text size="1" color="gray">
                Selected: {metadata.gameFile.name} (
                {(metadata.gameFile.size / 1024 / 1024).toFixed(1)} MB)
              </Text>
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
