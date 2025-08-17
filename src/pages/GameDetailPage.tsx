import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useSuiClientQuery,
  useCurrentAccount,
  useSuiClient,
} from "@mysten/dapp-kit";
import {
  Box,
  Card,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  Badge,
  Avatar,
  Skeleton,
  Dialog,
} from "@radix-ui/themes";
import { useNetworkVariable } from "../networkConfig";
import { iglooTheme, iglooStyles } from "../theme";
import { GameDownloadManager } from "../lib/gameDownload";

interface Game {
  id: string;
  title: string;
  description: string;
  price: number;
  publisher: string;
  walrus_blob_id: string;
  cover_image_blob_id: string;
  genre: string;
  publish_date: number;
  is_active: boolean;
  total_sales: number;
}

interface PurchaseModalProps {
  game: Game;
  isOpen: boolean;
  onClose: () => void;
}

function PurchaseModal({ game, isOpen, onClose }: PurchaseModalProps) {
  const [step, setStep] = useState<"amount" | "confirm" | "status">("amount");
  const [amount, setAmount] = useState(game.price);
  const [status, setStatus] = useState<"pending" | "success" | "error">(
    "pending",
  );

  const formatPrice = (priceInMist: number) => {
    return (priceInMist / 1000000000).toFixed(2);
  };

  const handlePurchase = async () => {
    setStep("status");
    setStatus("pending");

    // Simulate transaction
    setTimeout(() => {
      setStatus("success");
    }, 2000);
  };

  const handleClose = () => {
    setStep("amount");
    setStatus("pending");
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>
          {step === "amount" && "💰 Purchase Game"}
          {step === "confirm" && "✅ Confirm Purchase"}
          {step === "status" && "⏳ Processing..."}
        </Dialog.Title>

        {step === "amount" && (
          <Box>
            <Text mb="4">
              You're about to mint <strong>{game.title}</strong>
            </Text>
            <Box
              p="4"
              style={{
                background: iglooTheme.gradients.frostWhite,
                borderRadius: iglooTheme.borderRadius.arch,
                border: `1px solid ${iglooTheme.colors.primary[200]}`,
              }}
            >
              <Flex justify="between" align="center" mb="2">
                <Text size="2" color="gray">
                  Price:
                </Text>
                <Text size="3" weight="bold">
                  {formatPrice(game.price)} SUI
                </Text>
              </Flex>
              <Flex justify="between" align="center" mb="2">
                <Text size="2" color="gray">
                  Gas Fee (est.):
                </Text>
                <Text size="2">~0.01 SUI</Text>
              </Flex>
              <hr
                style={{
                  margin: "8px 0",
                  border: `1px solid ${iglooTheme.colors.ice[200]}`,
                }}
              />
              <Flex justify="between" align="center">
                <Text size="3" weight="bold">
                  Total:
                </Text>
                <Text size="3" weight="bold">
                  {(parseFloat(formatPrice(game.price)) + 0.01).toFixed(2)} SUI
                </Text>
              </Flex>
            </Box>
            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                onClick={() => setStep("confirm")}
                style={iglooStyles.button.primary}
              >
                Continue
              </Button>
            </Flex>
          </Box>
        )}

        {step === "confirm" && (
          <Box>
            <Text mb="4">Please confirm your purchase in your wallet</Text>
            <Box
              p="4"
              style={{
                background: iglooTheme.gradients.iceBlue,
                borderRadius: iglooTheme.borderRadius.arch,
                border: `1px solid ${iglooTheme.colors.primary[200]}`,
              }}
            >
              <Text size="2" color="gray" mb="2">
                Transaction Details:
              </Text>
              <Text
                size="1"
                style={{ fontFamily: "monospace", wordBreak: "break-all" }}
              >
                Minting {game.title} NFT for {formatPrice(game.price)} SUI
              </Text>
            </Box>
            <Flex gap="3" mt="4" justify="end">
              <Button
                variant="soft"
                color="gray"
                onClick={() => setStep("amount")}
              >
                Back
              </Button>
              <Button
                onClick={handlePurchase}
                style={iglooStyles.button.primary}
              >
                🔗 Sign Transaction
              </Button>
            </Flex>
          </Box>
        )}

        {step === "status" && (
          <Box style={{ textAlign: "center" }}>
            {status === "pending" && (
              <>
                <Box style={{ fontSize: "2rem", marginBottom: "16px" }}>⏳</Box>
                <Text mb="4">Processing your transaction...</Text>
                <Text size="2" color="gray">
                  This may take a few moments
                </Text>
              </>
            )}
            {status === "success" && (
              <>
                <Box style={{ fontSize: "2rem", marginBottom: "16px" }}>🎉</Box>
                <Text mb="4" weight="bold" color="green">
                  Successfully minted {game.title}!
                </Text>
                <Text size="2" color="gray" mb="4">
                  Your NFT has been added to your library
                </Text>
                <Flex gap="3" justify="center">
                  <Dialog.Close>
                    <Button variant="soft">Close</Button>
                  </Dialog.Close>
                  <Link to="/library">
                    <Button style={iglooStyles.button.primary}>
                      📚 Go to Library
                    </Button>
                  </Link>
                </Flex>
              </>
            )}
            {status === "error" && (
              <>
                <Box style={{ fontSize: "2rem", marginBottom: "16px" }}>❌</Box>
                <Text mb="4" color="red">
                  Transaction failed
                </Text>
                <Button
                  onClick={() => setStep("amount")}
                  style={iglooStyles.button.primary}
                >
                  Try Again
                </Button>
              </>
            )}
          </Box>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}

export function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    stage: string;
    progress: number;
    message: string;
  } | null>(null);
  const gameStorePackageId = useNetworkVariable("gameStorePackageId");

  // Mock ownership check - in real app, this would query user's NFTs
  const [isOwned, setIsOwned] = useState(false);

  // Fetch game details
  const { data: gameData, isLoading } = useSuiClientQuery(
    "getObject",
    {
      id: gameId || "",
      options: {
        showContent: true,
        showDisplay: true,
      },
    },
    {
      enabled: !!gameId,
    },
  );

  if (isLoading) {
    return (
      <Box>
        <Skeleton height="200px" mb="4" />
        <Skeleton height="40px" mb="2" />
        <Skeleton height="20px" mb="4" />
        <Grid columns="2" gap="4">
          <Skeleton height="300px" />
          <Skeleton height="300px" />
        </Grid>
      </Box>
    );
  }

  if (!gameData?.data) {
    return (
      <Box style={{ textAlign: "center", padding: "48px" }}>
        <Text size="4" color="gray">
          Game not found
        </Text>
        <Link to="/store">
          <Button mt="4" style={iglooStyles.button.primary}>
            🏠 Back to Store
          </Button>
        </Link>
      </Box>
    );
  }

  // Parse game data
  const fields = (gameData.data as any).content?.fields;
  const game: Game = {
    id: gameData.data.objectId,
    title: fields?.title || "Unknown Game",
    description: fields?.description || "No description available",
    price: parseInt(fields?.price) || 0,
    publisher: fields?.publisher || "Unknown",
    walrus_blob_id: fields?.walrus_blob_id || "",
    cover_image_blob_id: fields?.cover_image_blob_id || "",
    genre: fields?.genre || "Unknown",
    publish_date: parseInt(fields?.publish_date) || 0,
    is_active: fields?.is_active || false,
    total_sales: parseInt(fields?.total_sales) || 0,
  };

  const formatPrice = (priceInMist: number) => {
    return (priceInMist / 1000000000).toFixed(2);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getWalrusImageUrl = (blobId: string) => {
    return `https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-quilt-patch-id/${blobId}`;
  };

  const handleDownloadGame = async () => {
    if (!currentAccount?.address || !gameData?.data) return;

    setIsDownloading(true);
    setDownloadProgress(null);

    try {
      const downloadManager = new GameDownloadManager(
        suiClient,
        currentAccount.address,
      );

      // Convert game data to the format expected by GameDownloadManager
      const gameNFT = {
        id: game.id,
        gameId: game.id,
        title: game.title,
        walrusBlobId: game.walrus_blob_id,
        sealPolicyId: game.cover_image_blob_id, // Placeholder - actual seal policy would be different
        currentOwner: currentAccount.address,
      };

      const gameBlob = await downloadManager.downloadGame(
        gameNFT,
        (progress) => {
          setDownloadProgress({
            stage: progress.stage,
            progress: progress.progress,
            message: progress.message,
          });
        },
      );

      // Trigger browser download
      const filename = game.title
        ? `${game.title.replace(/[^a-zA-Z0-9]/g, "_")}.zip`
        : "game.zip";

      GameDownloadManager.triggerDownload(gameBlob, filename);

      // Show success message
      alert(
        `🎮 ${game.title} downloaded successfully!\n\nFile: ${filename}\n\nYour game has been saved to your Downloads folder.`,
      );
    } catch (error) {
      console.error("Download failed:", error);

      // Show specific error messages
      if (error instanceof Error) {
        if (error.message.includes("do not own this game")) {
          alert(
            `❌ Access Denied\n\nYou need to own the NFT for "${game.title}" to download it.\n\nPurchase the game first, then try downloading again.`,
          );
        } else {
          alert(
            `❌ Download Error\n\n${error.message}\n\nPlease try again or contact support if the problem persists.`,
          );
        }
      } else {
        alert("Download failed. Please try again.");
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <Card
        style={{
          ...iglooStyles.card,
          marginBottom: "32px",
          background: iglooTheme.gradients.iglooMain,
        }}
      >
        <Grid columns={{ initial: "1", md: "2" }} gap="6" p="6">
          {/* Cover Image */}
          <Box>
            {game.cover_image_blob_id &&
            !game.cover_image_blob_id.startsWith("walrus_") ? (
              <img
                src={getWalrusImageUrl(game.cover_image_blob_id)}
                alt={`${game.title} cover`}
                style={{
                  width: "100%",
                  maxHeight: "400px",
                  objectFit: "cover",
                  borderRadius: iglooTheme.borderRadius.arch,
                  border: `2px solid ${iglooTheme.colors.primary[200]}`,
                }}
              />
            ) : (
              <Box
                style={{
                  width: "100%",
                  height: "400px",
                  background: iglooTheme.gradients.coolBlue,
                  borderRadius: iglooTheme.borderRadius.arch,
                  border: `2px solid ${iglooTheme.colors.primary[200]}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <Text size="6" style={{ color: "white", marginBottom: "16px" }}>
                  {game.title.slice(0, 2).toUpperCase()}
                </Text>
                <Text size="2" style={{ color: "rgba(255,255,255,0.7)" }}>
                  No Cover Image
                </Text>
              </Box>
            )}
          </Box>

          {/* Game Info */}
          <Box>
            <Flex gap="2" mb="3">
              <Badge size="2" variant="soft">
                {game.genre}
              </Badge>
              {isOwned && (
                <Badge
                  size="2"
                  style={{ background: iglooTheme.colors.primary[100] }}
                >
                  ✅ Owned
                </Badge>
              )}
            </Flex>

            <Heading
              size="8"
              mb="4"
              style={{ color: iglooTheme.colors.primary[700] }}
            >
              {game.title}
            </Heading>

            <Text
              size="4"
              mb="6"
              style={{ lineHeight: "1.6", color: iglooTheme.colors.ice[700] }}
            >
              {game.description}
            </Text>

            {/* Publisher Info */}
            <Flex align="center" gap="3" mb="6">
              <Avatar
                src=""
                fallback={game.publisher.slice(0, 2).toUpperCase()}
                size="3"
              />
              <Box>
                <Text size="2" color="gray">
                  Publisher
                </Text>
                <Text size="3" weight="bold">
                  {formatAddress(game.publisher)}
                </Text>
              </Box>
            </Flex>

            {/* Price Block */}
            <Card
              style={{
                ...iglooStyles.card,
                padding: "24px",
                background: iglooTheme.gradients.frostWhite,
                marginBottom: "24px",
              }}
            >
              <Flex justify="between" align="center" mb="4">
                <Text
                  size="5"
                  weight="bold"
                  style={{ color: iglooTheme.colors.primary[700] }}
                >
                  {game.price === 0 ? "Free" : `${formatPrice(game.price)} SUI`}
                </Text>
                <Text size="2" color="gray">
                  {game.total_sales} sales
                </Text>
              </Flex>

              {/* CTA Area */}
              {!currentAccount ? (
                <Text size="3" color="gray" style={{ textAlign: "center" }}>
                  🔗 Connect your wallet to purchase
                </Text>
              ) : isOwned ? (
                <Box>
                  <Button
                    size="4"
                    style={{
                      width: "100%",
                      ...iglooStyles.button.primary,
                      marginBottom: "12px",
                    }}
                    disabled={isDownloading}
                    onClick={handleDownloadGame}
                  >
                    {isDownloading ? "⏳ Downloading..." : "⬇️ Download Game"}
                  </Button>
                  {downloadProgress && (
                    <Box mb="2" style={{ textAlign: "center" }}>
                      <Text
                        size="1"
                        style={{ color: iglooTheme.colors.primary[600] }}
                      >
                        {downloadProgress.message}
                      </Text>
                      <Box
                        style={{
                          width: "100%",
                          height: "4px",
                          background: iglooTheme.colors.ice[200],
                          borderRadius: "2px",
                          marginTop: "4px",
                        }}
                      >
                        <Box
                          style={{
                            width: `${downloadProgress.progress}%`,
                            height: "100%",
                            background: iglooTheme.colors.primary[500],
                            borderRadius: "2px",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                  <Text size="2" color="gray" style={{ textAlign: "center" }}>
                    You own this game
                  </Text>
                </Box>
              ) : (
                <Button
                  size="4"
                  style={{
                    width: "100%",
                    ...iglooStyles.button.primary,
                    fontSize: "16px",
                    background:
                      game.price === 0
                        ? iglooTheme.colors.primary[600]
                        : iglooTheme.gradients.coolBlue,
                  }}
                  disabled={!game.is_active}
                  onClick={() => setIsPurchaseModalOpen(true)}
                >
                  {game.price === 0
                    ? "🆓 Mint Free"
                    : `❄️ Mint for ${formatPrice(game.price)} SUI`}
                </Button>
              )}
            </Card>

            {/* Game Stats */}
            <Grid columns="3" gap="3">
              <Box style={{ textAlign: "center" }}>
                <Text
                  size="3"
                  weight="bold"
                  style={{ color: iglooTheme.colors.primary[700] }}
                >
                  {game.total_sales}
                </Text>
                <Text size="1" color="gray">
                  Sales
                </Text>
              </Box>
              <Box style={{ textAlign: "center" }}>
                <Text
                  size="3"
                  weight="bold"
                  style={{ color: iglooTheme.colors.primary[700] }}
                >
                  {game.is_active ? "Active" : "Inactive"}
                </Text>
                <Text size="1" color="gray">
                  Status
                </Text>
              </Box>
              <Box style={{ textAlign: "center" }}>
                <Text
                  size="3"
                  weight="bold"
                  style={{ color: iglooTheme.colors.primary[700] }}
                >
                  #{game.publish_date}
                </Text>
                <Text size="1" color="gray">
                  Epoch
                </Text>
              </Box>
            </Grid>
          </Box>
        </Grid>
      </Card>

      {/* Back to Store */}
      <Flex justify="center" mt="6">
        <Link to="/store">
          <Button variant="soft" size="3" style={{ padding: "12px 24px" }}>
            ← Back to Store
          </Button>
        </Link>
      </Flex>

      {/* Purchase Modal */}
      <PurchaseModal
        game={game}
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
      />
    </Box>
  );
}
