import { useState, useEffect } from "react";
import {
  useSuiClientQuery,
  useCurrentAccount,
  useSuiClient,
} from "@mysten/dapp-kit";
import { WalrusClient } from "@mysten/walrus";
import walrusWasmUrl from "@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url";
import {
  Card,
  Grid,
  Heading,
  Text,
  Button,
  Badge,
  Flex,
  Box,
  Avatar,
  Skeleton,
} from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";

interface Game {
  id: string;
  title: string;
  description: string;
  price: number; // in MIST
  publisher: string;
  walrus_blob_id: string;
  cover_image_blob_id: string;
  genre: string;
  publish_date: number;
  is_active: boolean;
  total_sales: number;
}

export function Store() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const gameStorePackageId = useNetworkVariable("gameStorePackageId");
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize Walrus client for reading cover images
  const walrusClient = new WalrusClient({
    network: "testnet",
    suiClient,
    wasmUrl: walrusWasmUrl,
    // Note: SSL certificate issues with testnet nodes are handled in error catching
  });

  // Function to download cover image directly
  const downloadCoverImage = async (blobId: string, gameTitle: string) => {
    console.log(
      `📥 Starting download for blob ID: "${blobId}", game: "${gameTitle}"`,
    );

    try {
      // Early return for empty, mock, or invalid blob IDs
      if (!blobId || blobId === "" || blobId.startsWith("walrus_")) {
        console.log(`⚠️ Cannot download: invalid blob ID "${blobId}"`);
        alert("No cover image available for this game");
        return;
      }

      console.log(`📡 Fetching from Walrus for blob ID: ${blobId}`);

      // Use Walrus client to get the file
      const files = await walrusClient.getFiles({ ids: [blobId] });
      console.log(`📦 Downloaded ${files.length} file(s) from Walrus`);

      if (files.length === 0) {
        throw new Error(`No files returned for blob ID: ${blobId}`);
      }

      const walrusFile = files[0];
      const imageBytes = await walrusFile.bytes();
      console.log(`📏 Downloaded ${imageBytes.length} bytes`);

      if (!imageBytes || imageBytes.length === 0) {
        throw new Error(`Empty bytes received for blob ID: ${blobId}`);
      }

      // Detect actual image format from file headers
      let mimeType = "image/jpeg"; // default
      let fileExtension = ".jpg"; // default

      if (imageBytes.length > 8) {
        const header = Array.from(imageBytes.slice(0, 8))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        console.log(`🔍 Detected image header: ${header}`);

        if (header.startsWith("ffd8ff")) {
          mimeType = "image/jpeg";
          fileExtension = ".jpg";
          console.log(`✅ Detected JPEG format`);
        } else if (header.startsWith("89504e47")) {
          mimeType = "image/png";
          fileExtension = ".png";
          console.log(`✅ Detected PNG format`);
        } else if (header.startsWith("47494638")) {
          mimeType = "image/gif";
          fileExtension = ".gif";
          console.log(`✅ Detected GIF format`);
        } else if (header.startsWith("52494646")) {
          // Check if it's WebP (RIFF + WEBP)
          const webpCheck = Array.from(imageBytes.slice(8, 12))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          if (webpCheck === "57454250") {
            mimeType = "image/webp";
            fileExtension = ".webp";
            console.log(`✅ Detected WebP format`);
          }
        } else {
          console.log(`⚠️ Unknown format (${header}), using JPEG as fallback`);
        }
      }

      // Create downloadable blob with correct MIME type
      console.log(
        `📁 Creating blob with MIME type: ${mimeType}, extension: ${fileExtension}`,
      );
      const imageBlob = new Blob([imageBytes], { type: mimeType });

      // Create download link with correct extension
      const downloadUrl = URL.createObjectURL(imageBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${gameTitle}_cover${fileExtension}`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(downloadUrl);

      console.log(`✅ Successfully downloaded cover image for "${gameTitle}"`);
    } catch (error) {
      console.error(
        `❌ Failed to download cover image for "${gameTitle}":`,
        error,
      );

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isSSLError =
        errorMessage.includes("certificate") ||
        errorMessage.includes("CERT_") ||
        errorMessage.includes("SSL") ||
        errorMessage.includes("TLS");

      const alertMessage = isSSLError
        ? "Download failed due to SSL certificate issues with Walrus storage nodes"
        : "Failed to download cover image. Please try again later.";

      alert(alertMessage);
    }
  };

  // Query all Game objects from the blockchain using multiGetObjects on GameStore
  const gameStoreObjectId = useNetworkVariable("gameStoreObjectId");
  const { data: gameStoreData, isLoading: isLoadingStore } = useSuiClientQuery(
    "getObject",
    {
      id: gameStoreObjectId,
      options: {
        showContent: true,
      },
    },
    {
      enabled: !!gameStoreObjectId,
    },
  );

  // Query events to find published games using the correct API method
  const eventsResult = useSuiClientQuery(
    "queryEvents",
    {
      query: {
        MoveEventType: `${gameStorePackageId}::game_store::GamePublished`,
      },
      order: "descending",
    },
    {
      enabled: !!gameStorePackageId,
    },
  );

  const gameEvents = eventsResult.data as any;
  const eventsError = eventsResult.error;
  const isLoadingEvents = eventsResult.isLoading;
  const refetchEvents = eventsResult.refetch;

  // State to store game IDs extracted from events
  const [gameIds, setGameIds] = useState<string[]>([]);

  // Extract game IDs from events
  useEffect(() => {
    if (gameEvents?.data && Array.isArray(gameEvents.data)) {
      console.log("🎉 Events found:", gameEvents.data);

      const extractedIds = gameEvents.data
        .map((event: any) => {
          const gameId = event.parsedJson?.game_id;
          console.log("📋 Extracted game ID from event:", gameId);
          return gameId;
        })
        .filter(Boolean);

      console.log("🎯 Game IDs extracted:", extractedIds);
      setGameIds(extractedIds);
    }
  }, [gameEvents]);

  // Use multiGetObjects to fetch all games by their IDs
  const gamesResult = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: gameIds,
      options: {
        showContent: true,
        showDisplay: true,
        showType: true,
      },
    },
    {
      enabled: gameIds.length > 0,
    },
  );

  const allGameObjects = gamesResult.data as any;
  const isLoadingAll = gamesResult.isLoading;
  const refetchAll = gamesResult.refetch;
  const queryError = gamesResult.error;

  // Debug logging
  console.log("🔍 Store Debug Info:");
  console.log("Package ID:", gameStorePackageId);
  console.log("GameStore Object ID:", gameStoreObjectId);
  console.log("gameStoreData query result:", gameStoreData);
  console.log("allGameObjects query result:", allGameObjects);
  console.log("gameEvents query result:", gameEvents);
  console.log("Query errors:", { queryError, eventsError });
  console.log("Loading states:", {
    isLoadingStore,
    isLoadingEvents,
    isLoadingAll,
  });
  console.log("Game IDs state:", gameIds);

  useEffect(() => {
    // Process the game objects when data is available
    const processGames = (objects: any[], source: string) => {
      console.log(`🎮 Processing games from ${source}:`, objects);

      if (!objects) {
        console.log(`❌ No objects provided from ${source}`);
        return [];
      }

      const processed = objects
        .map((obj, index) => {
          console.log(`📦 Processing object ${index}:`, obj);

          const content = obj.data?.content;
          if (!content || !content.fields) {
            console.log(
              `⚠️ Object ${index} missing content or fields:`,
              obj.data,
            );
            return null;
          }

          const fields = content.fields;
          console.log(`🔧 Fields for object ${index}:`, fields);

          const game = {
            id: obj.data.objectId,
            title: Array.isArray(fields.title)
              ? new TextDecoder().decode(new Uint8Array(fields.title))
              : fields.title || "Untitled Game",
            description: Array.isArray(fields.description)
              ? new TextDecoder().decode(new Uint8Array(fields.description))
              : fields.description || "No description",
            price: parseInt(fields.price) || 0,
            publisher: fields.publisher || "Unknown",
            walrus_blob_id: Array.isArray(fields.walrus_blob_id)
              ? new TextDecoder().decode(new Uint8Array(fields.walrus_blob_id))
              : fields.walrus_blob_id || "",
            cover_image_blob_id: Array.isArray(fields.cover_image_blob_id)
              ? new TextDecoder().decode(
                  new Uint8Array(fields.cover_image_blob_id),
                )
              : fields.cover_image_blob_id || "",
            genre: Array.isArray(fields.genre)
              ? new TextDecoder().decode(new Uint8Array(fields.genre))
              : fields.genre || "Unknown",
            publish_date: parseInt(fields.publish_date) || 0,
            is_active: fields.is_active || false,
            total_sales: parseInt(fields.total_sales) || 0,
          };

          console.log(`✅ Processed game ${index}:`, game);
          return game;
        })
        .filter(Boolean);

      console.log(`🎯 Final processed games from ${source}:`, processed);
      return processed;
    };

    // Process the multiGetObjects result
    if (
      allGameObjects &&
      Array.isArray(allGameObjects) &&
      allGameObjects.length > 0
    ) {
      console.log("🚀 Using allGameObjects data from multiGetObjects");
      const processedGames = processGames(allGameObjects, "multiGetObjects");
      const validGames = processedGames.filter(Boolean) as Game[];

      // Log cover image blob IDs specifically
      console.log("🖼️ Cover image blob IDs in final games:");
      validGames.forEach((game, index) => {
        console.log(
          `  Game ${index} (${game.title}): cover_image_blob_id = "${game.cover_image_blob_id}"`,
        );
        console.log(
          `    Type: ${typeof game.cover_image_blob_id}, Length: ${game.cover_image_blob_id?.length}`,
        );
        console.log(
          `    Starts with 'walrus_': ${game.cover_image_blob_id?.startsWith("walrus_")}`,
        );
      });

      setGames(validGames);
      setLoading(false);
    } else if (!isLoadingAll && gameIds.length > 0) {
      console.log("⚠️ multiGetObjects completed but no data returned");
      console.log("allGameObjects:", allGameObjects);
      setLoading(false);
    } else if (!isLoadingEvents && !isLoadingAll && gameIds.length === 0) {
      console.log("❌ No game IDs found from events");
      setLoading(false);
    } else {
      console.log("⏳ Still loading or no data yet");
      console.log("Debug state:", {
        isLoadingEvents,
        isLoadingAll,
        gameIdsLength: gameIds.length,
        allGameObjects: allGameObjects,
      });
    }
  }, [allGameObjects, gameIds, isLoadingAll, isLoadingEvents]);

  // Log final games state
  console.log("🎯 Final games state:", games);
  console.log("📊 Games count:", games.length);
  console.log("⏳ Loading state:", loading);
  console.log("🚀 Current process step:", {
    step1_eventsLoaded: gameEvents?.data?.length > 0,
    step2_gameIdsExtracted: gameIds.length > 0,
    step3_gamesDataLoaded:
      Array.isArray(allGameObjects) && allGameObjects.length > 0,
    step4_gamesProcessed: games.length > 0,
  });

  // Additional logging for cover image debugging
  if (games.length > 0) {
    console.log("🖼️ FINAL COVER IMAGE BLOB IDS:");
    games.forEach((game, index) => {
      console.log(
        `  ${index}. "${game.title}" => "${game.cover_image_blob_id}" (type: ${typeof game.cover_image_blob_id})`,
      );
    });

    console.log("📋 COMPLETE GAME DATA (JSON):");
    games.forEach((game, index) => {
      console.log(`🎮 Game ${index}:`, JSON.stringify(game, null, 2));
    });
  }

  const formatPrice = (priceInMist: number) => {
    return (priceInMist / 1000000000).toFixed(2); // Convert MIST to SUI
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handlePurchase = (game: Game) => {
    // TODO: Implement purchase logic
    console.log("Purchase game:", game.title);
    alert(`Purchase functionality coming soon for: ${game.title}`);
  };

  if (loading || isLoadingStore || isLoadingEvents || isLoadingAll) {
    return (
      <Box>
        <Heading size="6" mb="4">
          Game Store
        </Heading>
        <Grid columns="3" gap="4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} size="2">
              <Skeleton height="150px" />
              <Box mt="3">
                <Skeleton height="20px" mb="2" />
                <Skeleton height="16px" mb="2" />
                <Skeleton height="16px" width="60%" />
              </Box>
            </Card>
          ))}
        </Grid>
      </Box>
    );
  }

  if (queryError || eventsError) {
    return (
      <Box>
        <Heading size="6" mb="4">
          Game Store
        </Heading>
        <Text color="red">
          Error loading games:{" "}
          {(queryError as any)?.message ||
            (eventsError as any)?.message ||
            "Unknown error"}
        </Text>
      </Box>
    );
  }

  if (!games.length) {
    return (
      <Box>
        <Heading size="6" mb="4">
          Game Store
        </Heading>
        <Card size="3" style={{ textAlign: "center", padding: "40px" }}>
          <Heading size="4" mb="2">
            No Games Published Yet
          </Heading>
          <Text color="gray" mb="4">
            Be the first to publish a game on ColdCache!
          </Text>
          <Text size="2" color="gray">
            Switch to the "Publish Game" tab to upload your first game.
          </Text>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="between" align="center" mb="4">
        <Heading size="6">Game Store</Heading>
        <Flex gap="2" align="center">
          <Button
            variant="soft"
            size="1"
            onClick={() => {
              console.log("🔄 Manual refetch triggered");
              refetchEvents();
              refetchAll();
            }}
          >
            🔄 Refresh
          </Button>
          <Badge variant="soft" size="2">
            {games.length} {games.length === 1 ? "Game" : "Games"} Available
          </Badge>
        </Flex>
      </Flex>

      <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
        {games.map((game) => (
          <Card key={game.id} size="2" style={{ height: "100%" }}>
            {/* Cover Image Area with Download Button */}
            <Box
              style={{
                height: "150px",
                borderRadius: "6px 6px 0 0",
                marginBottom: "12px",
                background:
                  "linear-gradient(135deg, var(--accent-9), var(--accent-7))",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <Text
                size="4"
                weight="bold"
                style={{ color: "white", marginBottom: "8px" }}
              >
                {game.title.slice(0, 2).toUpperCase()}
              </Text>

              {/* Download Cover Image Button */}
              {game.cover_image_blob_id &&
              !game.cover_image_blob_id.startsWith("walrus_") ? (
                <Button
                  size="1"
                  variant="soft"
                  onClick={() =>
                    downloadCoverImage(game.cover_image_blob_id, game.title)
                  }
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                  }}
                >
                  📥 Download Cover
                </Button>
              ) : (
                <Text size="1" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                  No Cover Image
                </Text>
              )}
            </Box>

            <Flex
              direction="column"
              gap="2"
              style={{ padding: "0 12px 12px 12px" }}
            >
              {/* Title and Genre */}
              <Flex justify="between" align="center">
                <Heading
                  size="3"
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    marginRight: "8px",
                  }}
                >
                  {game.title}
                </Heading>
                <Badge variant="soft" size="1">
                  {game.genre}
                </Badge>
              </Flex>

              {/* Description */}
              <Text
                size="2"
                color="gray"
                style={{
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  lineHeight: "1.4",
                  height: "2.8em",
                }}
              >
                {game.description}
              </Text>

              {/* Publisher */}
              <Flex align="center" gap="2">
                <Avatar
                  src=""
                  fallback={game.publisher.slice(0, 2).toUpperCase()}
                  size="1"
                />
                <Text size="1" color="gray">
                  {formatAddress(game.publisher)}
                </Text>
              </Flex>

              {/* Stats */}
              <Flex justify="between" align="center" mt="2">
                <Text size="1" color="gray">
                  {game.total_sales} sales
                </Text>
                <Text size="2" weight="bold">
                  {formatPrice(game.price)} SUI
                </Text>
              </Flex>

              {/* Purchase Button */}
              <Button
                size="2"
                style={{ marginTop: "8px" }}
                disabled={!game.is_active || !currentAccount}
                onClick={() => handlePurchase(game)}
              >
                {!currentAccount
                  ? "Connect Wallet"
                  : !game.is_active
                    ? "Unavailable"
                    : "Purchase"}
              </Button>

              {/* Game ID for debugging */}
              <Text
                size="1"
                color="gray"
                style={{
                  fontFamily: "monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                ID: {game.id.slice(0, 20)}...
              </Text>
            </Flex>
          </Card>
        ))}
      </Grid>

      {/* Debug Info */}
      <Box
        mt="6"
        p="4"
        style={{ background: "var(--gray-2)", borderRadius: "8px" }}
      >
        <Text size="2" weight="bold" mb="2">
          🔍 Debug Info:
        </Text>
        <Text size="1" color="gray" style={{ fontFamily: "monospace" }}>
          Package ID: {gameStorePackageId}
          <br />
          GameStore Object ID: {gameStoreObjectId}
          <br />
          Games found: {games.length}
          <br />
          Loading: {loading ? "true" : "false"}
          <br />
          Query results:
          <br />• gameEvents=
          {Array.isArray(gameEvents?.data) ? gameEvents.data.length : 0}
          <br />• gameIds={gameIds.length}
          <br />• allGameObjects=
          {Array.isArray(allGameObjects) ? allGameObjects.length : 0}
          <br />• gameStoreData={gameStoreData?.data ? "found" : "not found"}
          <br />
          Errors:{" "}
          {(queryError as any)?.message ||
            (eventsError as any)?.message ||
            "none"}
        </Text>
        <Button
          mt="2"
          size="1"
          variant="outline"
          onClick={() => {
            console.log("📋 Full debug dump:");
            console.table({
              packageId: gameStorePackageId,
              gameStoreObjectId,
              gamesLength: games.length,
              loading,
              gameEventsLength: Array.isArray(gameEvents?.data)
                ? gameEvents.data.length
                : 0,
              gameIdsLength: gameIds.length,
              allGameObjectsLength: Array.isArray(allGameObjects)
                ? allGameObjects.length
                : 0,
              gameStoreDataFound: !!gameStoreData?.data,
              hasQueryError: !!queryError,
              hasEventsError: !!eventsError,
              isLoadingEvents,
              isLoadingAll,
            });
            console.log("🎯 Detailed data:");
            console.log("gameEvents:", gameEvents);
            console.log("gameIds:", gameIds);
            console.log("allGameObjects:", allGameObjects);
            console.log("gameStoreData:", gameStoreData);
          }}
        >
          📋 Console Dump
        </Button>
      </Box>
    </Box>
  );
}
