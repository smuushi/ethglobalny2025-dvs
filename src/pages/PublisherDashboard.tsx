import React, { useState } from "react";
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
  Dialog,
  TextField,
  Switch,
} from "@radix-ui/themes";
import {
  useCurrentAccount,
  useSuiClientQuery,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "../networkConfig";
import { iglooTheme, iglooStyles } from "../theme";
import {
  GameNFT,
  parseGameNFTFromSui,
  getWalrusImageUrl,
  formatPriceToSui,
} from "../schemas/nft";
import { GameUpload } from "../GameUpload";

interface PublishedGame {
  id: string;
  title: string;
  description: string;
  price: number;
  totalSales: number;
  revenue: number;
  withdrawnAmount: number;
  maxSupply: number;
  isActive: boolean;
  coverImageBlobId: string;
  genre: string;
  publishDate: number;
}

interface GameObjectData {
  gameId: string;
  totalSales: number;
  revenueBalance: number;
  withdrawnAmount: number;
  maxSupply: number;
  isActive: boolean;
}

export function PublisherDashboard() {
  const currentAccount = useCurrentAccount();
  const gameStorePackageId = useNetworkVariable("gameStorePackageId");
  const [activeTab, setActiveTab] = useState("overview");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<PublishedGame | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [gameStats, setGameStats] = useState<Record<string, GameObjectData>>(
    {},
  );

  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  // Query for published game NFTs (publisher NFTs)
  const {
    data: publishedNFTsData,
    isPending: gamesLoading,
    refetch: refetchGames,
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
      enabled: !!currentAccount?.address,
    },
  );

  // Parse published games (filter for publisher NFTs)
  const publishedGames: GameNFT[] = publishedNFTsData?.data
    ? publishedNFTsData.data
        .map(parseGameNFTFromSui)
        .filter(
          (game): game is GameNFT => game !== null && game.isPublished === true,
        )
    : [];

  // Fetch Game object data for each published game
  const fetchGameStats = async () => {
    if (!publishedGames.length) return;

    const statsPromises = publishedGames.map(async (game) => {
      try {
        const gameObject = await suiClient.getObject({
          id: game.gameId,
          options: { showContent: true },
        });

        if (gameObject.data?.content && "fields" in gameObject.data.content) {
          const fields = gameObject.data.content.fields as any;
          return {
            gameId: game.gameId,
            totalSales: parseInt(fields.total_sales) || 0,
            revenueBalance:
              parseInt(fields.revenue_balance?.fields?.value || "0") || 0,
            withdrawnAmount: parseInt(fields.withdrawn_amount) || 0,
            maxSupply: parseInt(fields.max_supply) || 0,
            isActive: fields.is_active === true,
          };
        }
      } catch (error) {
        console.error(`Failed to fetch stats for game ${game.gameId}:`, error);
      }
      return null;
    });

    const results = await Promise.all(statsPromises);
    const statsMap: Record<string, GameObjectData> = {};

    results.forEach((stat) => {
      if (stat) {
        statsMap[stat.gameId] = stat;
      }
    });

    setGameStats(statsMap);
  };

  // Fetch game stats when published games change
  React.useEffect(() => {
    fetchGameStats();
  }, [publishedGames.length, suiClient]);

  const handleWithdrawRevenue = async () => {
    if (!selectedGame || !withdrawAmount) return;

    setIsWithdrawing(true);
    try {
      const tx = new Transaction();
      const amount = Math.floor(parseFloat(withdrawAmount) * 1_000_000_000); // Convert to MIST

      tx.moveCall({
        target: `${gameStorePackageId}::game_store::withdraw_revenue`,
        arguments: [
          tx.object((selectedGame as any).gameId || selectedGame.id),
          tx.pure.u64(amount),
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: () => {
            setIsWithdrawing(false);
            setIsWithdrawModalOpen(false);
            setWithdrawAmount("");
            setSelectedGame(null);
            refetchGames();
          },
          onError: (error) => {
            console.error("Withdrawal failed:", error);
            setIsWithdrawing(false);
          },
        },
      );
    } catch (error) {
      console.error("Withdrawal error:", error);
      setIsWithdrawing(false);
    }
  };

  const handleUpdateGameSettings = async (
    gameId: string,
    setting: string,
    value: any,
  ) => {
    try {
      const tx = new Transaction();

      switch (setting) {
        case "price":
          const priceInMist = Math.floor(value * 1_000_000_000);
          tx.moveCall({
            target: `${gameStorePackageId}::game_store::update_game_price`,
            arguments: [tx.object(gameId), tx.pure.u64(priceInMist)],
          });
          break;
        case "maxSupply":
          tx.moveCall({
            target: `${gameStorePackageId}::game_store::set_max_supply`,
            arguments: [tx.object(gameId), tx.pure.u64(value)],
          });
          break;
        case "active":
          tx.moveCall({
            target: `${gameStorePackageId}::game_store::toggle_game_active`,
            arguments: [tx.object(gameId)],
          });
          break;
      }

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: () => refetchGames(),
          onError: (error) => console.error("Update failed:", error),
        },
      );
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  const totalRevenue = publishedGames.reduce((sum, game) => {
    const stats = gameStats[game.gameId];
    return sum + (stats?.revenueBalance || 0);
  }, 0);
  const totalSales = publishedGames.reduce((sum, game) => {
    const stats = gameStats[game.gameId];
    return sum + (stats?.totalSales || 0);
  }, 0);

  if (gamesLoading) {
    return (
      <Box style={{ padding: "24px", textAlign: "center" }}>
        <Spinner size="3" />
        <Text size="3" style={{ marginTop: "16px", display: "block" }}>
          Loading publisher dashboard...
        </Text>
      </Box>
    );
  }

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
          📊 Publisher Dashboard
        </Heading>
        <Text
          size="4"
          style={{
            color: iglooTheme.colors.ice[600],
            lineHeight: "1.5",
          }}
        >
          Manage your published games, track revenue, and control distribution
        </Text>
      </Box>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List
          style={{
            background: iglooTheme.gradients.frostWhite,
            padding: "4px",
            borderRadius: iglooTheme.borderRadius.arch,
            border: `1px solid ${iglooTheme.colors.primary[200]}`,
            marginBottom: "24px",
          }}
        >
          <Tabs.Trigger value="overview" style={{ flex: 1 }}>
            📊 Overview
          </Tabs.Trigger>
          <Tabs.Trigger value="games" style={{ flex: 1 }}>
            🎮 My Games
          </Tabs.Trigger>
          <Tabs.Trigger value="revenue" style={{ flex: 1 }}>
            💰 Revenue
          </Tabs.Trigger>
          <Tabs.Trigger value="publish" style={{ flex: 1 }}>
            📤 Publish New
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview">
          <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="6" mb="6">
            {/* Total Games */}
            <Card
              style={{
                ...iglooStyles.card,
                padding: "24px",
                textAlign: "center",
                background: iglooTheme.gradients.iceBlue,
                border: `2px solid ${iglooTheme.colors.primary[300]}`,
              }}
            >
              <Box style={{ fontSize: "3rem", marginBottom: "12px" }}>🎮</Box>
              <Heading
                size="6"
                style={{
                  color: iglooTheme.colors.primary[700],
                  marginBottom: "8px",
                }}
              >
                {publishedGames.length}
              </Heading>
              <Text size="2" style={{ color: iglooTheme.colors.ice[600] }}>
                Published Games
              </Text>
            </Card>

            {/* Total Sales */}
            <Card
              style={{
                ...iglooStyles.card,
                padding: "24px",
                textAlign: "center",
                background: iglooTheme.gradients.frostWhite,
                border: `1px solid ${iglooTheme.colors.primary[200]}`,
              }}
            >
              <Box style={{ fontSize: "3rem", marginBottom: "12px" }}>📊</Box>
              <Heading
                size="6"
                style={{
                  color: iglooTheme.colors.primary[700],
                  marginBottom: "8px",
                }}
              >
                {totalSales}
              </Heading>
              <Text size="2" style={{ color: iglooTheme.colors.ice[600] }}>
                Total Sales
              </Text>
            </Card>

            {/* Total Revenue */}
            <Card
              style={{
                ...iglooStyles.card,
                padding: "24px",
                textAlign: "center",
                background: iglooTheme.gradients.frostWhite,
                border: `1px solid ${iglooTheme.colors.primary[200]}`,
              }}
            >
              <Box style={{ fontSize: "3rem", marginBottom: "12px" }}>💎</Box>
              <Heading
                size="6"
                style={{
                  color: iglooTheme.colors.primary[700],
                  marginBottom: "8px",
                }}
              >
                {formatPriceToSui(totalRevenue.toString())}
              </Heading>
              <Text size="2" style={{ color: iglooTheme.colors.ice[600] }}>
                Total Revenue
              </Text>
            </Card>

            {/* Active Games */}
            <Card
              style={{
                ...iglooStyles.card,
                padding: "24px",
                textAlign: "center",
                background: iglooTheme.gradients.frostWhite,
                border: `1px solid ${iglooTheme.colors.primary[200]}`,
              }}
            >
              <Box style={{ fontSize: "3rem", marginBottom: "12px" }}>✅</Box>
              <Heading
                size="6"
                style={{
                  color: iglooTheme.colors.primary[700],
                  marginBottom: "8px",
                }}
              >
                {
                  publishedGames.filter(
                    (game) => !("isActive" in game) || game.isActive !== false,
                  ).length
                }
              </Heading>
              <Text size="2" style={{ color: iglooTheme.colors.ice[600] }}>
                Active Games
              </Text>
            </Card>
          </Grid>

          {/* Recent Games */}
          <Card
            style={{
              ...iglooStyles.card,
              padding: "24px",
              background: iglooTheme.gradients.frostWhite,
            }}
          >
            <Heading
              size="5"
              mb="4"
              style={{ color: iglooTheme.colors.primary[700] }}
            >
              Recently Published
            </Heading>
            <Grid columns={{ initial: "1", sm: "2" }} gap="4">
              {publishedGames.slice(0, 4).map((game) => (
                <Card
                  key={game.id}
                  style={{
                    ...iglooStyles.card,
                    padding: "16px",
                    background: iglooTheme.gradients.iceBlue,
                  }}
                >
                  <Flex align="center" gap="3">
                    <Avatar
                      size="2"
                      src={
                        getWalrusImageUrl(game.coverImageBlobId || "") ||
                        undefined
                      }
                      fallback="🎮"
                    />
                    <Box>
                      <Text
                        size="3"
                        weight="bold"
                        style={{ color: iglooTheme.colors.primary[700] }}
                      >
                        {game.title}
                      </Text>
                      <Text
                        size="1"
                        style={{
                          color: iglooTheme.colors.ice[600],
                          marginTop: "8px",
                          display: "block",
                        }}
                      >
                        {formatPriceToSui(game.price)} •{" "}
                        {gameStats[game.gameId]?.totalSales || 0} sales
                      </Text>
                    </Box>
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="games">
          <Grid columns={{ initial: "1", lg: "2" }} gap="6">
            {publishedGames.map((game) => (
              <Card
                key={game.id}
                style={{
                  ...iglooStyles.card,
                  padding: "24px",
                  background: iglooTheme.gradients.frostWhite,
                }}
              >
                <Flex align="center" justify="between" mb="3">
                  <Flex align="center" gap="3">
                    <Avatar
                      size="3"
                      src={
                        getWalrusImageUrl(game.coverImageBlobId || "") ||
                        undefined
                      }
                      fallback="🎮"
                    />
                    <Box>
                      <Heading
                        size="4"
                        style={{ color: iglooTheme.colors.primary[700] }}
                      >
                        {game.title}
                      </Heading>
                      <Badge color="cyan">{game.genre}</Badge>
                    </Box>
                  </Flex>
                  <Switch
                    checked={!("isActive" in game) || game.isActive !== false}
                    onCheckedChange={() =>
                      handleUpdateGameSettings(
                        game.gameId || game.id,
                        "active",
                        null,
                      )
                    }
                  />
                </Flex>

                <Text
                  size="2"
                  style={{
                    color: iglooTheme.colors.ice[600],
                    marginBottom: "16px",
                  }}
                >
                  {game.description.substring(0, 100)}...
                </Text>

                <Grid columns="2" gap="4" mb="4">
                  <Box>
                    <Text
                      size="1"
                      style={{ color: iglooTheme.colors.ice[600] }}
                    >
                      Price
                    </Text>
                    <Text
                      size="3"
                      weight="bold"
                      style={{ color: iglooTheme.colors.primary[700] }}
                    >
                      {formatPriceToSui(game.price)}
                    </Text>
                  </Box>
                  <Box>
                    <Text
                      size="1"
                      style={{ color: iglooTheme.colors.ice[600] }}
                    >
                      Sales
                    </Text>
                    <Text
                      size="3"
                      weight="bold"
                      style={{ color: iglooTheme.colors.primary[700] }}
                    >
                      {gameStats[game.gameId]?.totalSales || 0}
                    </Text>
                  </Box>
                </Grid>

                <Flex gap="2">
                  <Button
                    size="2"
                    variant="soft"
                    style={{
                      ...iglooStyles.button.secondary,
                      flex: 1,
                    }}
                    onClick={() => {
                      // TODO: Open settings modal
                    }}
                  >
                    ⚙️ Settings
                  </Button>
                  <Button
                    size="2"
                    style={{
                      ...iglooStyles.button.primary,
                      flex: 1,
                    }}
                    onClick={() => {
                      setSelectedGame(game as any);
                      setIsWithdrawModalOpen(true);
                    }}
                  >
                    💰 Withdraw
                  </Button>
                </Flex>
              </Card>
            ))}
          </Grid>
        </Tabs.Content>

        <Tabs.Content value="revenue">
          <Grid columns={{ initial: "1", lg: "2" }} gap="6">
            {/* Revenue Summary */}
            <Card
              style={{
                ...iglooStyles.card,
                padding: "24px",
                background: iglooTheme.gradients.iceBlue,
                border: `2px solid ${iglooTheme.colors.primary[300]}`,
              }}
            >
              <Heading
                size="5"
                mb="4"
                style={{ color: iglooTheme.colors.primary[700] }}
              >
                💰 Revenue Summary
              </Heading>
              <Box mb="3">
                <Text size="2" style={{ color: iglooTheme.colors.ice[600] }}>
                  Total Revenue Earned
                </Text>
                <Heading
                  size="6"
                  style={{ color: iglooTheme.colors.primary[700] }}
                >
                  {formatPriceToSui(totalRevenue.toString())}
                </Heading>
              </Box>
              <Box mb="3">
                <Text size="2" style={{ color: iglooTheme.colors.ice[600] }}>
                  Total Games Sold
                </Text>
                <Heading
                  size="6"
                  style={{ color: iglooTheme.colors.primary[700] }}
                >
                  {totalSales}
                </Heading>
              </Box>
              <Box>
                <Text size="2" style={{ color: iglooTheme.colors.ice[600] }}>
                  Average Sale Price
                </Text>
                <Heading
                  size="6"
                  style={{ color: iglooTheme.colors.primary[700] }}
                >
                  {totalSales > 0
                    ? formatPriceToSui((totalRevenue / totalSales).toString())
                    : "0 SUI"}
                </Heading>
              </Box>
            </Card>

            {/* Per-Game Revenue */}
            <Card
              style={{
                ...iglooStyles.card,
                padding: "24px",
                background: iglooTheme.gradients.frostWhite,
              }}
            >
              <Heading
                size="5"
                mb="4"
                style={{ color: iglooTheme.colors.primary[700] }}
              >
                📊 Per-Game Revenue
              </Heading>
              <Box
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  padding: "2px",
                }}
              >
                {publishedGames.map((game) => (
                  <Card
                    key={game.id}
                    style={{
                      ...iglooStyles.card,
                      padding: "16px",
                      marginBottom: "12px",
                      background: iglooTheme.gradients.iceBlue,
                    }}
                  >
                    <Flex justify="between" align="start">
                      <Box style={{ display: "flex", flexDirection: "column" }}>
                        <Text
                          size="3"
                          weight="bold"
                          style={{ color: iglooTheme.colors.primary[700] }}
                        >
                          {game.title}
                        </Text>
                        <Text
                          size="2"
                          style={{
                            color: iglooTheme.colors.ice[600],
                            marginTop: "8px",
                          }}
                        >
                          {gameStats[game.gameId]?.totalSales || 0} sales
                        </Text>
                      </Box>
                      <Box
                        style={{
                          textAlign: "right",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: "8px",
                        }}
                      >
                        <Text
                          size="3"
                          weight="bold"
                          style={{ color: iglooTheme.colors.primary[700] }}
                        >
                          {formatPriceToSui(
                            (
                              gameStats[game.gameId]?.revenueBalance || 0
                            ).toString(),
                          )}
                        </Text>
                        <Button
                          size="1"
                          style={{
                            ...iglooStyles.button.primary,
                          }}
                          onClick={() => {
                            setSelectedGame(game as any);
                            setIsWithdrawModalOpen(true);
                          }}
                        >
                          💰 Withdraw
                        </Button>
                      </Box>
                    </Flex>
                  </Card>
                ))}
              </Box>
            </Card>
          </Grid>
        </Tabs.Content>

        <Tabs.Content value="publish">
          <GameUpload />
        </Tabs.Content>
      </Tabs.Root>

      {/* Withdraw Revenue Modal */}
      <Dialog.Root
        open={isWithdrawModalOpen}
        onOpenChange={setIsWithdrawModalOpen}
      >
        <Dialog.Content
          style={{
            maxWidth: "400px",
            padding: "24px",
            background: iglooTheme.gradients.frostWhite,
            border: `2px solid ${iglooTheme.colors.primary[300]}`,
            borderRadius: iglooTheme.borderRadius.igloo,
          }}
        >
          <Dialog.Title>
            <Heading
              size="5"
              mb="3"
              style={{ color: iglooTheme.colors.primary[700] }}
            >
              💰 Withdraw Revenue
            </Heading>
          </Dialog.Title>

          {selectedGame && (
            <Box mb="4">
              <Text
                size="3"
                weight="bold"
                style={{ color: iglooTheme.colors.primary[700] }}
              >
                {selectedGame.title}
              </Text>
              <Text size="2" style={{ color: iglooTheme.colors.ice[600] }}>
                Available:{" "}
                {formatPriceToSui(
                  (
                    gameStats[(selectedGame as any)?.gameId]?.revenueBalance ||
                    0
                  ).toString(),
                )}
              </Text>
            </Box>
          )}

          <Box mb="4">
            <Text size="2" mb="2" style={{ color: iglooTheme.colors.ice[700] }}>
              Amount (SUI)
            </Text>
            <TextField.Root
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.0"
              type="number"
              step="0.001"
            />
          </Box>

          <Flex gap="3" justify="end">
            <Button
              variant="soft"
              onClick={() => setIsWithdrawModalOpen(false)}
              disabled={isWithdrawing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdrawRevenue}
              disabled={isWithdrawing || !withdrawAmount}
              style={{ ...iglooStyles.button.primary }}
            >
              {isWithdrawing ? <Spinner size="1" /> : "Withdraw"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
}
