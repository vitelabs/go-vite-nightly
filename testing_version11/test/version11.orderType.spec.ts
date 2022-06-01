// import { describe } from "mocha";
import { expect, assert } from "chai";
import * as vuilder from "@vite/vuilder";
import config from "./vite.config.json";
import fundAbi from "./abi/fund.abi.json"

let provider: any;
let deployer: vuilder.UserAccount;
let fundContract: vuilder.Contract;

const fundContractAddress = "vite_0000000000000000000000000000000000000006e82b8ba657"
const transferAmount = "1000000000000000000"
const viteToken = "tti_5649544520544f4b454e6e40"
const tradeToken = "tti_5649544520544f4b454e6e40"
const quoteToken = "tti_80f3751485e4e83456059473"

describe("test version11 upgrade", () => {
  before(async function () {
    provider = vuilder.newProvider(config.networks.local.http);
    console.log(await provider.request("ledger_getSnapshotChainHeight"));
    deployer = vuilder.newAccount(config.networks.local.mnemonic, 0, provider);
    console.log("deployer", deployer.address);
    fundContract = new vuilder.Contract("FundContract", "", fundAbi);
    fundContract.attach(fundContractAddress);
    fundContract.setDeployer(deployer);
    fundContract.setProvider(provider);

    console.log("the deployer addr", deployer.address);
  });

  beforeEach(async function () {
    await fundContract.call("DexFundUserDeposit", [], {
      amount: "2000000000000000000"
    });
  });

  it("test Fund/placeOrder orderType ", async () => {
    // const dd = await provider.request("virtual_mineBatch", 10);
    // before upgrade
    const addr = "vite_3345524abf6bbe1809449224b5972c41790b6cf2e22fcb5caf"

    await provider.request("virtual_addUpgrade", 11, 1000000);
    try{
      await fundContract.call(
        "PlaceOrder",
        [tradeToken, quoteToken, "0", "0", "0.02974", "67600000000000000000"],
        { amount: "0" }
      );
      assert.fail("fail message")
    }catch(err){
      expect((err as Error).message).to.be.equal("revert, methodName: PlaceOrder")
    }

    // after upgrade
    await provider.request("virtual_addUpgrade", 11, 1);
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, "0", "0", "0.02974", "67600000000000000000"],
      { amount: "0" }
    );
  });

});