import { useState } from "react";
import { Box, Button, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import { iglooTheme } from "../theme";
import { GameNFT } from "../schemas/nft";
import { TransferGameModal } from "./TransferGameModal";

interface GameCardMenuProps {
  game: GameNFT;
  onRefresh: () => void;
}

export function GameCardMenu({ game, onRefresh }: GameCardMenuProps) {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Button
            variant="ghost"
            size="2"
            style={{
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "4px",
              background: "transparent",
              border: "none",
              color: iglooTheme.colors.ice[600],
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = iglooTheme.colors.ice[100];
              e.currentTarget.style.color = iglooTheme.colors.primary[700];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = iglooTheme.colors.ice[600];
            }}
          >
            <Box
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                alignItems: "center",
              }}
            >
              <Box
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "currentColor",
                }}
              />
              <Box
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "currentColor",
                }}
              />
              <Box
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "currentColor",
                }}
              />
            </Box>
          </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content
          style={{
            background: iglooTheme.gradients.frostWhite,
            border: `1px solid ${iglooTheme.colors.primary[200]}`,
            borderRadius: iglooTheme.borderRadius.arch,
            boxShadow: iglooTheme.shadows.ice,
            padding: "8px",
            minWidth: "180px",
          }}
        >
          <DropdownMenu.Item
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: "transparent",
              color: iglooTheme.colors.ice[700],
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = iglooTheme.colors.primary[50];
              e.currentTarget.style.color = iglooTheme.colors.primary[700];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = iglooTheme.colors.ice[700];
            }}
            onClick={() => setIsTransferModalOpen(true)}
          >
            <Flex align="center" gap="2">
              <Text size="2">🔄</Text>
              <Text size="2" style={{ fontWeight: "500" }}>
                Transfer Game
              </Text>
            </Flex>
          </DropdownMenu.Item>

          <DropdownMenu.Separator
            style={{
              height: "1px",
              background: iglooTheme.colors.ice[200],
              margin: "4px 0",
            }}
          />

          <DropdownMenu.Item
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: "transparent",
              color: iglooTheme.colors.ice[500],
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = iglooTheme.colors.ice[50];
              e.currentTarget.style.color = iglooTheme.colors.ice[700];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = iglooTheme.colors.ice[500];
            }}
            onClick={() => {
              navigator.clipboard.writeText(game.id);
            }}
          >
            <Flex align="center" gap="2">
              <Text size="2">📋</Text>
              <Text size="2" style={{ fontWeight: "500" }}>
                Copy NFT ID
              </Text>
            </Flex>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: "transparent",
              color: iglooTheme.colors.ice[500],
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = iglooTheme.colors.ice[50];
              e.currentTarget.style.color = iglooTheme.colors.ice[700];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = iglooTheme.colors.ice[500];
            }}
            onClick={() => {
              const explorerUrl = `https://testnet.suivision.xyz/object/${game.id}`;
              window.open(explorerUrl, "_blank");
            }}
          >
            <Flex align="center" gap="2">
              <Text size="2">🔍</Text>
              <Text size="2" style={{ fontWeight: "500" }}>
                View on Explorer
              </Text>
            </Flex>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <TransferGameModal
        game={game}
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onTransferComplete={onRefresh}
      />
    </>
  );
}
