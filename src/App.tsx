import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { Box, Container, Flex, Heading, Tabs } from "@radix-ui/themes";
import { useState } from "react";
import { Counter } from "./Counter";
import { CreateCounter } from "./CreateCounter";
import { GameUpload } from "./GameUpload";

function App() {
  const currentAccount = useCurrentAccount();
  const [counterId, setCounter] = useState(() => {
    const hash = window.location.hash.slice(1);
    return isValidSuiObjectId(hash) ? hash : null;
  });

  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading>ColdCache - Decentralized Game Store</Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          {currentAccount ? (
            <Tabs.Root defaultValue="upload">
              <Tabs.List>
                <Tabs.Trigger value="upload">Publish Game</Tabs.Trigger>
                <Tabs.Trigger value="demo">Demo Counter</Tabs.Trigger>
              </Tabs.List>

              <Box mt="4">
                <Tabs.Content value="upload">
                  <GameUpload />
                </Tabs.Content>

                <Tabs.Content value="demo">
                  {counterId ? (
                    <Counter id={counterId} />
                  ) : (
                    <CreateCounter
                      onCreated={(id) => {
                        window.location.hash = id;
                        setCounter(id);
                      }}
                    />
                  )}
                </Tabs.Content>
              </Box>
            </Tabs.Root>
          ) : (
            <Heading>Please connect your wallet to get started</Heading>
          )}
        </Container>
      </Container>
    </>
  );
}

export default App;
