import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { Link, useLocation } from "react-router-dom";
import { iglooTheme, iglooStyles } from "../theme";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "🏔️ Explore", emoji: "🏔️" },
    { path: "/store", label: "🏪 Store", emoji: "🏪" },
    { path: "/library", label: "📚 My Library", emoji: "📚" },
    { path: "/publish", label: "📤 Publish", emoji: "📤" },
  ];

  return (
    <Box style={iglooStyles.container}>
      <Flex
        position="sticky"
        top="0"
        px="4"
        py="3"
        justify="between"
        align="center"
        style={{
          ...iglooStyles.header,
          zIndex: 100,
        }}
      >
        <Flex align="center" gap="4">
          <Link to="/" style={{ textDecoration: "none" }}>
            <Flex align="center" gap="3">
              <Box
                style={{
                  filter: "drop-shadow(0 2px 4px rgba(14, 165, 233, 0.3))",
                }}
              >
                <img
                  src="/cc_logo.PNG"
                  alt="ColdCache Logo"
                  style={{
                    height: "40px",
                    width: "auto",
                    display: "block",
                  }}
                />
              </Box>
              <Heading
                size="6"
                style={{
                  color: iglooTheme.colors.primary[700],
                  textShadow: "0 1px 2px rgba(14, 165, 233, 0.1)",
                }}
              >
                ColdCache
              </Heading>
            </Flex>
          </Link>

          <Flex gap="1" ml="6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  textDecoration: "none",
                  padding: "8px 16px",
                  borderRadius: iglooTheme.borderRadius.arch,
                  background:
                    location.pathname === item.path
                      ? iglooTheme.colors.primary[100]
                      : "transparent",
                  color:
                    location.pathname === item.path
                      ? iglooTheme.colors.primary[700]
                      : iglooTheme.colors.ice[600],
                  fontWeight: location.pathname === item.path ? "600" : "500",
                  transition: "all 0.2s ease",
                  border:
                    location.pathname === item.path
                      ? `1px solid ${iglooTheme.colors.primary[200]}`
                      : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== item.path) {
                    e.currentTarget.style.background =
                      iglooTheme.colors.ice[50];
                    e.currentTarget.style.color =
                      iglooTheme.colors.primary[600];
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== item.path) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = iglooTheme.colors.ice[600];
                  }
                }}
              >
                <span style={{ marginRight: "6px" }}>{item.emoji}</span>
                {item.label.replace(/^[^a-zA-Z]+\s/, "")}
              </Link>
            ))}
          </Flex>
        </Flex>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>

      <Container>
        <Container
          mt="5"
          pt="6"
          px="4"
          style={{
            minHeight: "80vh",
            background: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(10px)",
            borderRadius: iglooTheme.borderRadius.igloo,
            border: `1px solid ${iglooTheme.colors.ice[200]}`,
            boxShadow: iglooTheme.shadows.igloo,
            margin: "20px auto",
          }}
        >
          {children}
        </Container>
      </Container>
    </Box>
  );
}
