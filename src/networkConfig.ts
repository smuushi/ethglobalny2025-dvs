import { getFullnodeUrl } from "@mysten/sui/client";
import {
  DEVNET_COUNTER_PACKAGE_ID,
  TESTNET_COUNTER_PACKAGE_ID,
  MAINNET_COUNTER_PACKAGE_ID,
  DEVNET_GAME_STORE_PACKAGE_ID,
  TESTNET_GAME_STORE_PACKAGE_ID,
  MAINNET_GAME_STORE_PACKAGE_ID,
  DEVNET_GAME_STORE_OBJECT_ID,
  TESTNET_GAME_STORE_OBJECT_ID,
  MAINNET_GAME_STORE_OBJECT_ID,
} from "./constants.ts";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        counterPackageId: DEVNET_COUNTER_PACKAGE_ID,
        gameStorePackageId: DEVNET_GAME_STORE_PACKAGE_ID,
        gameStoreObjectId: DEVNET_GAME_STORE_OBJECT_ID,
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        counterPackageId: TESTNET_COUNTER_PACKAGE_ID,
        gameStorePackageId: TESTNET_GAME_STORE_PACKAGE_ID,
        gameStoreObjectId: TESTNET_GAME_STORE_OBJECT_ID,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        counterPackageId: MAINNET_COUNTER_PACKAGE_ID,
        gameStorePackageId: MAINNET_GAME_STORE_PACKAGE_ID,
        gameStoreObjectId: MAINNET_GAME_STORE_OBJECT_ID,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
