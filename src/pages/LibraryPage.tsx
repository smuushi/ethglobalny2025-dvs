import { useState } from "react";
import {
  Box,
  Card,
  Flex,
  Heading,
  Text,
  Button,
  Grid,
  Badge,
  Spinner,
  Avatar,
  Progress,
  Tabs,
} from "@radix-ui/themes";
import {
  useCurrentAccount,
  useSuiClientQuery,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { GameDownloadManager } from "../lib/gameDownload";
import { iglooTheme, iglooStyles } from "../theme";

interface GameNFT {
  id: string;
  gameId: string;
  title: string;
  description: string;
  price: string;
  publisher: string;
  walrusBlobId: string;
  sealPolicyId: string;
  coverImageBlobId: string;
  genre: string;
  publishDate: string;
  owners: string[];
  mintDate: string;
  currentOwner: string;
}

interface DownloadState {
  gameId: string;
  stage: "verifying" | "downloading" | "decrypting" | "complete" | "error";
  progress: number;
  message: string;
}

export function LibraryPage() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const nftPackageId = useNetworkVariable("nftPackageId");
  const gameStorePackageId = useNetworkVariable("gameStorePackageId");
  const [downloadState, setDownloadState] = useState<DownloadState | null>(
    null,
  );

  // Query for owned NFTs from the standalone NFT contract
  const {
    data: nftObjects,
    isPending: nftPending,
    error: nftError,
  } = useSuiClientQuery(
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

  // Query for owned GameNFTs from the game store (purchased + published games)
  const {
    data: gameStoreNFTs,
    isPending: gameStorePending,
    error: gameStoreError,
  } = useSuiClientQuery(
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

  const isPending = nftPending || gameStorePending;
  const error = nftError || gameStoreError;

  const parseGameNFT = (obj: any): GameNFT | null => {
    try {
      const fields = obj.data?.content?.fields;
      if (!fields) return null;

      return {
        id: obj.data.objectId,
        gameId: fields.game_id,
        title: fields.title,
        description: fields.description,
        price: fields.price,
        publisher: fields.publisher,
        walrusBlobId: fields.walrus_blob_id,
        sealPolicyId: fields.seal_policy_id,
        coverImageBlobId: fields.cover_image_blob_id,
        genre: fields.genre,
        publishDate: fields.publish_date,
        owners: fields.owners || [],
        mintDate: fields.mint_date,
        currentOwner: fields.current_owner,
      };
    } catch (error) {
      console.error("Error parsing GameNFT:", error);
      return null;
    }
  };

  // Parse enhanced game store NFTs with rich metadata
  const parseGameStoreNFT = (
    obj: any,
  ): (GameNFT & { isPublished: boolean }) | null => {
    try {
      const fields = obj.data?.content?.fields;
      if (!fields) return null;

      // Debug logging to understand the enhanced data structure
      console.log("Enhanced NFT fields:", fields);

      const isPublished = fields.is_publisher_nft === true;

      return {
        id: obj.data.objectId,
        gameId: fields.game_id,
        title: fields.title || "Game " + fields.game_id.slice(-8),
        description: fields.description || "Game description",
        price: fields.price?.toString() || "0",
        publisher: fields.publisher || currentAccount?.address || "",
        walrusBlobId: fields.walrus_blob_id || "",
        sealPolicyId: "", // Would need Seal integration
        coverImageBlobId: fields.cover_image_blob_id || "",
        genre: fields.genre || "Unknown",
        publishDate: fields.publish_date || fields.purchase_date,
        owners: [fields.owner],
        mintDate: fields.purchase_date,
        currentOwner: fields.owner,
        isPublished,
      };
    } catch (error) {
      console.error("Error parsing Enhanced GameStore NFT:", error);
      return null;
    }
  };

  const gameNFTs =
    nftObjects?.data
      ?.map(parseGameNFT)
      .filter((nft): nft is GameNFT => nft !== null) || [];

  const publishedGames =
    gameStoreNFTs?.data
      ?.map(parseGameStoreNFT)
      .filter(
        (nft): nft is GameNFT & { isPublished: boolean } => nft !== null,
      ) || [];

  const handleDownloadGame = async (game: GameNFT) => {
    if (!currentAccount?.address) return;

    try {
      const downloadManager = new GameDownloadManager(
        suiClient,
        currentAccount.address,
      );

      await downloadManager.downloadGame(game, (progress) => {
        setDownloadState({
          gameId: game.id,
          stage: progress.stage,
          progress: progress.progress,
          message: progress.message,
        });
      });

      // If we get here, download was successful (but Walrus/Seal not implemented yet)
      setDownloadState(null);
    } catch (error) {
      console.error("Download failed:", error);

      // Show user-friendly message for unimplemented features
      if (
        error instanceof Error &&
        error.message.includes("not yet implemented")
      ) {
        alert(
          `Download functionality coming soon!\n\nGame: ${game.title}\nWalrus Blob: ${game.walrusBlobId}\nSeal Policy: ${game.sealPolicyId}\n\nOnce Walrus and Seal are integrated, you'll be able to download your games directly!`,
        );
      } else {
        alert("Download failed. Please try again.");
      }

      setDownloadState(null);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  const formatPrice = (price: string) => {
    return (parseInt(price) / 1000000000).toFixed(2) + " SUI";
  };

  const getWalrusImageUrl = (blobId: string) => {
    if (!blobId) return null;
    return `https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-quilt-patch-id/${blobId}`;
  };

  if (!currentAccount) {
    return (
      <Box style={{ padding: "24px" }}>
        <Card
          style={{ ...iglooStyles.card, textAlign: "center", padding: "48px" }}
        >
          <Text size="5" style={{ color: iglooTheme.colors.ice[600] }}>
            Please connect your wallet to view your game library
          </Text>
        </Card>
      </Box>
    );
  }

  const renderGameGrid = (
    games: GameNFT[],
    emptyMessage: string,
    emptyIcon: string,
  ) => {
    if (games.length === 0) {
      return (
        <Card
          style={{
            ...iglooStyles.card,
            textAlign: "center",
            padding: "48px",
            background: iglooTheme.gradients.frostWhite,
          }}
        >
          <Box
            style={{
              fontSize: "4rem",
              marginBottom: "16px",
              filter: "drop-shadow(0 4px 8px rgba(14, 165, 233, 0.2))",
            }}
          >
            {emptyIcon}
          </Box>
          <Heading
            size="6"
            mb="3"
            style={{
              color: iglooTheme.colors.primary[700],
            }}
          >
            {emptyMessage}
          </Heading>
        </Card>
      );
    }

    return (
      <>
        <Flex justify="between" align="center" mb="4">
          <Text size="3" style={{ color: iglooTheme.colors.ice[600] }}>
            {games.length} game{games.length > 1 ? "s" : ""} owned
          </Text>
          <Badge size="2" color="blue">
            ❄️ Verified Ownership
          </Badge>
        </Flex>

        <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4">
          {games.map((game) => (
            <Card
              key={game.id}
              style={{
                ...iglooStyles.card,
                background: iglooTheme.gradients.frostWhite,
                border: `1px solid ${iglooTheme.colors.primary[200]}`,
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
              className="game-card"
            >
              <Box p="4">
                <Flex align="center" mb="3">
                  <Avatar
                    size="3"
                    src={getWalrusImageUrl(game.coverImageBlobId) || undefined}
                    fallback={
                      "isPublished" in game && game.isPublished ? "🎨" : "🎮"
                    }
                    style={{
                      background: iglooTheme.gradients.iceBlue,
                      color: iglooTheme.colors.primary[700],
                    }}
                  />
                  <Box ml="3">
                    <Heading
                      size="4"
                      style={{
                        color: iglooTheme.colors.primary[700],
                        lineHeight: "1.2",
                      }}
                    >
                      {game.title}
                    </Heading>
                    <Flex gap="2">
                      <Badge size="1" color="cyan">
                        {game.genre}
                      </Badge>
                      {"isPublished" in game && game.isPublished && (
                        <Badge size="1" color="orange">
                          Creator
                        </Badge>
                      )}
                    </Flex>
                  </Box>
                </Flex>

                <Text
                  size="2"
                  style={{
                    color: iglooTheme.colors.ice[600],
                    lineHeight: "1.4",
                    display: "block",
                    marginBottom: "12px",
                  }}
                >
                  {game.description.length > 100
                    ? `${game.description.substring(0, 100)}...`
                    : game.description}
                </Text>

                <Box
                  style={{
                    background: iglooTheme.gradients.iceBlue,
                    padding: "12px",
                    borderRadius: iglooTheme.borderRadius.snowball,
                    marginBottom: "16px",
                  }}
                >
                  <Flex justify="between" mb="1">
                    <Text
                      size="1"
                      style={{ color: iglooTheme.colors.ice[600] }}
                    >
                      {"isPublished" in game && game.isPublished
                        ? "Published"
                        : "Purchased"}
                    </Text>
                    <Text
                      size="1"
                      style={{ color: iglooTheme.colors.ice[700] }}
                    >
                      {formatDate(game.mintDate)}
                    </Text>
                  </Flex>
                  {!("isPublished" in game && game.isPublished) ? (
                    <Flex justify="between">
                      <Text
                        size="1"
                        style={{ color: iglooTheme.colors.ice[600] }}
                      >
                        Price Paid
                      </Text>
                      <Text
                        size="1"
                        style={{ color: iglooTheme.colors.ice[700] }}
                      >
                        {formatPrice(game.price)}
                      </Text>
                    </Flex>
                  ) : (
                    <Flex justify="between">
                      <Text
                        size="1"
                        style={{ color: iglooTheme.colors.ice[600] }}
                      >
                        Game Price
                      </Text>
                      <Text
                        size="1"
                        style={{ color: iglooTheme.colors.ice[700] }}
                      >
                        {formatPrice(game.price)}
                      </Text>
                    </Flex>
                  )}
                </Box>

                <Box>
                  {downloadState?.gameId === game.id ? (
                    <Box>
                      <Flex justify="between" align="center" mb="2">
                        <Text
                          size="2"
                          style={{ color: iglooTheme.colors.ice[600] }}
                        >
                          {downloadState.message}
                        </Text>
                        <Text
                          size="1"
                          style={{ color: iglooTheme.colors.ice[500] }}
                        >
                          {downloadState.progress}%
                        </Text>
                      </Flex>
                      <Progress value={downloadState.progress} size="2" />
                    </Box>
                  ) : (
                    <Button
                      size="3"
                      style={{
                        width: "100%",
                        background: iglooTheme.gradients.primary,
                        border: "none",
                        borderRadius: iglooTheme.borderRadius.snowball,
                        fontWeight: "600",
                      }}
                      onClick={() => handleDownloadGame(game)}
                      disabled={downloadState !== null}
                    >
                      ⬇️ Download Game
                    </Button>
                  )}
                </Box>

                <Box mt="3">
                  <Text size="1" style={{ color: iglooTheme.colors.ice[500] }}>
                    NFT ID: {game.id.substring(0, 8)}...
                  </Text>
                  {"isPublished" in game && game.isPublished && (
                    <>
                      <Text
                        size="1"
                        style={{ color: iglooTheme.colors.ice[500] }}
                      >
                        Game ID: {game.gameId.substring(0, 8)}...
                      </Text>
                      {game.walrusBlobId && (
                        <Text
                          size="1"
                          style={{ color: iglooTheme.colors.ice[500] }}
                        >
                          Walrus: {game.walrusBlobId.substring(0, 12)}...
                        </Text>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            </Card>
          ))}
        </Grid>
      </>
    );
  };

  return (
    <Box style={{ padding: "24px" }}>
      <Box mb="6">
        <Heading
          size="8"
          mb="2"
          style={{
            color: iglooTheme.colors.primary[700],
            textShadow: "0 2px 4px rgba(14, 165, 233, 0.1)",
          }}
        >
          📚 Your Game Library
        </Heading>
        <Text
          size="4"
          style={{
            color: iglooTheme.colors.ice[600],
            lineHeight: "1.6",
          }}
        >
          Manage and download your owned games • True ownership through NFTs
        </Text>
      </Box>

      {isPending && (
        <Flex justify="center" align="center" style={{ minHeight: "300px" }}>
          <Spinner size="3" />
          <Text ml="3" size="4" style={{ color: iglooTheme.colors.ice[600] }}>
            Loading your games...
          </Text>
        </Flex>
      )}

      {error && (
        <Card
          style={{ ...iglooStyles.card, textAlign: "center", padding: "48px" }}
        >
          <Text size="4" style={{ color: "red" }}>
            Error loading games: {error.message}
          </Text>
        </Card>
      )}

      {!isPending && !error && (
        <Tabs.Root defaultValue="purchased">
          <Tabs.List style={{ marginBottom: "24px" }}>
            <Tabs.Trigger
              value="purchased"
              style={{ fontSize: "16px", padding: "8px 16px" }}
            >
              🎮 Purchased Games ({gameNFTs.length})
            </Tabs.Trigger>
            <Tabs.Trigger
              value="published"
              style={{ fontSize: "16px", padding: "8px 16px" }}
            >
              🎨 Published Games ({publishedGames.length})
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="purchased">
            {renderGameGrid(gameNFTs, "No Purchased Games Yet", "🎮")}
          </Tabs.Content>

          <Tabs.Content value="published">
            {renderGameGrid(publishedGames, "No Published Games Yet", "🎨")}
          </Tabs.Content>
        </Tabs.Root>
      )}

      <style>
        {`
          .game-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(14, 165, 233, 0.15);
          }
        `}
      </style>
    </Box>
  );
}
