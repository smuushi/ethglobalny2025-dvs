import { useCurrentAccount, ConnectButton } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { iglooTheme, iglooStyles } from "../theme";

interface WalletRequiredWrapperProps {
  children: React.ReactNode;
  pageName?: string;
}

export function WalletRequiredWrapper({
  children,
  pageName = "this page",
}: WalletRequiredWrapperProps) {
  const currentAccount = useCurrentAccount();

  if (!currentAccount) {
    return (
      <Box style={iglooStyles.container}>
        <Flex
          justify="center"
          align="center"
          style={{
            minHeight: "70vh",
          }}
        >
          <Box
            style={{
              ...iglooStyles.card,
              padding: "clamp(32px, 6vw, 48px)",
              textAlign: "center",
              maxWidth: "600px",
              background: iglooTheme.gradients.frostWhite,
              border: `2px solid ${iglooTheme.colors.primary[300]}`,
              boxShadow: iglooTheme.shadows.igloo,
              marginTop: "100px",
            }}
          >
            <Box
              style={{
                marginBottom: "24px",
                filter: "drop-shadow(0 4px 8px rgba(14, 165, 233, 0.3))",
                textAlign: "center",
              }}
            >
              <img
                src="/logo_filled.png"
                alt="ColdCache Logo"
                style={{
                  height: "clamp(80px, 15vw, 120px)",
                  width: "auto",
                  display: "inline-block",
                }}
              />
            </Box>

            <Box
              style={{
                fontSize: "3rem",
                marginBottom: "16px",
                filter: "drop-shadow(0 4px 8px rgba(14, 165, 233, 0.3))",
              }}
            >
              🔐
            </Box>

            <Heading
              size="7"
              style={{
                color: iglooTheme.colors.primary[700],
                textShadow: "0 2px 4px rgba(14, 165, 233, 0.1)",
                marginBottom: "16px",
              }}
            >
              Wallet Required
            </Heading>

            <Text
              size="4"
              style={{
                color: iglooTheme.colors.ice[600],
                fontWeight: "400",
                lineHeight: "1.6",
                marginBottom: "24px",
              }}
            >
              You need to connect your Sui wallet to access {pageName}
            </Text>

            <Box
              style={{
                background: iglooTheme.gradients.iceBlue,
                padding: "24px",
                borderRadius: iglooTheme.borderRadius.arch,
                border: `1px solid ${iglooTheme.colors.primary[200]}`,
                marginBottom: "32px",
              }}
            >
              <Text
                size="3"
                style={{
                  color: iglooTheme.colors.ice[600],
                  marginBottom: "20px",
                  lineHeight: "1.5",
                }}
              >
                Connect your wallet to explore games, manage your library, and
                publish your own creations
              </Text>

              <Box
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <ConnectButton />
              </Box>
            </Box>

            <Flex gap="3" justify="center" wrap="wrap">
              <Link to="/" style={{ textDecoration: "none" }}>
                <Button
                  size="3"
                  style={{
                    ...iglooStyles.button.secondary,
                    padding: "12px 20px",
                  }}
                >
                  🏠 Back to Home
                </Button>
              </Link>
              <Link to="/about" style={{ textDecoration: "none" }}>
                <Button
                  size="3"
                  style={{
                    ...iglooStyles.button.secondary,
                    padding: "12px 20px",
                  }}
                >
                  ℹ️ Learn More
                </Button>
              </Link>
            </Flex>
          </Box>
        </Flex>
      </Box>
    );
  }

  return <>{children}</>;
}
