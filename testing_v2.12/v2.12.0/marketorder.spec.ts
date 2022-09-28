// import { describe } from "mocha";
import { expect, assert } from "chai";
import * as vuilder from "@vite/vuilder";
import config from "../vite.config.json";
import fundAbi from "../abi/fund.abi.json"
import tradeAbi from "../abi/trade.abi.json"

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
    const orderSide = false // true:buy false:sell 
    const orderType = "1" // 0:limit 1:market 2:postOnly 3:FillOrKill 4:ImmediateOrCancel

    // before upgrade
    await provider.request("virtual_addUpgrade", 11, 1000000);
    try {
      await fundContract.call(
        "PlaceOrder",
        [tradeToken, quoteToken, orderSide, orderType, "2.974", "60000000000000000000"],
        { amount: "0" }
      );
      assert.fail("fail message")
    } catch (err) {
      expect((err as Error).message).to.be.equal("revert, methodName: PlaceOrder")
    }

    // after upgrade
    await provider.request("virtual_addUpgrade", 11, 1);
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, orderSide, orderType, "20.974", "60000000000000000000"],
      { amount: "0" }
    );
  });

  it("test Fund/placeOrder orderType - Market ", async () => {
    const orderSide = false // true:buy false:sell 
    const orderType = "1" // 0:limit 1:market 2:postOnly 3:FillOrKill 4:ImmediateOrCancel

    // case1. place Market order while there are no orders in orderbook(predict:cancel)
    await provider.request("virtual_addUpgrade", 11, 1);
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, orderSide, orderType, "20.974", "60000000000000000000"],
      { amount: "0" }
    );


    // case2. test MarketOrder max order_amount
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, orderSide, orderType, "20974000", "600000000000000000000000"],
      { amount: "0" }
    );
  });

  it("test Fund/placeOrder orderType - PostOnly ", async () => {
    const orderSide = false // true:buy false:sell 
    const orderType = "2" // 0:limit 1:market 2:postOnly 3:FillOrKill 4:ImmediateOrCancel

    // execute immediately so the order should be canceled
    await provider.request("virtual_addUpgrade", 11, 1);
    // place some limit orders
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, false, 0, "10.974", "60000000000000000000"],
      { amount: "0" }
    );
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, false, 0, "9.974", "60000000000000000000"],
      { amount: "0" }
    );
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, true, 0, "20.974", "60000000000000000000"],
      { amount: "0" }
    );
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, true, 0, "21.974", "60000000000000000000"],
      { amount: "0" }
    );

    // case1. place an order that will be filled immediately 
    // expect: the order will be canneled
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, false, orderType, "23.974", "60000000000000000000"],
      { amount: "0" }
    );

    // case2. place an order that will not be filled immediately, 
    // expect: the order is a maker
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, false, orderType, "19.974", "50000000000000000000"],
      { amount: "0" }
    );
  });

  it("test Fund/placeOrder orderType - FillOrKill ", async () => {
    const orderSide = false // true:buy false:sell 
    const orderType = "3" // 0:limit 1:market 2:postOnly 3:FillOrKill 4:ImmediateOrCancel

    await provider.request("virtual_addUpgrade", 11, 1);
    // place some limit orders
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, false, 0, "10.974", "60000000000000000000"],
      { amount: "0" }
    );
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, false, 0, "9.974", "60000000000000000000"],
      { amount: "0" }
    );
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, true, 0, "20.974", "60000000000000000000"],
      { amount: "0" }
    );
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, true, 0, "21.974", "60000000000000000000"],
      { amount: "0" }
    );

    // case1. place an order that will be filled immediately 
    // expect: the order will be executed immediately
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, false, orderType, "23.974", "30000000000000000000"],
      { amount: "0" }
    );

    // case2. place an order that will be partly filled 
    // expect: the order will be canneled
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, false, orderType, "20.974", "80000000000000000000"],
      { amount: "0" }
    );

    // case3. place an order that will not be filled 
    // expect: the order will be canneled
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, false, orderType, "2.974", "50000000000000000000"],
      { amount: "0" }
    );
  });

  it("test Fund/placeOrder orderType - ImmediateOrCancel ", async () => {
    const orderSide = false // true:buy false:sell 
    const orderType = "4" // 0:limit 1:market 2:postOnly 3:FillOrKill 4:ImmediateOrCancel

    await provider.request("virtual_addUpgrade", 11, 1);
    // place some limit orders
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, false, 0, "10.974", "60000000000000000000"],
      { amount: "0" }
    );
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, false, 0, "9.974", "60000000000000000000"],
      { amount: "0" }
    );
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, true, 0, "20.974", "60000000000000000000"],
      { amount: "0" }
    );
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, true, 0, "21.974", "60000000000000000000"],
      { amount: "0" }
    );

    // case1. place an order that will be filled immediately 
    // expect: the order will be executed immediately
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, false, orderType, "23.974", "30000000000000000000"],
      { amount: "0" }
    );

    // case2. place an order that will be partly filled 
    // expect: the order that not be fully filled will be canneled
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, false, orderType, "20.974", "80000000000000000000"],
      { amount: "0" }
    );

    // case3. place an order that will not be filled 
    // expect: the order will be canneled
    await fundContract.call(
      "PlaceOrder",
      [tradeToken, quoteToken, false, orderType, "2.974", "50000000000000000000"],
      { amount: "0" }
    );
  });
});