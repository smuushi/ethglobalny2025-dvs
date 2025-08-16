import { useState } from "react";
import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { WalrusClient, WalrusFile } from "@mysten/walrus";
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
  const suiClient = useSuiClient();

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
  }>({
    step: "Ready to upload",
    progress: 0,
    isUploading: false,
  });

  const { mutate: signAndExecute, isPending: isTransactionPending } =
    useSignAndExecuteTransaction();

  // Initialize Walrus client
  const walrusClient = new WalrusClient({
    network: "testnet",
    suiClient,
  });

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
  ): Promise<string> => {
    if (!currentAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log(
        `🚀 Starting Walrus upload: ${identifier} (${file.size} bytes)`,
      );

      // Convert file to Uint8Array
      const fileData = new Uint8Array(await file.arrayBuffer());

      // Create WalrusFile with metadata
      const walrusFile = WalrusFile.from({
        contents: fileData,
        identifier,
        tags: {
          "content-type": file.type || "application/octet-stream",
          "upload-source": "coldcache",
          "game-file": identifier.includes(".zip") ? "true" : "false",
          "cover-image": identifier.includes("_cover") ? "true" : "false",
        },
      });

      console.log(`📦 Created WalrusFile for ${identifier}`);

      // Use the browser-compatible flow for wallet signing
      const flow = walrusClient.writeFilesFlow({
        files: [walrusFile],
      });

      console.log(`🔄 Encoding file...`);
      await flow.encode();

      console.log(`📝 Creating register transaction...`);
      const registerTx = flow.register({
        epochs: 5, // Store for 5 epochs (~30 days)
        owner: currentAccount.address,
        deletable: false,
      });

      // Sign and execute the register transaction
      console.log(`✍️ Signing register transaction...`);
      const registerResult = await new Promise<any>((resolve, reject) => {
        signAndExecute(
          { transaction: registerTx },
          {
            onSuccess: (result) => {
              console.log(`✅ Register transaction successful:`, result.digest);
              resolve(result);
            },
            onError: (error) => {
              console.error(`❌ Register transaction failed:`, error);
              reject(error);
            },
          },
        );
      });

      // Upload the data to storage nodes
      console.log(`☁️ Uploading to Walrus storage nodes...`);
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

      const blobId = files[0].blobId;
      console.log(`🎉 Walrus upload complete! Blob ID: ${blobId}`);

      return blobId;
    } catch (error) {
      console.error(`💥 Walrus upload error for ${identifier}:`, error);
      throw new Error(
        `Failed to upload ${identifier}: ${error instanceof Error ? error.message : "Unknown error"}`,
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
      });

      // Upload game file to Walrus
      const gameWalrusId = await uploadToWalrus(
        metadata.gameFile,
        `${metadata.title}.zip`,
      );

      setUploadProgress({
        step: "Step 2/4: Uploading cover image to Walrus...",
        progress: 50,
        isUploading: true,
      });

      // Upload cover image to Walrus (or use placeholder)
      let coverImageWalrusId = "";
      if (metadata.coverImage) {
        coverImageWalrusId = await uploadToWalrus(
          metadata.coverImage,
          `${metadata.title}_cover.jpg`,
        );
      }

      setUploadProgress({
        step: "Step 3/4: Registering game on Sui blockchain...",
        progress: 75,
        isUploading: true,
      });

      // Register game on Sui blockchain
      const tx = new Transaction();

      tx.moveCall({
        target: `${gameStorePackageId}::game_store::publish_game`,
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
      setUploadProgress({
        step: "Upload failed",
        progress: 0,
        isUploading: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const isFormValid =
    metadata.title &&
    metadata.description &&
    metadata.gameFile &&
    metadata.price;

  return (
    <Card size="3" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <Flex direction="column" gap="4">
        <Heading size="6">Publish Your Game</Heading>

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
              Game File (ZIP) *
            </Text>
            <input
              type="file"
              accept=".zip,.rar,.7z"
              onChange={handleFileChange("gameFile")}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid var(--gray-7)",
                borderRadius: "6px",
                marginTop: "4px",
              }}
            />
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
              accept="image/*"
              onChange={handleFileChange("coverImage")}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid var(--gray-7)",
                borderRadius: "6px",
                marginTop: "4px",
              }}
            />
            {metadata.coverImage && (
              <Text size="1" color="gray">
                Selected: {metadata.coverImage.name}
              </Text>
            )}
          </Box>
        </Flex>

        {/* Upload Progress */}
        {(uploadProgress.isUploading ||
          uploadProgress.error ||
          uploadProgress.success) && (
          <Box>
            <Text size="2" weight="medium" mb="2">
              {uploadProgress.step}
            </Text>
            {uploadProgress.isUploading && (
              <Progress value={uploadProgress.progress} />
            )}
            {uploadProgress.error && (
              <Callout.Root color="red" size="1">
                <Callout.Text>{uploadProgress.error}</Callout.Text>
              </Callout.Root>
            )}
            {uploadProgress.success && (
              <Callout.Root color="green" size="1">
                <Callout.Text>
                  🎉 Your game has been published successfully!
                </Callout.Text>
              </Callout.Root>
            )}
          </Box>
        )}

        <Button
          size="3"
          onClick={handlePublishGame}
          disabled={
            !isFormValid || uploadProgress.isUploading || isTransactionPending
          }
        >
          {uploadProgress.isUploading || isTransactionPending ? (
            <Flex align="center" gap="2">
              <ClipLoader size={16} color="white" />
              Publishing...
            </Flex>
          ) : (
            "Publish Game"
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
