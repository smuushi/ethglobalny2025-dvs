import { useCurrentAccount, ConnectButton } from "@mysten/dapp-kit";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Box, Flex, Heading } from "@radix-ui/themes";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { StorePage } from "./pages/StorePage";
import { LibraryPage } from "./pages/LibraryPage";
import { PublishPage } from "./pages/PublishPage";
import { GameDetailPage } from "./pages/GameDetailPage";
import { iglooTheme, iglooStyles } from "./theme";

function App() {
  const currentAccount = useCurrentAccount();

  if (!currentAccount) {
    return (
      <Box style={iglooStyles.container}>
        <Flex
          justify="center"
          align="center"
          style={{
            minHeight: "100vh",
            background: iglooTheme.gradients.iglooMain,
          }}
        >
          <Box
            style={{
              ...iglooStyles.card,
              padding: "48px",
              textAlign: "center",
              maxWidth: "500px",
              background: iglooTheme.gradients.frostWhite,
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
                src="/cc_logo.PNG"
                alt="ColdCache Logo"
                style={{
                  height: "80px",
                  width: "auto",
                  display: "inline-block",
                }}
              />
            </Box>
            <Heading
              size="8"
              mb="4"
              style={{
                color: iglooTheme.colors.primary[700],
                textShadow: "0 2px 4px rgba(14, 165, 233, 0.1)",
              }}
            >
              Welcome to ColdCache
            </Heading>
            <Heading
              size="4"
              mb="6"
              style={{
                color: iglooTheme.colors.ice[600],
                fontWeight: "400",
                lineHeight: "1.6",
              }}
            >
              The coolest decentralized game store on the blockchain
            </Heading>
            <Box
              style={{
                background: iglooTheme.gradients.iceBlue,
                padding: "24px",
                borderRadius: iglooTheme.borderRadius.arch,
                border: `1px solid ${iglooTheme.colors.primary[200]}`,
              }}
            >
              <Heading
                size="5"
                style={{
                  color: iglooTheme.colors.primary[700],
                  marginBottom: "8px",
                }}
              >
                ❄️ Please connect your wallet to get started
              </Heading>
              <Box
                style={{
                  color: iglooTheme.colors.ice[600],
                  fontSize: "14px",
                  marginBottom: "24px",
                }}
              >
                Connect your Sui wallet to explore games, manage your library,
                and publish your own creations
              </Box>

              <Box
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "16px",
                }}
              >
                <ConnectButton />
              </Box>
            </Box>
          </Box>
        </Flex>
      </Box>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/game/:gameId" element={<GameDetailPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/publish" element={<PublishPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
