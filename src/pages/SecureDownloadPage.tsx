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
      console.log("🔐 Verifying backdoor access for game:", gameId);
      console.log("👤 User address:", currentAccount.address);

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

        // Find the specific game being requested
        let targetGame: GameNFT | null = null;
        let hasAccess = false;

        // Check if user owns the specific game NFT or has access through game ID
        for (const nft of [...gameStoreNFTList, ...nftList]) {
          // Match by exact NFT ID, game ID, or Walrus blob ID
          if (
            nft.id === gameId ||
            nft.gameId === gameId ||
            nft.walrusBlobId === gameId
          ) {
            targetGame = nft;
            hasAccess = true;
            console.log("✅ Access granted via NFT:", nft.id);
            break;
          }
        }

        if (targetGame) {
          setGameData(targetGame);
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
      const downloadManager = new GameDownloadManager(
        suiClient,
        currentAccount.address,
      );

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
        message: "Download complete!",
      });

      // Clear download state after success
      setTimeout(() => setDownloadState(null), 3000);
    } catch (error) {
      console.error("Secure download failed:", error);
      setDownloadState({
        stage: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Download failed",
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
