import { describe } from "mocha";
import { expect } from "chai";
import * as vuilder from "@vite/vuilder";
import config from "../vite.config.json";

let provider: any;
let deployer: vuilder.UserAccount;

// contract -> contract methods
describe("test onroad", () => {
  before(async function () {
    provider = vuilder.newProvider(config.networks.local.http);
    console.log(await provider.request("ledger_getSnapshotChainHeight"));
    deployer = vuilder.newAccount(config.networks.local.mnemonic, 0, provider);
    console.log('deployer', deployer.address);
  });

  it("test account calls contract func", async () => {
    const compiledContracts = await vuilder.compile("SyncCall.solpp");
    expect(compiledContracts).to.have.property("A");
    expect(compiledContracts).to.have.property("B");

    // deploy A
    let a = compiledContracts.A;
    a.setDeployer(deployer).setProvider(provider);
    await a.deploy({});
    expect(a.address).to.be.a("string");
    console.log(a.address);

    // deploy B
    let b = compiledContracts.B;
    b.setDeployer(deployer).setProvider(provider);
    await b.deploy({tokenId: 'tti_5649544520544f4b454e6e40', amount: '10000000000000000000',  params: [a.address]});
    expect(b.address).to.be.a("string");
    console.log(b.address);

    // call methods for 5 times
    const num = 5;
    for (let i = 0; i < num; i++) {
      b.call('test', ['123456'], {});
    }
  });
});

