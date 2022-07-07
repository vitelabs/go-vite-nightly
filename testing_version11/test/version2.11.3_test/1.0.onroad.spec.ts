import { describe } from "mocha";
import { expect } from "chai";
import * as vuilder from "@vite/vuilder";
import config from "../vite.config.json";

let provider: any;
let deployer: vuilder.UserAccount;

// account -> contract methods
describe("test Cafe", () => {
  before(async function () {
    provider = vuilder.newProvider(config.networks.local.http);
    console.log(await provider.request("ledger_getSnapshotChainHeight"));
    deployer = vuilder.newAccount(config.networks.local.mnemonic, 0, provider);
    console.log('deployer', deployer.address);
  });

  it("test account calls contract func", async () => {
    const compiledContracts = await vuilder.compile("Cafe.solpp");
    expect(compiledContracts).to.have.property("Cafe");

    // deploy
    let cafe = compiledContracts.Cafe;
    cafe.setDeployer(deployer).setProvider(provider);
    await cafe.deploy({});
    expect(cafe.address).to.be.a("string");
    console.log(cafe.address);

    // call methods for 5 times
    const num = 5;
    for (let i = 0; i < num; i++) {
      cafe.call(
        "buyCoffee",
        ["vite_3345524abf6bbe1809449224b5972c41790b6cf2e22fcb5caf", 2],
        { amount: "2000000000000000000" }
      );
    }
  });
});

