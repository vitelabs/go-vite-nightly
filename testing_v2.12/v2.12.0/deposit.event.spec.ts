// import { describe } from "mocha";
import { expect, assert } from "chai";
import * as vuilder from "@vite/vuilder";
import config from "../vite.config.json";
import fundAbi from "../abi/fund.abi.json"

let provider: any;
let deployer: vuilder.UserAccount;
let fundContract: vuilder.Contract;

const fundContractAddress = "vite_0000000000000000000000000000000000000006e82b8ba657"
const transferAmount = "1000000000000000000" // 1 Vite
const viteToken = "tti_5649544520544f4b454e6e40"

describe("test version11 upgrade", () => {
  before(async function () {
    provider = vuilder.newProvider(config.networks.local.http);
    deployer = vuilder.newAccount(config.networks.local.mnemonic, 0, provider);
    console.log(await provider.request("ledger_getSnapshotChainHeight"));

    fundContract = new vuilder.Contract("FundContract", "", fundAbi);
    fundContract.attach(fundContractAddress);
    fundContract.setDeployer(deployer);
    fundContract.setProvider(provider);

    console.log("the deployer addr", deployer.address);
  });

  beforeEach(async function () {
    await fundContract.call("DexFundUserDeposit", [], {
      amount: "2000000000000000000" // 2 Vite
    });
  });

  it("test Fund Contract - Deposit Event", async () => {
    await provider.request("virtual_addUpgrade", 11, 1000000);
    const block = await fundContract.call(
      "Deposit",
      [],
      {
        amount: transferAmount,
        tokenId: viteToken
      }
    );
    // console.log("the block", block);
    assert.isNull(block.vmLogHash);

    await provider.request("virtual_addUpgrade", 11, 1);

    const blockUpgrade = await fundContract.call(
      "Deposit",
      [],
      {
        amount: transferAmount,
        tokenId: viteToken
      }
    );

    // console.log("the blockUpgrade", blockUpgrade);
    assert.isNotNull(blockUpgrade.vmLogHash);
  });
});