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
  Tabs,
} from "@radix-ui/themes";
import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import {
  generateSecureDownloadUrl,
  logSecureDownloadAttempt,
} from "../lib/secureDownload";
import { iglooTheme, iglooStyles } from "../theme";
import {
  GameNFT,
  parseGameNFTFromSui,
  getWalrusImageUrl,
  formatPriceToSui,
  formatTimestamp,
} from "../schemas/nft";

export function LibraryPage() {
  const currentAccount = useCurrentAccount();
  const nftPackageId = useNetworkVariable("nftPackageId");
  const gameStorePackageId = useNetworkVariable("gameStorePackageId");

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

  // Parse NFTs using the schema-based parser
  const parseGameStoreNFT = (
    obj: any,
  ): (GameNFT & { isPublished: boolean }) | null => {
    // Debug logging to understand the enhanced data structure
    console.log("Enhanced NFT fields:", obj.data?.content?.fields);

    const gameNFT = parseGameNFTFromSui(obj);
    if (!gameNFT) return null;

    return {
      ...gameNFT,
      isPublished: gameNFT.isPublished || false,
    };
  };

  // NFTs from standalone NFT contract (legacy)
  const legacyGameNFTs =
    nftObjects?.data
      ?.map(parseGameNFTFromSui)
      .filter((nft): nft is GameNFT => nft !== null) || [];

  // NFTs from game store contract - separate into purchased vs published
  const gameStoreNFTs_parsed =
    gameStoreNFTs?.data
      ?.map(parseGameStoreNFT)
      .filter(
        (nft): nft is GameNFT & { isPublished: boolean } => nft !== null,
      ) || [];

  // Combine purchased NFTs from both sources
  const gameNFTs = [
    ...legacyGameNFTs,
    ...gameStoreNFTs_parsed.filter((nft) => !nft.isPublished), // Purchased games
  ];

  // Only publisher NFTs go in published tab
  const publishedGames = gameStoreNFTs_parsed.filter((nft) => nft.isPublished);

  const handleSecureDownload = (game: GameNFT) => {
    if (!currentAccount?.address) {
      logSecureDownloadAttempt(game.id, null, false, "No wallet connected");
      alert("Please connect your wallet to download games.");
      return;
    }

    // Log the secure download attempt
    logSecureDownloadAttempt(
      game.id,
      currentAccount.address,
      true,
      "Redirecting to secure download",
    );

    // Generate secure download URL and redirect
    const secureUrl = generateSecureDownloadUrl(game);
    window.location.href = secureUrl;
  };

  // Helper functions are now imported from schema file

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
                    src={
                      getWalrusImageUrl(game.coverImageBlobId || "") ||
                      undefined
                    }
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
                      {"isPublished" in game && (game as any).isPublished && (
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
                    borderRadius: iglooTheme.borderRadius.arch,
                    marginBottom: "16px",
                  }}
                >
                  <Flex justify="between" mb="1">
                    <Text
                      size="1"
                      style={{ color: iglooTheme.colors.ice[600] }}
                    >
                      {"isPublished" in game && (game as any).isPublished
                        ? "Published"
                        : "Purchased"}
                    </Text>
                    <Text
                      size="1"
                      style={{ color: iglooTheme.colors.ice[700] }}
                    >
                      {formatTimestamp(game.mintDate)}
                    </Text>
                  </Flex>
                  {!("isPublished" in game && (game as any).isPublished) ? (
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
                        {formatPriceToSui(game.price)}
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
                        {formatPriceToSui(game.price)}
                      </Text>
                    </Flex>
                  )}
                </Box>

                <Box>
                  <Button
                    size="3"
                    style={{
                      width: "100%",
                      background: iglooTheme.gradients.coolBlue,
                      border: "none",
                      borderRadius: iglooTheme.borderRadius.arch,
                      fontWeight: "600",
                    }}
                    onClick={() => handleSecureDownload(game)}
                  >
                    🔐 Secure Download
                  </Button>
                  <Text
                    size="1"
                    style={{
                      color: iglooTheme.colors.ice[500],
                      textAlign: "center",
                      marginTop: "8px",
                      display: "block",
                    }}
                  >
                    Blockchain-verified access required
                  </Text>
                </Box>

                <Box mt="3">
                  <Text size="1" style={{ color: iglooTheme.colors.ice[500] }}>
                    NFT ID: {game.id.substring(0, 8)}...
                  </Text>
                  {"isPublished" in game && (game as any).isPublished && (
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
