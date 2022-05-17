import { expect } from "chai";
const vuilder = require("@vite/vuilder");
import config from "./vite.config.json";


async function run(): Promise<void> {
  const provider = vuilder.newProvider(config.networks.local.http);
  console.log(await provider.request("ledger_getSnapshotChainHeight"));
  const deployer = vuilder.newAccount(config.networks.local.mnemonic, 0, provider);
  console.log('deployer', deployer.address);



  await deployer.sendToken("vite_b90388add928d41c114b0fb65471c4a6c70595eb6f2772a5c2", "100000000000000000000");
  await deployer.sendToken("vite_b90388add928d41c114b0fb65471c4a6c70595eb6f2772a5c2", "100000000000000000000");
  await deployer.sendToken("vite_b90388add928d41c114b0fb65471c4a6c70595eb6f2772a5c2", "100000000000000000000");
  await deployer.sendToken("vite_b90388add928d41c114b0fb65471c4a6c70595eb6f2772a5c2", "100000000000000000000");
  await deployer.sendToken("vite_b90388add928d41c114b0fb65471c4a6c70595eb6f2772a5c2", "100000000000000000000");
  await deployer.sendToken("vite_b90388add928d41c114b0fb65471c4a6c70595eb6f2772a5c2", "100000000000000000000");
  await deployer.sendToken("vite_b90388add928d41c114b0fb65471c4a6c70595eb6f2772a5c2", "100000000000000000000");
  await deployer.sendToken("vite_b90388add928d41c114b0fb65471c4a6c70595eb6f2772a5c2", "100000000000000000000");

  console.log("result: ", JSON.stringify({ success: true }));
  return;
}

run().then(() => {
  console.log("done");
});