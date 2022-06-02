// import { describe } from "mocha";
import { expect, assert } from "chai";
import * as vuilder from "@vite/vuilder";
import config from "./vite.config.json";
import fundAbi from "./abi/fund.abi.json"
import tradeAbi from "./abi/trade.abi.json"

let provider: any;
let deployer: vuilder.UserAccount;
let fundContract: vuilder.Contract;
let tradeContract: vuilder.Contract;

const fundContractAddress = "vite_0000000000000000000000000000000000000006e82b8ba657"
const tradeContractAddress = "vite_00000000000000000000000000000000000000079710f19dc7"
const tradeToken = "tti_2736f320d7ed1c2871af1d9d" // vtt
const quoteToken = "tti_5649544520544f4b454e6e40"  // vite

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

    tradeContract = new vuilder.Contract("TradeContract", "", tradeAbi);
    tradeContract.attach(tradeContractAddress);
    tradeContract.setDeployer(deployer);
    tradeContract.setProvider(provider);

    console.log("the deployer addr", deployer.address);
  });

  beforeEach(async function () {
    await fundContract.call("DexFundUserDeposit", [], {
      amount: "2000000000000000000000"
    });

    await fundContract.call("DexFundUserDeposit", [], {
      amount: "2000000000000000000000",
      tokenId: tradeToken
    });
  });

  it("test Fund/placeOrder orderType ", async () => {
    const orderType = "1"

    // before upgrade
    await provider.request("virtual_addUpgrade", 11, 1000000);
    try{
      await fundContract.call(
        "PlaceOrder",
        [tradeToken, quoteToken, "0", orderType, "2.974", "60000000000000000000"],
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
      [tradeToken, quoteToken, "0", orderType, "2.974", "60000000000000000000"],
      { amount: "0" }
    );
  });

  it("test Trade/clearExpiredOrders ", async () => {
    // before upgrade
    await provider.request("virtual_addUpgrade", 11, 1000000);
    let orderId = "00000601000000000006e44c28000062984ffe000010"; //22bytes 
    const dataHex = Buffer.from(orderId, 'binary').toString('hex');
    console.log("the data length:", dataHex.length);
    try {
      await tradeContract.call(
        "ClearExpiredOrders",
        [dataHex],
        { amount: "0" }
      );
      assert.fail("fail message")
    } catch (err) {
      // todo: module=dex_trade error="not set timestamp"
      expect((err as Error).message).to.be.equal("revert, methodName: ClearExpiredOrders")
    }

    // after upgrade
    await provider.request("virtual_addUpgrade", 11, 1);
    try {
      await tradeContract.call(
        "ClearExpiredOrders",
        [dataHex],
        { amount: "0" }
      );
      assert.fail("fail message")
    } catch (err) {
      // gvite err: invalid operation"
      expect((err as Error).message).to.be.equal("revert, methodName: ClearExpiredOrders")
    }
  });

});