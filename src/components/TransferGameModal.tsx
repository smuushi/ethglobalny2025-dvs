import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Heading,
  Text,
  TextField,
  Spinner,
} from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { iglooTheme, iglooStyles } from "../theme";
import { GameNFT } from "../schemas/nft";

interface TransferGameModalProps {
  game: GameNFT;
  isOpen: boolean;
  onClose: () => void;
  onTransferComplete: () => void;
}

export function TransferGameModal({
  game,
  isOpen,
  onClose,
  onTransferComplete,
}: TransferGameModalProps) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  const handleTransfer = async () => {
    if (!recipientAddress.trim()) {
      setError("Please enter a recipient address");
      return;
    }

    // Basic address validation
    if (!recipientAddress.startsWith("0x") || recipientAddress.length !== 66) {
      setError(
        "Please enter a valid Sui address (0x followed by 64 characters)",
      );
      return;
    }

    setIsTransferring(true);
    setError(null);

    try {
      const tx = new Transaction();

      // Transfer the NFT to the recipient
      tx.transferObjects([game.id], recipientAddress);

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: () => {
            setIsTransferring(false);
            onTransferComplete();
            onClose();
            setRecipientAddress("");
          },
          onError: (error) => {
            console.error("Transfer failed:", error);
            setError("Transfer failed. Please try again.");
            setIsTransferring(false);
          },
        },
      );
    } catch (error) {
      console.error("Transfer error:", error);
      setError("Failed to create transfer transaction");
      setIsTransferring(false);
    }
  };

  const handleClose = () => {
    if (!isTransferring) {
      onClose();
      setRecipientAddress("");
      setError(null);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Content
        style={{
          maxWidth: "500px",
          padding: "32px",
          background: iglooTheme.gradients.frostWhite,
          border: `2px solid ${iglooTheme.colors.primary[300]}`,
          borderRadius: iglooTheme.borderRadius.igloo,
          boxShadow: iglooTheme.shadows.igloo,
        }}
      >
        <Dialog.Title asChild>
          <Heading
            size="6"
            style={{
              color: iglooTheme.colors.primary[700],
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            🔄 Transfer Game
          </Heading>
        </Dialog.Title>

        <Box style={{ marginBottom: "24px" }}>
          <Card
            style={{
              ...iglooStyles.card,
              padding: "16px",
              background: iglooTheme.gradients.iceBlue,
              border: `1px solid ${iglooTheme.colors.primary[200]}`,
            }}
          >
            <Text
              size="3"
              style={{
                color: iglooTheme.colors.primary[700],
                fontWeight: "600",
                marginBottom: "8px",
                display: "block",
              }}
            >
              {game.title}
            </Text>
            <Text
              size="2"
              style={{
                color: iglooTheme.colors.ice[600],
                marginBottom: "8px",
                display: "block",
              }}
            >
              {game.description.length > 80
                ? `${game.description.substring(0, 80)}...`
                : game.description}
            </Text>
            <Text
              size="1"
              style={{
                color: iglooTheme.colors.ice[500],
                fontFamily: "monospace",
              }}
            >
              NFT ID: {game.id.substring(0, 16)}...
            </Text>
          </Card>
        </Box>

        <Box style={{ marginBottom: "24px" }}>
          <Text
            size="3"
            style={{
              color: iglooTheme.colors.primary[700],
              fontWeight: "600",
              marginBottom: "8px",
              display: "block",
            }}
          >
            Recipient Address
          </Text>
          <TextField.Root
            size="3"
            placeholder="0x... (Sui wallet address)"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            style={{
              width: "100%",
              fontFamily: "monospace",
              fontSize: "14px",
            }}
          />
          <Text
            size="1"
            style={{
              color: iglooTheme.colors.ice[600],
              marginTop: "4px",
              display: "block",
            }}
          >
            Enter the Sui wallet address of the recipient
          </Text>
        </Box>

        {error && (
          <Box
            style={{
              background: iglooTheme.colors.primary[50],
              padding: "12px",
              borderRadius: iglooTheme.borderRadius.arch,
              border: `1px solid ${iglooTheme.colors.primary[200]}`,
              marginBottom: "24px",
            }}
          >
            <Text
              size="2"
              style={{
                color: iglooTheme.colors.primary[700],
              }}
            >
              ⚠️ {error}
            </Text>
          </Box>
        )}

        <Box
          style={{
            background: iglooTheme.gradients.iceBlue,
            padding: "16px",
            borderRadius: iglooTheme.borderRadius.arch,
            border: `1px solid ${iglooTheme.colors.primary[200]}`,
            marginBottom: "24px",
          }}
        >
          <Text
            size="2"
            style={{
              color: iglooTheme.colors.ice[600],
              lineHeight: "1.5",
              textAlign: "center",
            }}
          >
            ⚠️ <strong>Warning:</strong> This action is permanent. Once
            transferred, you will lose access to this game and all associated
            rights.
          </Text>
        </Box>

        <Flex gap="3" justify="end">
          <Button
            size="3"
            variant="soft"
            onClick={handleClose}
            disabled={isTransferring}
            style={{
              ...iglooStyles.button.secondary,
              padding: "12px 20px",
            }}
          >
            Cancel
          </Button>
          <Button
            size="3"
            onClick={handleTransfer}
            disabled={isTransferring || !recipientAddress.trim()}
            style={{
              ...iglooStyles.button.primary,
              padding: "12px 20px",
              opacity: isTransferring || !recipientAddress.trim() ? 0.6 : 1,
            }}
          >
            {isTransferring ? (
              <Flex align="center" gap="2">
                <Spinner size="1" />
                Transferring...
              </Flex>
            ) : (
              "🔄 Transfer Game"
            )}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
