import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Text,
  Badge,
} from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { iglooTheme, iglooStyles } from "../theme";

interface FeatureCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  benefit: string;
}

interface StatCard {
  value: string;
  label: string;
  icon: string;
}

const features: FeatureCard[] = [
  {
    id: "1",
    icon: "🔒",
    title: "True Ownership",
    description:
      "Every game purchase mints an NFT that proves ownership forever",
    benefit: "Never lose access",
  },
  {
    id: "2",
    icon: "🌐",
    title: "Decentralized Storage",
    description: "Games stored on Walrus network, immune to censorship",
    benefit: "Games available permanently",
  },
  {
    id: "3",
    icon: "💰",
    title: "0% Platform Fees",
    description: "100% of your payment goes directly to game developers",
    benefit: "Support creators directly",
  },
  {
    id: "4",
    icon: "🔄",
    title: "Resale Rights",
    description: "Transfer your games to friends or sell on secondary markets",
    benefit: "Full ownership control",
  },
];

const stats: StatCard[] = [
  {
    value: "100%",
    label: "Developer Revenue",
    icon: "💎",
  },
  {
    value: "0%",
    label: "Platform Fees",
    icon: "⚡",
  },
  {
    value: "Forever",
    label: "Game Access",
    icon: "🛡️",
  },
];

