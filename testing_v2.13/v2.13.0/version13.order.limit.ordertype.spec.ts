// import { describe } from "mocha";
import { expect, assert } from "chai";
import * as vuilder from "@vite/vuilder";
import fundAbi from "../abi/fund.abi.json";
import tradeAbi from "../abi/trade.abi.json";
import Big from 'big.js';
import { contractWithUser, initValue, randomUser } from "../utils/user";
import * as dex from "../utils/dex";

let provider: any;
let deployer: vuilder.UserAccount;
let tradeContract: vuilder.Contract;

const fundContractAddress =
  "vite_0000000000000000000000000000000000000006e82b8ba657";
const tradeContractAddress =
  "vite_00000000000000000000000000000000000000079710f19dc7";
const tradeToken = "tti_2736f320d7ed1c2871af1d9d"; // vtt
const quoteToken = "tti_5649544520544f4b454e6e40"; // vite

const sideSell = true;
const orderLimit = 0;
const orderMarket = 1;
const orderPostOnly = 2;
const orderFillOrKill = 3;
const orderImmediateOrCancel = 4;

describe("test version13 upgrade", () => {
  before(async function () {
    provider = vuilder.newProvider(vuilder.defaultViteNetwork.http);
    console.log(await provider.request("ledger_getSnapshotChainHeight"));
    deployer = vuilder.newAccount(vuilder.defaultViteNetwork.mnemonic, 0, provider);

    tradeContract = new vuilder.Contract("TradeContract", "", tradeAbi);
    tradeContract.attach(tradeContractAddress);
    tradeContract.setDeployer(deployer);
    tradeContract.setProvider(provider);
  });

  it("test FundContract placeOrder - limit - PostOnly ", async () => {
    const initViteAmount = "100000000000000000000000"; // 10w VITE
    const initVttAmount = "100000000000000000000000";  // 10w VTT

    const user1 = randomUser(provider); // seller
    const user1Address = user1.address;
    console.log(`random user1 ${user1.address}`)
    const user1FundContract = contractWithUser(user1, fundAbi, fundContractAddress);

    await initValue(deployer, user1, initVttAmount, tradeToken);
    await initValue(deployer, user1, initViteAmount);

    await dex.depositToFund(user1FundContract, initViteAmount);
    await dex.depositToFund(user1FundContract, initVttAmount, tradeToken);

    const quoteBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);

    const viteValue1_before = quoteBalanceUser1_before[quoteToken].available;
    const viteValueLocked1_before = quoteBalanceUser1_before[quoteToken].locked;
    const vttValue1_before = tradeBalanceUser1_before[tradeToken].available;
    const vttValueLocked1_before = tradeBalanceUser1_before[tradeToken].locked;
    console.log("user1 balance before", viteValue1_before, viteValueLocked1_before, vttValue1_before, vttValueLocked1_before);

    assert.equal(viteValue1_before, initViteAmount);
    assert.equal(viteValueLocked1_before, "0");
    assert.equal(vttValue1_before, initVttAmount);
    assert.equal(vttValueLocked1_before, "0");

    const price = "8000"
    const quantity = "6000000000000000000"
    const orderType = orderPostOnly
    try {
      await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderType, price, quantity); // sell 6 VTT
    } catch (err) {
      expect((err as Error).message).to.be.equal("send block fail")
    }
  });

  it("test FundContract placeOrder - limit - FillOrKill ", async () => {
    const initViteAmount = "100000000000000000000000"; // 10w VITE
    const initVttAmount = "100000000000000000000000";  // 10w VTT

    const user1 = randomUser(provider); // seller
    const user1Address = user1.address;
    console.log(`random user1 ${user1.address}`)
    const user1FundContract = contractWithUser(user1, fundAbi, fundContractAddress);

    await initValue(deployer, user1, initVttAmount, tradeToken);
    await initValue(deployer, user1, initViteAmount);

    await dex.depositToFund(user1FundContract, initViteAmount);
    await dex.depositToFund(user1FundContract, initVttAmount, tradeToken);

    const quoteBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);

    const viteValue1_before = quoteBalanceUser1_before[quoteToken].available;
    const viteValueLocked1_before = quoteBalanceUser1_before[quoteToken].locked;
    const vttValue1_before = tradeBalanceUser1_before[tradeToken].available;
    const vttValueLocked1_before = tradeBalanceUser1_before[tradeToken].locked;
    console.log("user1 balance before", viteValue1_before, viteValueLocked1_before, vttValue1_before, vttValueLocked1_before);

    assert.equal(viteValue1_before, initViteAmount);
    assert.equal(viteValueLocked1_before, "0");
    assert.equal(vttValue1_before, initVttAmount);
    assert.equal(vttValueLocked1_before, "0");

    const price = "8000"
    const quantity = "6000000000000000000"
    const orderType = orderFillOrKill
    try {
      await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderType, price, quantity); // sell 6 VTT
    } catch (err) {
      expect((err as Error).message).to.be.equal("send block fail")
    }
  });

  it("test FundContract placeOrder - limit - ImmediateOrCancel ", async () => {
    const initViteAmount = "100000000000000000000000"; // 10w VITE
    const initVttAmount = "100000000000000000000000";  // 10w VTT

    const user1 = randomUser(provider); // seller
    const user1Address = user1.address;
    console.log(`random user1 ${user1.address}`)
    const user1FundContract = contractWithUser(user1, fundAbi, fundContractAddress);

    await initValue(deployer, user1, initVttAmount, tradeToken);
    await initValue(deployer, user1, initViteAmount);

    await dex.depositToFund(user1FundContract, initViteAmount);
    await dex.depositToFund(user1FundContract, initVttAmount, tradeToken);

    const quoteBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);

    const viteValue1_before = quoteBalanceUser1_before[quoteToken].available;
    const viteValueLocked1_before = quoteBalanceUser1_before[quoteToken].locked;
    const vttValue1_before = tradeBalanceUser1_before[tradeToken].available;
    const vttValueLocked1_before = tradeBalanceUser1_before[tradeToken].locked;
    console.log("user1 balance before", viteValue1_before, viteValueLocked1_before, vttValue1_before, vttValueLocked1_before);

    assert.equal(viteValue1_before, initViteAmount);
    assert.equal(viteValueLocked1_before, "0");
    assert.equal(vttValue1_before, initVttAmount);
    assert.equal(vttValueLocked1_before, "0");

    const price = "8000"
    const quantity = "6000000000000000000"
    const orderType = orderImmediateOrCancel
    try {
      await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderType, price, quantity); // sell 6 VTT
    } catch (err) {
      expect((err as Error).message).to.be.equal("send block fail")
    }
  });

  it("test FundContract placeOrder - test - orderPrice ", async () => {
    const initViteAmount = "100000000000000000000000"; // 10w VITE
    const initVttAmount = "100000000000000000000000";  // 10w VTT

    const user1 = randomUser(provider); // seller
    const user1Address = user1.address;
    console.log(`random user1 ${user1.address}`)
    const user1FundContract = contractWithUser(user1, fundAbi, fundContractAddress);

    await initValue(deployer, user1, initVttAmount, tradeToken);
    await initValue(deployer, user1, initViteAmount);

    await dex.depositToFund(user1FundContract, initViteAmount);
    await dex.depositToFund(user1FundContract, initVttAmount, tradeToken);

    const quoteBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);

    const viteValue1_before = quoteBalanceUser1_before[quoteToken].available;
    const viteValueLocked1_before = quoteBalanceUser1_before[quoteToken].locked;
    const vttValue1_before = tradeBalanceUser1_before[tradeToken].available;
    const vttValueLocked1_before = tradeBalanceUser1_before[tradeToken].locked;
    console.log("user1 balance before", viteValue1_before, viteValueLocked1_before, vttValue1_before, vttValueLocked1_before);

    assert.equal(viteValue1_before, initViteAmount);
    assert.equal(viteValueLocked1_before, "0");
    assert.equal(vttValue1_before, initVttAmount);
    assert.equal(vttValueLocked1_before, "0");

    // illegal price
    const price = "80000000000000"  // int > 12 or decimal >12
    // const price = "8.6666666666666"
    const quantity = "6000000000000000000"
    const orderType = orderLimit

    await provider.request("virtual_addUpgrade", 4, 10000000);

    try {
      await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderType, price, quantity); // sell 6 VTT
    } catch (err) {
      expect((err as Error).message).to.be.equal("send block fail")
    }
  });
});