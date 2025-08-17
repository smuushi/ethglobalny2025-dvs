import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { WalletRequiredWrapper } from "./components/WalletRequiredWrapper";
import { HomePage } from "./pages/HomePage";
import { StorePage } from "./pages/StorePage";
import { LibraryPage } from "./pages/LibraryPage";
import { PublishPage } from "./pages/PublishPage";
import { GameDetailPage } from "./pages/GameDetailPage";
import { SecureDownloadPage } from "./pages/SecureDownloadPage";
import AboutPage from "./pages/AboutPage";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public pages - no wallet required */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Wallet-required pages */}
          <Route
            path="/store"
            element={
              <WalletRequiredWrapper pageName="the game store">
                <StorePage />
              </WalletRequiredWrapper>
            }
          />
          <Route
            path="/game/:gameId"
            element={
              <WalletRequiredWrapper pageName="game details">
                <GameDetailPage />
              </WalletRequiredWrapper>
            }
          />
          <Route
            path="/library"
            element={
              <WalletRequiredWrapper pageName="your game library">
                <LibraryPage />
              </WalletRequiredWrapper>
            }
          />
          <Route
            path="/publish"
            element={
              <WalletRequiredWrapper pageName="the publisher dashboard">
                <PublishPage />
              </WalletRequiredWrapper>
            }
          />
          <Route
            path="/download/:gameId"
            element={
              <WalletRequiredWrapper pageName="secure downloads">
                <SecureDownloadPage />
              </WalletRequiredWrapper>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
