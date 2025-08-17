import { Box, Button, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { iglooTheme, iglooStyles } from "../theme";

interface FeaturedGame {
  id: string;
  title: string;
  image: string;
  status: "mint" | "download";
  description: string;
}

const featuredGames: FeaturedGame[] = [
  {
    id: "1",
    title: "Crypto Quest",
    image: "🗡️",
    status: "mint",
    description: "Embark on an epic blockchain adventure",
  },
  {
    id: "2",
    title: "Pixel Ron",
    image: "🏎️",
    status: "mint",
    description: "High-speed racing in neon cityscapes",
  },
  {
    id: "3",
    title: "Fantasy",
    image: "⚔️",
    status: "download",
    description: "Battle mythical creatures in enchanted realms",
  },
  {
    id: "4",
    title: "Cyber City",
    image: "🏙️",
    status: "mint",
    description: "Build your futuristic metropolis",
  },
];

export function HomePage() {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        style={{
          background: iglooTheme.gradients.iglooMain,
          padding: "80px 40px",
          textAlign: "center",
          borderRadius: iglooTheme.borderRadius.igloo,
          marginBottom: "60px",
          border: `1px solid ${iglooTheme.colors.ice[200]}`,
          boxShadow: iglooTheme.shadows.igloo,
        }}
      >
        <Box
          style={{
            marginBottom: "24px",
            filter: "drop-shadow(0 8px 16px rgba(14, 165, 233, 0.3))",
            textAlign: "center",
          }}
        >
          <img
            src="/cc_logo.PNG"
            alt="ColdCache Logo"
            style={{
              height: "120px",
              width: "auto",
              display: "inline-block",
            }}
          />
        </Box>

        <Heading
          size="9"
          mb="6"
          style={{
            color: iglooTheme.colors.primary[700],
            textShadow: "0 2px 8px rgba(14, 165, 233, 0.2)",
            fontWeight: "700",
            lineHeight: "1.1",
          }}
        >
          Games You Own,
          <br />
          Permanently
        </Heading>

        <Flex
          align="center"
          justify="center"
          gap="3"
          mb="8"
          style={{
            background: iglooTheme.gradients.frostWhite,
            padding: "24px",
            borderRadius: iglooTheme.borderRadius.arch,
            border: `1px solid ${iglooTheme.colors.primary[200]}`,
            maxWidth: "600px",
            margin: "0 auto 48px auto",
          }}
        >
          <Box
            style={{
              fontSize: "2rem",
              filter: "drop-shadow(0 2px 4px rgba(14, 165, 233, 0.3))",
            }}
          >
            ❄️
          </Box>
          <Text
            size="5"
            style={{
              color: iglooTheme.colors.ice[700],
              lineHeight: "1.5",
              fontWeight: "500",
            }}
          >
            We guarantee uninterrupted download access for every game you
            purchase.
          </Text>
        </Flex>

        <Link to="/store" style={{ textDecoration: "none" }}>
          <Button
            size="4"
            style={{
              ...iglooStyles.button.primary,
              fontSize: "18px",
              padding: "16px 32px",
              boxShadow: iglooTheme.shadows.ice,
            }}
          >
            Learn More
          </Button>
        </Link>
      </Box>

      {/* Mission Statement */}
      <Card
        style={{
          ...iglooStyles.card,
          padding: "48px",
          marginBottom: "60px",
          background: iglooTheme.gradients.frostWhite,
        }}
      >
        <Grid columns={{ initial: "1", md: "2" }} gap="6" align="center">
          <Box>
            <Heading
              size="7"
              mb="4"
              style={{
                color: iglooTheme.colors.primary[700],
                textShadow: "0 1px 4px rgba(14, 165, 233, 0.1)",
              }}
            >
              True Digital Ownership
            </Heading>
            <Text
              size="4"
              style={{
                color: iglooTheme.colors.ice[700],
                lineHeight: "1.6",
                marginBottom: "24px",
              }}
            >
              ColdCache revolutionizes game distribution by storing your games
              on decentralized Walrus storage and registering ownership on the
              Sui blockchain.
            </Text>
            <Text
              size="4"
              style={{
                color: iglooTheme.colors.ice[700],
                lineHeight: "1.6",
              }}
            >
              No more losing access when platforms shut down. Your games are
              truly yours, forever.
            </Text>
          </Box>
          <Box
            style={{
              textAlign: "center",
              background: iglooTheme.gradients.iceBlue,
              padding: "40px",
              borderRadius: iglooTheme.borderRadius.igloo,
              border: `1px solid ${iglooTheme.colors.primary[200]}`,
            }}
          >
            <Box
              style={{
                fontSize: "4rem",
                marginBottom: "16px",
                filter: "drop-shadow(0 4px 8px rgba(14, 165, 233, 0.3))",
              }}
            >
              🔒
            </Box>
            <Text
              size="3"
              weight="bold"
              style={{
                color: iglooTheme.colors.primary[700],
              }}
            >
              Blockchain-Secured
              <br />
              Game Ownership
            </Text>
          </Box>
        </Grid>
      </Card>

      {/* Featured Games Section */}
      <Box mb="8">
        <Heading
          size="7"
          mb="6"
          style={{
            color: iglooTheme.colors.primary[700],
            textShadow: "0 1px 4px rgba(14, 165, 233, 0.1)",
          }}
        >
          Featured
        </Heading>

        <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4">
          {featuredGames.map((game) => (
            <Card
              key={game.id}
              style={{
                ...iglooStyles.card,
                height: "100%",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = iglooTheme.shadows.igloo;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = iglooTheme.shadows.ice;
              }}
            >
              {/* Game Image */}
              <Box
                style={{
                  height: "160px",
                  background: iglooTheme.gradients.coolBlue,
                  borderRadius: `${iglooTheme.borderRadius.arch} ${iglooTheme.borderRadius.arch} 0 0`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "4rem",
                  filter: "drop-shadow(0 2px 8px rgba(14, 165, 233, 0.2))",
                  marginBottom: "16px",
                }}
              >
                {game.image}
              </Box>

              <Box style={{ padding: "0 16px 16px 16px" }}>
                {/* Title */}
                <Heading
                  size="4"
                  mb="2"
                  style={{
                    color: iglooTheme.colors.primary[700],
                  }}
                >
                  {game.title}
                </Heading>

                {/* Description */}
                <Text
                  size="2"
                  mb="4"
                  style={{
                    color: iglooTheme.colors.ice[600],
                    lineHeight: "1.4",
                  }}
                >
                  {game.description}
                </Text>

                {/* Action Button */}
                <Button
                  size="2"
                  style={{
                    width: "100%",
                    ...(game.status === "mint"
                      ? iglooStyles.button.primary
                      : iglooStyles.button.secondary),
                    fontSize: "14px",
                  }}
                >
                  {game.status === "mint" ? "❄️ Mint" : "⬇️ Download"}
                </Button>
              </Box>
            </Card>
          ))}
        </Grid>
      </Box>

      {/* CTA Section */}
      <Card
        style={{
          ...iglooStyles.card,
          background: iglooTheme.gradients.iceBlue,
          padding: "48px",
          textAlign: "center",
          border: `2px solid ${iglooTheme.colors.primary[300]}`,
        }}
      >
        <Box
          style={{
            fontSize: "3rem",
            marginBottom: "24px",
            filter: "drop-shadow(0 4px 8px rgba(14, 165, 233, 0.3))",
          }}
        >
          🎮
        </Box>
        <Heading
          size="6"
          mb="4"
          style={{
            color: iglooTheme.colors.primary[700],
          }}
        >
          Ready to Own Your Games Forever?
        </Heading>
        <Text
          size="4"
          mb="6"
          style={{
            color: iglooTheme.colors.ice[700],
            lineHeight: "1.5",
          }}
        >
          Join the revolution in game ownership. Discover, purchase, and truly
          own your favorite games on the blockchain.
        </Text>
        <Flex gap="4" justify="center">
          <Link to="/store" style={{ textDecoration: "none" }}>
            <Button
              size="3"
              style={{
                ...iglooStyles.button.primary,
                padding: "12px 24px",
              }}
            >
              🏪 Explore Store
            </Button>
          </Link>
          <Link to="/publish" style={{ textDecoration: "none" }}>
            <Button
              size="3"
              style={{
                ...iglooStyles.button.secondary,
                padding: "12px 24px",
              }}
            >
              📤 Publish Game
            </Button>
          </Link>
        </Flex>
      </Card>
    </Box>
  );
}
