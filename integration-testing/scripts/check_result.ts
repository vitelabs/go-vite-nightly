import { expect } from "chai";
const vuilder = require("@vite/vuilder");
import config from "./vite.config.json";
import resultMeta from "./result.json";

let provider: any;
let deployer: any;

describe("test HelloWorld", () => {
  before(async function () {
    provider = vuilder.newProvider(config.networks.local.http);
    console.log(await provider.request("ledger_getSnapshotChainHeight"));
    deployer = vuilder.newAccount(config.networks.local.mnemonic, 0, provider);
    console.log("deployer", deployer.address);

    const balance = await deployer.balance();
    console.log(balance.toString());
  });

  it("test set function", async () => {
    while (true) {
      const currentHeight = await provider.request(
        "ledger_getSnapshotChainHeight"
      );
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
      if (+currentHeight >= resultMeta.height) {
        console.log("result: ", JSON.stringify({ success: true }));
        break;
      }
    }
  });
});
