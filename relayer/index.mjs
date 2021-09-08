import dotenv from "dotenv";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { getAccount } from "./account.mjs";

dotenv.config();

const sourceProvider = new WsProvider(process.env.SOURCE_CHAIN_URL);
const targetProvider = new WsProvider(process.env.TARGET_CHAIN_URL);

// TODO: use typedefs from subspace.js
const types = {
  PutDataObject: "Vec<u8>",
};

// TODO: remove IIFE when Eslint is updated to v8.0.0 (will support top-level await)
(async () => {
  const sourceApi = await ApiPromise.create({
    provider: sourceProvider,
    types,
  });

  const targetApi = await ApiPromise.create({
    provider: targetProvider,
    types,
  });

  // use getAccount func because we cannot create keyring instance before API is instanciated
  const signer = getAccount(process.env.ACCOUNT_SEED);

  // TODO: add old block processing

  await sourceApi.rpc.chain.subscribeFinalizedHeads(async ({ hash }) => {
    console.log(`Finalized block hash: ${hash}`);

    const block = await sourceApi.rpc.chain.getBlock(hash);

    const txHash = await targetApi.tx.feeds
      .put(block.toString())
      .signAndSend(signer);

    console.log(`Transaction sent: ${txHash}`);
  });
})();