export function HomePage() {
  return (
    <Box style={{ minHeight: "100vh" }}>
      {/* Hero Section */}
      <Box
        style={{
          background: iglooTheme.gradients.iglooMain,
          padding: "clamp(60px, 10vw, 120px) clamp(20px, 5vw, 60px)",
          textAlign: "center",
          borderRadius: iglooTheme.borderRadius.igloo,
          marginBottom: "clamp(40px, 8vw, 80px)",
          border: `2px solid ${iglooTheme.colors.ice[200]}`,
          boxShadow: iglooTheme.shadows.igloo,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decoration */}
        <Box
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            fontSize: "4rem",
            opacity: "0.1",
            transform: "rotate(15deg)",
          }}
        >
          ❄️
        </Box>
        <Box
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            fontSize: "3rem",
            opacity: "0.1",
            transform: "rotate(-15deg)",
          }}
        >
          🎮
        </Box>

        <Box
          style={{
            marginBottom: "clamp(24px, 4vw, 40px)",
            filter: "drop-shadow(0 8px 24px rgba(14, 165, 233, 0.4))",
            textAlign: "center",
          }}
        >
          <img
            src="/logo_transparent.png"
            alt="ColdCache Logo"
            style={{
              height: "clamp(180px, 25vw, 280px)",
              width: "auto",
              display: "inline-block",
            }}
          />
        </Box>

        <Heading
          size="9"
          style={{
            color: iglooTheme.colors.primary[700],
            textShadow: "0 4px 12px rgba(14, 165, 233, 0.3)",
            fontWeight: "700",
            lineHeight: "1.1",
            marginBottom: "clamp(16px, 3vw, 32px)",
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
          }}
        >
          Games You Own,
          <br />
          <span style={{ color: iglooTheme.colors.primary[600] }}>
            Permanently
          </span>
        </Heading>

        <Box
          style={{
            background: iglooTheme.gradients.frostWhite,
            padding: "clamp(20px, 4vw, 32px)",
            borderRadius: iglooTheme.borderRadius.arch,
            border: `2px solid ${iglooTheme.colors.primary[200]}`,
            maxWidth: "700px",
            margin: "0 auto clamp(32px, 6vw, 56px) auto",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(14, 165, 233, 0.15)",
          }}
        >
          <Flex align="center" justify="center" gap="4" mb="3">
            <Box
              style={{
                fontSize: "2.5rem",
                filter: "drop-shadow(0 4px 8px rgba(14, 165, 233, 0.4))",
                animation: "float 3s ease-in-out infinite",
              }}
            >
              ❄️
            </Box>
            <Text
              size="5"
              style={{
                color: iglooTheme.colors.ice[700],
                lineHeight: "1.5",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              True digital ownership powered by blockchain technology
            </Text>
          </Flex>
          <Text
            size="3"
            style={{
              color: iglooTheme.colors.ice[600],
              lineHeight: "1.5",
            }}
          >
            Every game purchase mints an NFT. No platform can revoke your
            access.
          </Text>
        </Box>

        <Flex gap="4" justify="center" wrap="wrap">
          <Link to="/store" style={{ textDecoration: "none" }}>
            <Button
              size="4"
              style={{
                ...iglooStyles.button.primary,
                fontSize: "clamp(16px, 2.5vw, 20px)",
                padding: "clamp(12px, 2vw, 20px) clamp(24px, 4vw, 40px)",
                boxShadow: "0 8px 24px rgba(14, 165, 233, 0.3)",
                transition: "all 0.3s ease",
                transform: "translateY(0)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 32px rgba(14, 165, 233, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(14, 165, 233, 0.3)";
              }}
            >
              🏪 Browse Games
            </Button>
          </Link>
          <Link to="/about" style={{ textDecoration: "none" }}>
            <Button
              size="4"
              style={{
                ...iglooStyles.button.secondary,
                fontSize: "clamp(16px, 2.5vw, 20px)",
                padding: "clamp(12px, 2vw, 20px) clamp(24px, 4vw, 40px)",
                boxShadow: "0 8px 24px rgba(100, 116, 139, 0.2)",
                transition: "all 0.3s ease",
                transform: "translateY(0)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 32px rgba(100, 116, 139, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(100, 116, 139, 0.2)";
              }}
            >
              ℹ️ Learn More
            </Button>
          </Link>
        </Flex>
      </Box>

      {/* Stats Section */}
      <Grid
        columns={{ initial: "1", sm: "3" }}
        gap="6"
        style={{ marginBottom: "clamp(60px, 10vw, 100px)" }}
      >
        {stats.map((stat, index) => (
          <Card
            key={index}
            style={{
              ...iglooStyles.card,
              padding: "clamp(24px, 4vw, 40px)",
              textAlign: "center",
              background: iglooTheme.gradients.frostWhite,
              border: `2px solid ${iglooTheme.colors.primary[200]}`,
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
              e.currentTarget.style.boxShadow = iglooTheme.shadows.igloo;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = iglooTheme.shadows.ice;
            }}
          >
            <Box
              style={{
                fontSize: "3rem",
                marginBottom: "16px",
                filter: "drop-shadow(0 4px 8px rgba(14, 165, 233, 0.3))",
              }}
            >
              {stat.icon}
            </Box>
            <Heading
              size="7"
              style={{
                color: iglooTheme.colors.primary[700],
                marginBottom: "8px",
                fontWeight: "700",
              }}
            >
              {stat.value}
            </Heading>
            <Text
              size="3"
              style={{
                color: iglooTheme.colors.ice[600],
                fontWeight: "500",
              }}
            >
              {stat.label}
            </Text>
          </Card>
        ))}
      </Grid>

      {/* Features Section */}
      <Box style={{ marginBottom: "clamp(60px, 10vw, 100px)" }}>
        <Box
          style={{
            textAlign: "center",
            marginBottom: "clamp(40px, 6vw, 60px)",
          }}
        >
          <Heading
            size="8"
            style={{
              color: iglooTheme.colors.primary[700],
              textShadow: "0 2px 8px rgba(14, 165, 233, 0.2)",
              marginBottom: "16px",
            }}
          >
            Why Choose ColdCache?
          </Heading>
          <Text
            size="4"
            style={{
              color: iglooTheme.colors.ice[600],
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: "1.6",
            }}
          >
            Revolutionary features that give you true control over your digital
            game collection
          </Text>
        </Box>

        <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="6">
          {features.map((feature, index) => (
            <Card
              key={feature.id}
              style={{
                ...iglooStyles.card,
                height: "100%",
                padding: "clamp(24px, 4vw, 32px)",
                background: iglooTheme.gradients.frostWhite,
                border: `2px solid ${iglooTheme.colors.primary[100]}`,
                transition: "all 0.4s ease",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-12px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(14, 165, 233, 0.2)";
                e.currentTarget.style.borderColor =
                  iglooTheme.colors.primary[300];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = iglooTheme.shadows.ice;
                e.currentTarget.style.borderColor =
                  iglooTheme.colors.primary[100];
              }}
            >
              {/* Background decoration */}
              <Box
                style={{
                  position: "absolute",
                  top: "-20px",
                  right: "-20px",
                  fontSize: "6rem",
                  opacity: "0.05",
                  transform: "rotate(15deg)",
                }}
              >
                {feature.icon}
              </Box>

              <Box
                style={{
                  fontSize: "3rem",
                  marginBottom: "20px",
                  filter: "drop-shadow(0 4px 8px rgba(14, 165, 233, 0.3))",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {feature.icon}
              </Box>

              <Heading
                size="5"
                style={{
                  color: iglooTheme.colors.primary[700],
                  marginBottom: "12px",
                  fontWeight: "600",
                }}
              >
                {feature.title}
              </Heading>

              <Text
                size="3"
                style={{
                  color: iglooTheme.colors.ice[600],
                  lineHeight: "1.5",
                  marginBottom: "16px",
                }}
              >
                {feature.description}
              </Text>

              <Badge
                color="blue"
                style={{
                  background: iglooTheme.colors.primary[100],
                  color: iglooTheme.colors.primary[700],
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                {feature.benefit}
              </Badge>
            </Card>
          ))}
        </Grid>
      </Box>

      {/* Mission Statement */}
      <Card
        style={{
          ...iglooStyles.card,
          padding: "clamp(40px, 8vw, 80px)",
          marginBottom: "clamp(60px, 10vw, 100px)",
          background: iglooTheme.gradients.iceBlue,
          border: `2px solid ${iglooTheme.colors.primary[300]}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorations */}
        <Box
          style={{
            position: "absolute",
            top: "40px",
            right: "40px",
            fontSize: "8rem",
            opacity: "0.08",
            transform: "rotate(-15deg)",
          }}
        >
          🌐
        </Box>
        <Box
          style={{
            position: "absolute",
            bottom: "40px",
            left: "40px",
            fontSize: "6rem",
            opacity: "0.08",
            transform: "rotate(25deg)",
          }}
        >
          🔗
        </Box>

        <Grid columns={{ initial: "1", lg: "2" }} gap="8" align="center">
          <Box style={{ position: "relative", zIndex: 1 }}>
            <Heading
              size="8"
              style={{
                color: iglooTheme.colors.primary[700],
                textShadow: "0 2px 8px rgba(14, 165, 233, 0.2)",
                marginBottom: "24px",
                lineHeight: "1.2",
              }}
            >
              Revolutionizing Game Distribution
            </Heading>
            <Text
              size="4"
              style={{
                color: iglooTheme.colors.ice[700],
                lineHeight: "1.7",
                marginBottom: "24px",
              }}
            >
              ColdCache transforms game distribution by combining blockchain
              ownership with decentralized storage. When you buy a game, you
              receive an NFT that proves ownership forever.
            </Text>
            <Text
              size="4"
              style={{
                color: iglooTheme.colors.ice[700],
                lineHeight: "1.7",
                marginBottom: "32px",
              }}
            >
              No more losing access when platforms shut down. Your games are
              stored on the decentralized Walrus network and are truly yours,
              permanently.
            </Text>
            <Flex gap="4" wrap="wrap">
              <Link to="/store" style={{ textDecoration: "none" }}>
                <Button
                  size="3"
                  style={{
                    ...iglooStyles.button.primary,
                    padding: "12px 24px",
                    boxShadow: "0 4px 16px rgba(14, 165, 233, 0.3)",
                  }}
                >
                  🏪 Explore Games
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
          </Box>

          <Box
            style={{
              textAlign: "center",
              background: iglooTheme.gradients.frostWhite,
              padding: "clamp(32px, 6vw, 60px)",
              borderRadius: iglooTheme.borderRadius.igloo,
              border: `2px solid ${iglooTheme.colors.primary[200]}`,
              boxShadow: "0 12px 32px rgba(14, 165, 233, 0.15)",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box
              style={{
                fontSize: "5rem",
                marginBottom: "24px",
                filter: "drop-shadow(0 8px 16px rgba(14, 165, 233, 0.4))",
                animation: "pulse 2s ease-in-out infinite",
              }}
            >
              🎮
            </Box>
            <Heading
              size="5"
              style={{
                color: iglooTheme.colors.primary[700],
                marginBottom: "16px",
                fontWeight: "600",
              }}
            >
              Blockchain-Secured
            </Heading>
            <Text
              size="3"
              style={{
                color: iglooTheme.colors.ice[600],
                lineHeight: "1.5",
              }}
            >
              Every game is protected by cryptographic ownership proofs on the
              Sui blockchain
            </Text>
          </Box>
        </Grid>
      </Card>

      {/* CTA Section */}
      <Card
        style={{
          ...iglooStyles.card,
          background: iglooTheme.gradients.iglooMain,
          padding: "clamp(40px, 8vw, 80px) clamp(24px, 6vw, 48px)",
          textAlign: "center",
          border: `3px solid ${iglooTheme.colors.primary[300]}`,
          boxShadow: "0 20px 60px rgba(14, 165, 233, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated background elements */}
        <Box
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            fontSize: "3rem",
            opacity: "0.1",
            animation: "float 4s ease-in-out infinite",
          }}
        >
          ⭐
        </Box>
        <Box
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            fontSize: "4rem",
            opacity: "0.1",
            animation: "float 3s ease-in-out infinite reverse",
          }}
        >
          🚀
        </Box>

        <Box
          style={{
            fontSize: "4rem",
            marginBottom: "24px",
            filter: "drop-shadow(0 8px 16px rgba(14, 165, 233, 0.4))",
            animation: "bounce 2s ease-in-out infinite",
            position: "relative",
            zIndex: 1,
          }}
        >
          🎯
        </Box>
        <Heading
          size="7"
          style={{
            color: iglooTheme.colors.primary[700],
            marginBottom: "16px",
            fontWeight: "700",
            position: "relative",
            zIndex: 1,
          }}
        >
          Ready to Own Your Games Forever?
        </Heading>
        <Text
          size="4"
          style={{
            color: iglooTheme.colors.ice[700],
            lineHeight: "1.6",
            marginBottom: "32px",
            maxWidth: "600px",
            margin: "0 auto 32px auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          Join thousands of gamers who have taken control of their digital
          collections. Experience true ownership today.
        </Text>
        <Flex
          gap="4"
          justify="center"
          wrap="wrap"
          style={{ position: "relative", zIndex: 1 }}
        >
          <Link to="/store" style={{ textDecoration: "none" }}>
            <Button
              size="4"
              style={{
                ...iglooStyles.button.primary,
                padding: "16px 32px",
                fontSize: "18px",
                boxShadow: "0 8px 24px rgba(14, 165, 233, 0.4)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-2px) scale(1.05)";
                e.currentTarget.style.boxShadow =
                  "0 12px 32px rgba(14, 165, 233, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(14, 165, 233, 0.4)";
              }}
            >
              🏪 Start Exploring
            </Button>
          </Link>
          <Link to="/library" style={{ textDecoration: "none" }}>
            <Button
              size="4"
              style={{
                ...iglooStyles.button.secondary,
                padding: "16px 32px",
                fontSize: "18px",
                boxShadow: "0 8px 24px rgba(100, 116, 139, 0.3)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-2px) scale(1.05)";
                e.currentTarget.style.boxShadow =
                  "0 12px 32px rgba(100, 116, 139, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(100, 116, 139, 0.3)";
              }}
            >
              📚 View My Library
            </Button>
          </Link>
        </Flex>
      </Card>

      {/* Add CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </Box>
  );
}
