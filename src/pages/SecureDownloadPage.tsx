import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import {
  Box,
  Card,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  Progress,
  Badge,
  Avatar,
} from "@radix-ui/themes";
import {
  useCurrentAccount,
  useSuiClientQuery,
  useSuiClient,
  ConnectButton,
  useSignPersonalMessage,
} from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { GameDownloadManager } from "../lib/gameDownload";

import { iglooTheme, iglooStyles } from "../theme";
import {
  GameNFT,
  parseGameNFTFromSui,
  getWalrusImageUrl,
  formatPriceToSui,
} from "../schemas/nft";

interface DownloadState {
  stage: "verifying" | "downloading" | "decrypting" | "complete" | "error";
  progress: number;
  message: string;
}

export function SecureDownloadPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const gameStorePackageId = useNetworkVariable("gameStorePackageId");
  const nftPackageId = useNetworkVariable("nftPackageId");
  const { mutate: signPersonalMessage } = useSignPersonalMessage();

  const [downloadState, setDownloadState] = useState<DownloadState | null>(
    null,
  );
  const [accessGranted, setAccessGranted] = useState<boolean>(false);
  const [accessChecked, setAccessChecked] = useState<boolean>(false);
  const [gameData, setGameData] = useState<GameNFT | null>(null);

  // Query for the specific game data to show what they're trying to download
  const { data: gameStoreNFTs, isPending: gameStorePending } =
    useSuiClientQuery(
      "getOwnedObjects",
      {
        owner: currentAccount?.address as string,
        filter: {
          StructType: `${gameStorePackageId}::game_store::GameNFT`,
        },
        options: {
          showContent: true,
          showType: true,
        },
      },
      {
        enabled: !!currentAccount?.address && !!gameStorePackageId,
      },
    );

  const { data: nftObjects, isPending: nftPending } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: currentAccount?.address as string,
      filter: {
        StructType: `${nftPackageId}::nft::GameNFT`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: !!currentAccount?.address && !!nftPackageId,
    },
  );

  // Verify access when wallet is connected and data is loaded
  useEffect(() => {
    if (!currentAccount?.address || !gameId || accessChecked) return;

    const verifyAccess = async () => {
      console.log("🔐 Verifying access for game ID:", gameId);
      console.log("👤 User address:", currentAccount.address);
      console.log("🎯 New URL scheme: Game ID based (not NFT ID based)");

      try {
        // Parse all owned NFTs
        const gameStoreNFTList =
          gameStoreNFTs?.data
            ?.map(parseGameNFTFromSui)
            .filter((nft): nft is GameNFT => nft !== null) || [];

        const nftList =
          nftObjects?.data
            ?.map(parseGameNFTFromSui)
            .filter((nft): nft is GameNFT => nft !== null) || [];

        console.log("🏪 GameStore NFTs:", gameStoreNFTList.length);
        console.log("🎫 NFT Contract NFTs:", nftList.length);

        // Debug: Log all owned NFTs for verification
        console.log(
          "🔍 DEBUG: All owned NFT IDs:",
          [...gameStoreNFTList, ...nftList].map((nft) => nft.id),
        );
        console.log("🔍 DEBUG: Looking for gameId:", gameId);

        // Find the specific game being requested
        let targetGame: GameNFT | null = null;
        let hasAccess = false;

        // Check if user owns an NFT for the requested game
        // The gameId parameter is now the underlying game ID (not NFT ID)
        for (const nft of [...gameStoreNFTList, ...nftList]) {
          console.log("🔍 DEBUG: Checking NFT:", {
            nftId: nft.id,
            nftGameId: nft.gameId,
            nftWalrusBlobId: nft.walrusBlobId,
            urlGameId: gameId,
            idMatch: nft.id === gameId,
            gameIdMatch: nft.gameId === gameId,
            walrusMatch: nft.walrusBlobId === gameId,
          });

          // PRIORITY MATCHING (Game ID based system):
          // 1. NFT's game_id matches the requested game (primary case)
          // 2. NFT ID matches (backward compatibility)
          // 3. Walrus blob ID matches (shared file access)
          if (
            nft.gameId === gameId || // Primary: game ownership
            nft.id === gameId || // Fallback: direct NFT ID
            nft.walrusBlobId === gameId // Fallback: shared file
          ) {
            targetGame = nft;
            hasAccess = true;
            console.log(
              "✅ Access granted via NFT:",
              nft.id,
              "for game:",
              gameId,
            );
            console.log("🎮 DEBUG: Found target game data:", targetGame);
            break;
          }
        }

        if (targetGame) {
          // If we found an NFT that grants access, we need to construct the game data for download
          // The user should download the actual game file, not the NFT metadata
          let gameDataForDownload = targetGame;

          // If this NFT has a game_id (meaning it's tied to a published game),
          // we should fetch the actual game data for the download
          if (targetGame.gameId && targetGame.gameId !== targetGame.id) {
            try {
              // Fetch the actual published game data
              const publishedGameResponse = await suiClient.getObject({
                id: targetGame.gameId,
                options: { showContent: true, showDisplay: true },
              });

              if (publishedGameResponse?.data?.content) {
                const gameContent = publishedGameResponse.data.content as any;
                const fields = gameContent.fields;

                // Construct the game data object for download
                gameDataForDownload = {
                  id: targetGame.gameId, // Use game ID as the primary identifier
                  gameId: targetGame.gameId,
                  title: fields.title || targetGame.title,
                  description: fields.description || targetGame.description,
                  genre: fields.genre || targetGame.genre,
                  price: fields.price || targetGame.price,
                  publisher: fields.publisher || targetGame.publisher,
                  walrusBlobId:
                    fields.walrus_blob_id || targetGame.walrusBlobId,
                  coverImageBlobId:
                    fields.cover_image_blob_id || targetGame.coverImageBlobId,
                  sealPolicyId: targetGame.sealPolicyId || "",
                  publishDate: fields.publish_date || targetGame.publishDate,
                  mintDate: fields.publish_date || targetGame.mintDate,
                  isPublished: true,
                };

                console.log(
                  "🎮 DEBUG: Constructed game data from published game:",
                  gameDataForDownload,
                );
              }
            } catch (error) {
              console.log(
                "⚠️ Could not fetch published game data, using NFT data:",
                error,
              );
              // Fall back to using NFT data directly
            }
          }

          setGameData(gameDataForDownload);
        }

        setAccessGranted(hasAccess);
        setAccessChecked(true);

        if (!hasAccess) {
          console.log("❌ Access denied - user does not own required NFT");
        }
      } catch (error) {
        console.error("❌ Access verification failed:", error);
        setAccessGranted(false);
        setAccessChecked(true);
      }
    };

    if (!gameStorePending && !nftPending) {
      verifyAccess();
    }
  }, [
    currentAccount,
    gameId,
    gameStoreNFTs,
    nftObjects,
    gameStorePending,
    nftPending,
    accessChecked,
  ]);

  const handleSecureDownload = async () => {
    if (!currentAccount?.address || !gameData) return;

    try {
      setDownloadState({
        stage: "verifying",
        progress: 10,
        message: "🔑 Creating secure session key...",
      });

      // Import Seal dependencies
      const { SessionKey } = await import("@mysten/seal");

      // Create session key for secure download
      const sessionKey = await SessionKey.create({
        address: currentAccount.address,
        packageId: gameStorePackageId,
        ttlMin: 10, // 10 minutes TTL
        suiClient: suiClient,
      });

      // Request user signature for session key
      await new Promise<void>((resolve, reject) => {
        signPersonalMessage(
          {
            message: sessionKey.getPersonalMessage(),
          },
          {
            onSuccess: async (result) => {
              try {
                await sessionKey.setPersonalMessageSignature(result.signature);
                console.log("✅ Session key signed successfully");
                resolve();
              } catch (error) {
                reject(error);
              }
            },
            onError: (error) => {
              reject(error);
            },
          },
        );
      });

      setDownloadState({
        stage: "downloading",
        progress: 30,
        message: "📦 Downloading encrypted game from Walrus...",
      });

      // Download and decrypt with enhanced GameDownloadManager
      const downloadManager = new GameDownloadManager(
        suiClient,
        currentAccount.address,
        sessionKey, // Pass session key for Seal operations
      );

      console.log("🎮 DEBUG: Initiating download with game data:", {
        id: gameData.id,
        gameId: gameData.gameId,
        title: gameData.title,
        walrusBlobId: gameData.walrusBlobId,
        isPublished: gameData.isPublished,
      });

      const gameBlob = await downloadManager.downloadGame(
        gameData,
        (progress) => {
          setDownloadState({
            stage: progress.stage,
            progress: progress.progress,
            message: progress.message,
          });
        },
      );

      // Trigger browser download
      const filename = gameData.title
        ? `${gameData.title.replace(/[^a-zA-Z0-9]/g, "_")}.zip`
        : "game.zip";

      GameDownloadManager.triggerDownload(gameBlob, filename);

      setDownloadState({
        stage: "complete",
        progress: 100,
        message: "🎉 Game downloaded and decrypted successfully!",
      });

      // Clear download state after success
      setTimeout(() => setDownloadState(null), 3000);
    } catch (error) {
      console.error("Secure download failed:", error);

      let errorMessage = "Download failed";
      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          errorMessage =
            "Download cancelled - signature required for secure access";
        } else if (error.message.includes("Access denied")) {
          errorMessage = "Access denied - NFT ownership verification failed";
        } else if (error.message.includes("Session key")) {
          errorMessage = "Failed to create secure session - please try again";
        } else {
          errorMessage = error.message;
        }
      }

      setDownloadState({
        stage: "error",
        progress: 0,
        message: errorMessage,
      });
    }
  };

  // Redirect if no gameId provided
  if (!gameId) {
    return <Navigate to="/" replace />;
  }

  // Show wallet connection requirement
  if (!currentAccount) {
    return (
      <Box style={{ padding: "24px" }}>
        <Card
          style={{
            ...iglooStyles.card,
            textAlign: "center",
            padding: "48px",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <Box
            style={{
              fontSize: "4rem",
              marginBottom: "24px",
              filter: "drop-shadow(0 4px 8px rgba(220, 38, 127, 0.3))",
            }}
          >
            🔐
          </Box>
          <Heading
            size="6"
            mb="4"
            style={{ color: iglooTheme.colors.primary[700] }}
          >
            Secure Download Access
          </Heading>
          <Text
            size="4"
            mb="6"
            style={{
              color: iglooTheme.colors.ice[600],
              lineHeight: "1.6",
            }}
          >
            This is a protected download link. You must connect your wallet and
            own the required NFT to access this game.
          </Text>

          <Box mb="4">
            <Badge size="2" color="red" style={{ marginBottom: "16px" }}>
              ⚠️ Authentication Required
            </Badge>
          </Box>

          <ConnectButton
            style={{
              background: iglooTheme.gradients.coolBlue,
              border: "none",
              borderRadius: iglooTheme.borderRadius.arch,
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "600",
            }}
          />

          <Text
            size="2"
            style={{
              color: iglooTheme.colors.ice[500],
              marginTop: "24px",
              display: "block",
            }}
          >
            Game ID: {gameId.substring(0, 12)}...
          </Text>
        </Card>
      </Box>
    );
  }

  // Show loading while checking access
  if (!accessChecked || gameStorePending || nftPending) {
    return (
      <Box style={{ padding: "24px" }}>
        <Card
          style={{
            ...iglooStyles.card,
            textAlign: "center",
            padding: "48px",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <Spinner size="3" style={{ marginBottom: "16px" }} />
          <Text size="4" style={{ color: iglooTheme.colors.ice[600] }}>
            Verifying your access permissions...
          </Text>
          <Text
            size="2"
            style={{ color: iglooTheme.colors.ice[500], marginTop: "8px" }}
          >
            Checking NFT ownership for secure download
          </Text>
        </Card>
      </Box>
    );
  }

  // Show access denied if user doesn't own the NFT
  if (!accessGranted) {
    return (
      <Box style={{ padding: "24px" }}>
        <Card
          style={{
            ...iglooStyles.card,
            textAlign: "center",
            padding: "48px",
            maxWidth: "600px",
            margin: "0 auto",
            border: `2px solid ${iglooTheme.colors.primary[400]}`,
          }}
        >
          <Box
            style={{
              fontSize: "4rem",
              marginBottom: "24px",
              filter: "drop-shadow(0 4px 8px rgba(220, 38, 127, 0.3))",
            }}
          >
            ❌
          </Box>
          <Heading
            size="6"
            mb="4"
            style={{ color: iglooTheme.colors.primary[700] }}
          >
            Access Denied
          </Heading>
          <Text
            size="4"
            mb="4"
            style={{
              color: iglooTheme.colors.ice[700],
              lineHeight: "1.6",
            }}
          >
            You don't own the required NFT to download this game.
          </Text>

          <Box
            style={{
              background: iglooTheme.gradients.iceBlue,
              padding: "16px",
              borderRadius: iglooTheme.borderRadius.arch,
              marginBottom: "24px",
            }}
          >
            <Text size="2" style={{ color: iglooTheme.colors.ice[600] }}>
              <strong>Connected Wallet:</strong>{" "}
              {currentAccount.address.substring(0, 12)}...
            </Text>
            <Text
              size="2"
              style={{
                color: iglooTheme.colors.ice[600],
                display: "block",
                marginTop: "4px",
              }}
            >
              <strong>Requested Game:</strong> {gameId.substring(0, 12)}...
            </Text>
          </Box>

          <Button
            size="3"
            onClick={() => (window.location.href = "/store")}
            style={{
              background: iglooTheme.gradients.coolBlue,
              border: "none",
              borderRadius: iglooTheme.borderRadius.arch,
              fontWeight: "600",
            }}
          >
            🛒 Browse Store to Purchase
          </Button>
        </Card>
      </Box>
    );
  }

  // Show secure download interface
  return (
    <Box style={{ padding: "24px" }}>
      <Card
        style={{
          ...iglooStyles.card,
          maxWidth: "700px",
          margin: "0 auto",
          background: iglooTheme.gradients.frostWhite,
          border: `2px solid ${iglooTheme.colors.primary[300]}`,
        }}
      >
        <Box p="6">
          <Flex align="center" mb="4">
            <Box
              style={{
                fontSize: "3rem",
                marginRight: "16px",
                filter: "drop-shadow(0 4px 8px rgba(34, 197, 94, 0.3))",
              }}
            >
              ✅
            </Box>
            <Box>
              <Heading
                size="6"
                style={{ color: iglooTheme.colors.primary[700] }}
              >
                Access Granted
              </Heading>
              <Badge size="2" color="green">
                🎫 NFT Verified
              </Badge>
            </Box>
          </Flex>

          {gameData && (
            <Box mb="6">
              <Flex align="center" mb="4">
                <Avatar
                  size="4"
                  src={
                    getWalrusImageUrl(gameData.coverImageBlobId || "") ||
                    undefined
                  }
                  fallback="🎮"
                  style={{
                    marginRight: "16px",
                    background: iglooTheme.gradients.iceBlue,
                  }}
                />
                <Box>
                  <Heading
                    size="5"
                    style={{ color: iglooTheme.colors.primary[700] }}
                  >
                    {gameData.title}
                  </Heading>
                  <Text size="3" style={{ color: iglooTheme.colors.ice[600] }}>
                    {gameData.description}
                  </Text>
                  <Flex gap="2" mt="2">
                    <Badge size="1" color="cyan">
                      {gameData.genre}
                    </Badge>
                    <Badge size="1" color="blue">
                      {formatPriceToSui(gameData.price)}
                    </Badge>
                  </Flex>
                </Box>
              </Flex>

              <Box
                style={{
                  background: iglooTheme.gradients.iceBlue,
                  padding: "16px",
                  borderRadius: iglooTheme.borderRadius.arch,
                  marginBottom: "24px",
                }}
              >
                <Text size="2" style={{ color: iglooTheme.colors.ice[600] }}>
                  <strong>Your NFT ID:</strong> {gameData.id.substring(0, 16)}
                  ...
                </Text>
                <Text
                  size="2"
                  style={{
                    color: iglooTheme.colors.ice[600],
                    display: "block",
                    marginTop: "4px",
                  }}
                >
                  <strong>Game ID:</strong> {gameData.gameId.substring(0, 16)}
                  ...
                </Text>
                <Text
                  size="2"
                  style={{
                    color: iglooTheme.colors.ice[600],
                    display: "block",
                    marginTop: "4px",
                  }}
                >
                  <strong>Walrus Blob:</strong>{" "}
                  {gameData.walrusBlobId.substring(0, 16)}...
                </Text>
              </Box>
            </Box>
          )}

          {downloadState ? (
            <Box>
              <Flex justify="between" align="center" mb="3">
                <Text size="3" style={{ color: iglooTheme.colors.ice[700] }}>
                  {downloadState.message}
                </Text>
                <Text size="2" style={{ color: iglooTheme.colors.ice[500] }}>
                  {downloadState.progress}%
                </Text>
              </Flex>
              <Progress value={downloadState.progress} size="3" />

              {downloadState.stage === "complete" && (
                <Text
                  size="2"
                  style={{
                    color: iglooTheme.colors.primary[600],
                    marginTop: "8px",
                    display: "block",
                    textAlign: "center",
                  }}
                >
                  🎉 Your game has been downloaded securely!
                </Text>
              )}

              {downloadState.stage === "error" && (
                <Text
                  size="2"
                  style={{
                    color: iglooTheme.colors.primary[800],
                    marginTop: "8px",
                    display: "block",
                    textAlign: "center",
                  }}
                >
                  ❌ {downloadState.message}
                </Text>
              )}
            </Box>
          ) : (
            <Button
              size="4"
              onClick={handleSecureDownload}
              style={{
                width: "100%",
                background: iglooTheme.gradients.coolBlue,
                border: "none",
                borderRadius: iglooTheme.borderRadius.arch,
                fontWeight: "600",
                padding: "16px",
              }}
            >
              🔐 Secure Download
            </Button>
          )}

          <Text
            size="1"
            style={{
              color: iglooTheme.colors.ice[500],
              textAlign: "center",
              marginTop: "16px",
              display: "block",
            }}
          >
            This download is secured by blockchain-verified NFT ownership
          </Text>
        </Box>
      </Card>
    </Box>
  );
}
