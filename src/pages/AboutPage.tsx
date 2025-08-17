import { Box, Card, Flex, Heading, Text, Badge, Grid } from "@radix-ui/themes";
import { iglooTheme, iglooStyles } from "../theme";

export default function AboutPage() {
  return (
    <Box style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Hero Section */}
      <Card
        style={{
          ...iglooStyles.card,
          background: iglooTheme.gradients.iceBlue,
          padding: "48px 32px",
          textAlign: "center",
          border: `2px solid ${iglooTheme.colors.primary[300]}`,
          marginBottom: "32px",
        }}
      >
        <Heading
          size="8"
          style={{
            marginBottom: "16px",
            color: iglooTheme.colors.primary[900],
          }}
        >
          ColdCache: Decentralized Game Store
        </Heading>
        <Text
          size="5"
          style={{
            color: iglooTheme.colors.primary[700],
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          Give game ownership back to the owners without censorship, freedom of
          resale, and permanent access
        </Text>
      </Card>

      {/* Problem Section */}
      <Card
        style={{ ...iglooStyles.card, marginBottom: "32px", padding: "32px" }}
      >
        <Heading
          size="6"
          style={{
            marginBottom: "24px",
            color: iglooTheme.colors.primary[900],
          }}
        >
          🚫 The Problem: Digital Ownership is Broken
        </Heading>

        <Grid columns={{ initial: "1", md: "3" }} gap="24px">
          {/* Censorship */}
          <Card
            style={{
              ...iglooStyles.card,
              padding: "24px",
              background: iglooTheme.colors.primary[50],
            }}
          >
            <Heading
              size="4"
              style={{
                marginBottom: "16px",
                color: iglooTheme.colors.primary[800],
              }}
            >
              Censorship
            </Heading>
            <Text
              style={{
                marginBottom: "16px",
                color: iglooTheme.colors.primary[700],
              }}
            >
              Games purchased on platforms like itch.io were deleted and became
              undownloadable due to Visa & Mastercard issues.
            </Text>
            <Badge color="red" style={{ marginTop: "8px" }}>
              No Download Access
            </Badge>
          </Card>

          {/* No Resale */}
          <Card
            style={{
              ...iglooStyles.card,
              padding: "24px",
              background: iglooTheme.colors.ice[50],
            }}
          >
            <Heading
              size="4"
              style={{
                marginBottom: "16px",
                color: iglooTheme.colors.ice[800],
              }}
            >
              No Resale Rights
            </Heading>
            <Text
              style={{
                marginBottom: "16px",
                color: iglooTheme.colors.ice[700],
              }}
            >
              Digital games cannot be resold, eliminating secondary markets and
              community resources like libraries.
            </Text>
            <Badge color="orange" style={{ marginTop: "8px" }}>
              Zero Transfer Rights
            </Badge>
          </Card>

          {/* Platform Monopolies */}
          <Card
            style={{
              ...iglooStyles.card,
              padding: "24px",
              background: iglooTheme.colors.primary[50],
            }}
          >
            <Heading
              size="4"
              style={{
                marginBottom: "16px",
                color: iglooTheme.colors.primary[800],
              }}
            >
              Platform Monopolies
            </Heading>
            <Text
              style={{
                marginBottom: "16px",
                color: iglooTheme.colors.primary[700],
              }}
            >
              Consumers have zero control over digital purchases. Developers
              forced to accept 30% platform cuts.
            </Text>
            <Badge color="blue" style={{ marginTop: "8px" }}>
              30% Platform Tax
            </Badge>
          </Card>
        </Grid>
      </Card>

      {/* Solution Section */}
      <Card
        style={{ ...iglooStyles.card, marginBottom: "32px", padding: "32px" }}
      >
        <Heading
          size="6"
          style={{
            marginBottom: "24px",
            color: iglooTheme.colors.primary[900],
          }}
        >
          ✅ The ColdCache Solution
        </Heading>

        <Grid columns={{ initial: "1", md: "2" }} gap="32px">
          <Box>
            <Heading
              size="4"
              style={{
                marginBottom: "16px",
                color: iglooTheme.colors.primary[800],
              }}
            >
              🔒 Permanent Ownership Guarantee
            </Heading>
            <Text
              style={{
                marginBottom: "16px",
                color: iglooTheme.colors.ice[700],
              }}
            >
              Every game purchase mints an NFT that proves ownership forever.
              Your games are stored on decentralized infrastructure,
              guaranteeing uninterrupted access.
            </Text>
            <Badge color="green" style={{ marginBottom: "16px" }}>
              NFT = Permanent Access
            </Badge>
            <Text
              style={{
                fontSize: "14px",
                color: iglooTheme.colors.ice[600],
              }}
            >
              <strong>Technical Implementation:</strong> When you purchase a
              game, our smart contract mints an NFT and stores the encrypted
              game on Walrus decentralized storage. The NFT acts as your
              cryptographic key to access the game forever.
            </Text>
          </Box>

          <Box>
            <Heading
              size="4"
              style={{
                marginBottom: "16px",
                color: iglooTheme.colors.primary[800],
              }}
            >
              💰 Fair Revenue Distribution
            </Heading>
            <Text
              style={{
                marginBottom: "16px",
                color: iglooTheme.colors.ice[700],
              }}
            >
              Traditional storefronts take 30% of sales. ColdCache forwards 100%
              of sales directly to publishers, who can allocate funds as they
              choose.
            </Text>
            <Badge color="green" style={{ marginBottom: "16px" }}>
              0% Platform Fee
            </Badge>
            <br />
            <Text
              style={{
                fontSize: "14px",
                color: iglooTheme.colors.ice[600],
              }}
            >
              <strong>Tokenomics:</strong> Publishers receive 100% of sale
              proceeds instantly via blockchain transaction. Part of sales can
              optionally go towards data permanence on Walrus storage to ensure
              eternal game availability.
            </Text>
          </Box>
        </Grid>
      </Card>

      {/* Technical Architecture */}
      <Card
        style={{ ...iglooStyles.card, marginBottom: "32px", padding: "32px" }}
      >
        <Heading
          size="6"
          style={{
            marginBottom: "24px",
            color: iglooTheme.colors.primary[900],
          }}
        >
          🏗️ Technical Architecture Guarantees
        </Heading>

        <Grid columns={{ initial: "1", md: "3" }} gap="24px">
          {/* Blockchain Layer */}
          <Card
            style={{
              ...iglooStyles.card,
              padding: "20px",
              background: iglooTheme.colors.primary[50],
            }}
          >
            <Heading
              size="3"
              style={{
                marginBottom: "12px",
                color: iglooTheme.colors.primary[800],
              }}
            >
              Sui Blockchain
            </Heading>
            <Text
              style={{
                fontSize: "14px",
                marginBottom: "12px",
                color: iglooTheme.colors.primary[700],
              }}
            >
              Smart contracts enforce ownership rights and payment distribution
              automatically.
            </Text>
            <Box style={{ marginTop: "12px" }}>
              <Badge
                color="blue"
                style={{ marginRight: "8px", marginBottom: "4px" }}
              >
                NFT Ownership
              </Badge>
              <Badge
                color="blue"
                style={{ marginRight: "8px", marginBottom: "4px" }}
              >
                Instant Payments
              </Badge>
              <Badge color="blue" style={{ marginBottom: "4px" }}>
                Immutable Records
              </Badge>
            </Box>
          </Card>

          {/* Storage Layer */}
          <Card
            style={{
              ...iglooStyles.card,
              padding: "20px",
              background: iglooTheme.colors.primary[50],
            }}
          >
            <Heading
              size="3"
              style={{
                marginBottom: "12px",
                color: iglooTheme.colors.primary[800],
              }}
            >
              Walrus Storage
            </Heading>
            <Text
              style={{
                fontSize: "14px",
                marginBottom: "12px",
                color: iglooTheme.colors.primary[700],
              }}
            >
              Decentralized storage ensures your games remain accessible
              forever, immune to censorship.
            </Text>
            <Box style={{ marginTop: "12px" }}>
              <Badge
                color="green"
                style={{ marginRight: "8px", marginBottom: "4px" }}
              >
                Censorship Resistant
              </Badge>
              <Badge
                color="green"
                style={{ marginRight: "8px", marginBottom: "4px" }}
              >
                Redundant Copies
              </Badge>
              <Badge color="green" style={{ marginBottom: "4px" }}>
                Global CDN
              </Badge>
            </Box>
          </Card>

          {/* Security Layer */}
          <Card
            style={{
              ...iglooStyles.card,
              padding: "20px",
              background: iglooTheme.colors.ice[50],
            }}
          >
            <Heading
              size="3"
              style={{
                marginBottom: "12px",
                color: iglooTheme.colors.ice[800],
              }}
            >
              Seal Encryption
            </Heading>
            <Text
              style={{
                fontSize: "14px",
                marginBottom: "12px",
                color: iglooTheme.colors.ice[700],
              }}
            >
              Token-gated encryption ensures only NFT owners can decrypt and
              access their purchased games.
            </Text>
            <Box style={{ marginTop: "12px" }}>
              <Badge
                color="orange"
                style={{ marginRight: "8px", marginBottom: "4px" }}
              >
                Access Control
              </Badge>
              <Badge
                color="orange"
                style={{ marginRight: "8px", marginBottom: "4px" }}
              >
                Encrypted Storage
              </Badge>
              <Badge color="orange" style={{ marginBottom: "4px" }}>
                Secure Downloads
              </Badge>
            </Box>
          </Card>
        </Grid>
      </Card>

      {/* Cost Comparison */}
      <Card
        style={{ ...iglooStyles.card, marginBottom: "32px", padding: "32px" }}
      >
        <Heading
          size="6"
          style={{
            marginBottom: "24px",
            color: iglooTheme.colors.primary[900],
          }}
        >
          💸 Cost Comparison: ColdCache vs Traditional Platforms
        </Heading>

        <Grid columns={{ initial: "1", md: "2" }} gap="32px">
          {/* Traditional Platforms */}
          <Card
            style={{
              ...iglooStyles.card,
              padding: "24px",
              background: iglooTheme.colors.primary[50],
            }}
          >
            <Heading
              size="4"
              style={{
                marginBottom: "16px",
                color: iglooTheme.colors.primary[800],
              }}
            >
              Traditional Platforms (Steam, Epic, etc.)
            </Heading>
            <Flex direction="column" gap="12px">
              <Flex justify="between" align="center">
                <Text style={{ color: iglooTheme.colors.primary[700] }}>
                  Platform Fee
                </Text>
                <Badge color="red" size="2">
                  30%
                </Badge>
              </Flex>
              <Flex justify="between" align="center">
                <Text style={{ color: iglooTheme.colors.primary[700] }}>
                  Payment Processing
                </Text>
                <Badge color="red" size="2">
                  2-3%
                </Badge>
              </Flex>
              <Flex justify="between" align="center">
                <Text style={{ color: iglooTheme.colors.primary[700] }}>
                  Developer Revenue
                </Text>
                <Badge color="red" size="2">
                  ~67%
                </Badge>
              </Flex>
              <Box
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: iglooTheme.colors.primary[100],
                  borderRadius: "8px",
                }}
              >
                <Text
                  style={{
                    fontSize: "14px",
                    color: iglooTheme.colors.primary[800],
                  }}
                >
                  <strong>Ownership:</strong> Platform controls access, can
                  revoke games
                </Text>
              </Box>
            </Flex>
          </Card>

          {/* ColdCache */}
          <Card
            style={{
              ...iglooStyles.card,
              padding: "24px",
              background: iglooTheme.colors.primary[50],
            }}
          >
            <Heading
              size="4"
              style={{
                marginBottom: "16px",
                color: iglooTheme.colors.primary[800],
              }}
            >
              ColdCache Platform
            </Heading>
            <Flex direction="column" gap="12px">
              <Flex justify="between" align="center">
                <Text style={{ color: iglooTheme.colors.primary[700] }}>
                  Platform Fee
                </Text>
                <Badge color="green" size="2">
                  0%
                </Badge>
              </Flex>
              <Flex justify="between" align="center">
                <Text style={{ color: iglooTheme.colors.primary[700] }}>
                  Blockchain Gas
                </Text>
                <Badge color="green" size="2">
                  ~$0.01
                </Badge>
              </Flex>
              <Flex justify="between" align="center">
                <Text style={{ color: iglooTheme.colors.primary[700] }}>
                  Developer Revenue
                </Text>
                <Badge color="green" size="2">
                  ~100%
                </Badge>
              </Flex>
              <Box
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: iglooTheme.colors.primary[100],
                  borderRadius: "8px",
                }}
              >
                <Text
                  style={{
                    fontSize: "14px",
                    color: iglooTheme.colors.primary[800],
                  }}
                >
                  <strong>Ownership:</strong> Player owns NFT, permanent access
                  guaranteed
                </Text>
              </Box>
            </Flex>
          </Card>
        </Grid>
      </Card>

      {/* How It Works */}
      <Card
        style={{ ...iglooStyles.card, marginBottom: "32px", padding: "32px" }}
      >
        <Heading
          size="6"
          style={{
            marginBottom: "24px",
            color: iglooTheme.colors.primary[900],
          }}
        >
          🔄 How ColdCache Works
        </Heading>

        <Grid columns={{ initial: "1", md: "3" }} gap="24px">
          {/* Step 1 */}
          <Card
            style={{
              ...iglooStyles.card,
              padding: "20px",
              background: iglooTheme.colors.primary[50],
            }}
          >
            <Badge color="blue" size="3" style={{ marginBottom: "12px" }}>
              Step 1
            </Badge>
            <Heading
              size="3"
              style={{
                marginBottom: "12px",
                color: iglooTheme.colors.primary[800],
              }}
            >
              Game Publishing
            </Heading>
            <Text
              style={{
                fontSize: "14px",
                color: iglooTheme.colors.primary[700],
              }}
            >
              Developer uploads game to Walrus storage, encrypts it with Seal,
              and creates an NFT collection on Sui blockchain.
            </Text>
          </Card>

          {/* Step 2 */}
          <Card
            style={{
              ...iglooStyles.card,
              padding: "20px",
              background: iglooTheme.colors.primary[50],
            }}
          >
            <Badge color="green" size="3" style={{ marginBottom: "12px" }}>
              Step 2
            </Badge>
            <Heading
              size="3"
              style={{
                marginBottom: "12px",
                color: iglooTheme.colors.primary[800],
              }}
            >
              Game Purchasing
            </Heading>
            <Text
              style={{
                fontSize: "14px",
                color: iglooTheme.colors.primary[700],
              }}
            >
              Player pays with crypto, NFT is minted to their wallet, and
              payment goes 100% to the publisher instantly.
            </Text>
          </Card>

          {/* Step 3 */}
          <Card
            style={{
              ...iglooStyles.card,
              padding: "20px",
              background: iglooTheme.colors.ice[50],
            }}
          >
            <Badge color="orange" size="3" style={{ marginBottom: "12px" }}>
              Step 3
            </Badge>
            <Heading
              size="3"
              style={{
                marginBottom: "12px",
                color: iglooTheme.colors.ice[800],
              }}
            >
              Game Access
            </Heading>
            <Text
              style={{
                fontSize: "14px",
                color: iglooTheme.colors.ice[700],
              }}
            >
              NFT owner can download and decrypt the game anytime. Smart
              contract verifies ownership before granting access.
            </Text>
          </Card>
        </Grid>
      </Card>

      {/* Benefits */}
      <Card
        style={{
          ...iglooStyles.card,
          background: iglooTheme.gradients.iceBlue,
          padding: "32px",
          textAlign: "center",
          border: `2px solid ${iglooTheme.colors.primary[300]}`,
        }}
      >
        <Heading
          size="6"
          style={{
            marginBottom: "24px",
            color: iglooTheme.colors.primary[900],
          }}
        >
          🎮 Why ColdCache Changes Everything
        </Heading>

        <Grid
          columns={{ initial: "1", md: "2" }}
          gap="24px"
          style={{ textAlign: "left" }}
        >
          <Box>
            <Heading
              size="4"
              style={{
                marginBottom: "16px",
                color: iglooTheme.colors.primary[800],
              }}
            >
              For Players
            </Heading>
            <Flex direction="column" gap="8px">
              <Text style={{ color: iglooTheme.colors.primary[700] }}>
                • True ownership that can't be revoked
              </Text>
              <Text style={{ color: iglooTheme.colors.primary[700] }}>
                • Ability to resell games to other players
              </Text>
              <Text style={{ color: iglooTheme.colors.primary[700] }}>
                • Censorship-resistant game access
              </Text>
              <Text style={{ color: iglooTheme.colors.primary[700] }}>
                • Games work forever, no platform dependency
              </Text>
            </Flex>
          </Box>

          <Box>
            <Heading
              size="4"
              style={{
                marginBottom: "16px",
                color: iglooTheme.colors.primary[800],
              }}
            >
              For Developers
            </Heading>
            <Flex direction="column" gap="8px">
              <Text style={{ color: iglooTheme.colors.primary[700] }}>
                • Keep 100% of revenue (minus minimal gas fees)
              </Text>
              <Text style={{ color: iglooTheme.colors.primary[700] }}>
                • No platform restrictions or censorship
              </Text>
              <Text style={{ color: iglooTheme.colors.primary[700] }}>
                • Global distribution with permanent availability
              </Text>
              <Text style={{ color: iglooTheme.colors.primary[700] }}>
                • Direct connection with players
              </Text>
            </Flex>
          </Box>
        </Grid>
      </Card>
    </Box>
  );
}
