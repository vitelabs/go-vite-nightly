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
let takerPlatformFeeRate: number = 0.002;
let makerPlatformFeeRate: number = 0.002;
let takerBrokerFeeRate: number = 0;
let makerBrokerFeeRate: number = 0;
let tradeTokenDecimal: number = 18;
let quoteTokenDecimal: number = 18;

const fundContractAddress =
  "vite_0000000000000000000000000000000000000006e82b8ba657";
const tradeContractAddress =
  "vite_00000000000000000000000000000000000000079710f19dc7";
const tradeToken = "tti_2736f320d7ed1c2871af1d9d"; // vtt
const quoteToken = "tti_5649544520544f4b454e6e40"; // vite


const sideBuy = false;
const sideSell = true;
const orderMarket = 1;
const orderLimit = 0;

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

  beforeEach(async function () {
    let orderBook = await dex.getOrderBooks(provider, tradeToken, quoteToken);
    assert.equal(orderBook.orders, undefined); // no orders in the beginning
    // assert.equal(0, orderBook.orders.length);
  });

  it("test FundContract placeOrder - LimitOrder ", async () => {
    const initViteAmount = "100000000000000000000000"; // 10w VITE
    const initVttAmount = "100000000000000000000000";  // 10w VTT

    const user1 = randomUser(provider); // seller
    const user2 = randomUser(provider); // buyer
    const user1Address = user1.address;
    const user2Address = user2.address;
    console.log(`random user1 ${user1.address}`)
    console.log(`random user2 ${user2.address}`)
    const user1FundContract = contractWithUser(user1, fundAbi, fundContractAddress);
    const user2FundContract = contractWithUser(user2, fundAbi, fundContractAddress);
    const user1TradeContract = contractWithUser(user1,tradeAbi, tradeContractAddress);
    const user2TradeContract = contractWithUser(user2, tradeAbi, tradeContractAddress);

    await initValue(deployer, user1, initVttAmount, tradeToken);
    await initValue(deployer, user1, initViteAmount);
    await initValue(deployer, user2, initVttAmount, tradeToken);
    await initValue(deployer, user2, initViteAmount);

    await dex.depositToFund(user1FundContract, initViteAmount);
    await dex.depositToFund(user1FundContract, initVttAmount, tradeToken);
    await dex.depositToFund(user2FundContract, initViteAmount);
    await dex.depositToFund(user2FundContract, initVttAmount, tradeToken);

    const quoteBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_before = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_before = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);

    const viteValue1_before = quoteBalanceUser1_before[quoteToken].available;
    const viteValueLocked1_before = quoteBalanceUser1_before[quoteToken].locked;
    const vttValue1_before = tradeBalanceUser1_before[tradeToken].available;
    const vttValueLocked1_before = tradeBalanceUser1_before[tradeToken].locked;
    const viteValue2_before = quoteBalanceUser2_before[quoteToken].available;
    const viteValueLocked2_before = quoteBalanceUser2_before[quoteToken].locked;
    const vttValue2_before = tradeBalanceUser2_before[tradeToken].available;
    const vttValueLocked2_before = tradeBalanceUser2_before[tradeToken].locked;
    console.log("user1 balance before", viteValue1_before, viteValueLocked1_before, vttValue1_before, vttValueLocked1_before);
    console.log("user2 balance before", viteValue2_before, viteValueLocked2_before, vttValue2_before, vttValueLocked2_before);

    assert.equal(viteValue1_before, initViteAmount);
    assert.equal(viteValueLocked1_before, "0");
    assert.equal(vttValue1_before, initVttAmount);
    assert.equal(vttValueLocked1_before, "0");
    assert.equal(viteValue2_before, initViteAmount);
    assert.equal(viteValueLocked2_before, "0");
    assert.equal(vttValue2_before, initVttAmount);
    assert.equal(vttValueLocked2_before, "0");


    // place Limit orders
    const price = "8000"
    const quantity = "6000000000000000000"
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price, quantity); // sell 6 VTT
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderLimit, price, quantity); // buy 6 VTT

    const quoteBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);

    const viteValue1_after = quoteBalanceUser1_after[quoteToken].available;
    const viteValueLocked1_after = quoteBalanceUser1_after[quoteToken].locked;
    const vttValue1_after = tradeBalanceUser1_after[tradeToken].available;
    const vttValueLocked1_after = tradeBalanceUser1_after[tradeToken].locked;
    const viteValue2_after = quoteBalanceUser2_after[quoteToken].available;
    const viteValueLocked2_after = quoteBalanceUser2_after[quoteToken].locked;
    const vttValue2_after = tradeBalanceUser2_after[tradeToken].available;
    const vttValueLocked2_after = tradeBalanceUser2_after[tradeToken].locked;
    console.log("user1 balance after:", viteValue1_after, viteValueLocked1_after, vttValue1_after, vttValueLocked1_after);
    console.log("user2 balance after:", viteValue2_after, viteValueLocked2_after, vttValue2_after, vttValueLocked2_after);

    const tradingQuantity = new Big(vttValue2_after).sub(new Big(vttValue2_before)).toFixed();
    assert.equal(viteValue1_after, new Big(initViteAmount).add(dex.getSellerObtainAmount(price, tradingQuantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed());
    assert.equal(viteValueLocked1_after, "0");
    assert.equal(vttValue1_after, new Big(initVttAmount).sub(new Big(tradingQuantity)).toFixed());
    assert.equal(vttValueLocked1_after, "0");
    assert.equal(viteValue2_after, (new Big(initViteAmount).sub(dex.getBuyerCostAmount(price, tradingQuantity, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))).toFixed());
    assert.equal(viteValueLocked2_after, "0");
    assert.equal(vttValue2_after, new Big(initVttAmount).add(new Big(tradingQuantity)).toFixed());
    assert.equal(vttValueLocked2_after, "0");

    await dex.cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });

  it("test FundContract placeOrder - MarketOrder - Directly Fill with taker balance enough ", async () => {
    const initViteAmount = "100000000000000000000000"; // 10w VITE
    const initVttAmount = "100000000000000000000000";  // 10w VTT

    const user1 = randomUser(provider); // seller
    const user2 = randomUser(provider); // buyer
    const user1Address = user1.address;
    const user2Address = user2.address;
    console.log(`random user1 ${user1.address}`)
    console.log(`random user2 ${user2.address}`)
    const user1FundContract = contractWithUser(user1, fundAbi, fundContractAddress);
    const user2FundContract = contractWithUser(user2, fundAbi, fundContractAddress);
    const user1TradeContract = contractWithUser(user1, tradeAbi, tradeContractAddress);
    const user2TradeContract = contractWithUser(user2, tradeAbi, tradeContractAddress);

    await initValue(deployer, user1, initVttAmount, tradeToken);
    await initValue(deployer, user1, initViteAmount);
    await initValue(deployer, user2, initVttAmount, tradeToken);
    await initValue(deployer, user2, initViteAmount);

    await dex.depositToFund(user1FundContract, initViteAmount);
    await dex.depositToFund(user1FundContract, initVttAmount, tradeToken);
    await dex.depositToFund(user2FundContract, initViteAmount);
    await dex.depositToFund(user2FundContract, initViteAmount, tradeToken);

    const quoteBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_before = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_before = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);
    const viteValue1_before = quoteBalanceUser1_before[quoteToken].available;
    const viteValueLocked1_before = quoteBalanceUser1_before[quoteToken].locked;
    const vttValue1_before = tradeBalanceUser1_before[tradeToken].available;
    const vttValueLocked1_before = tradeBalanceUser1_before[tradeToken].locked;
    const viteValue2_before = quoteBalanceUser2_before[quoteToken].available;
    const viteValueLocked2_before = quoteBalanceUser2_before[quoteToken].locked;
    const vttValue2_before = tradeBalanceUser2_before[tradeToken].available;
    const vttValueLocked2_before = tradeBalanceUser2_before[tradeToken].locked;
    console.log("user1 balance before", viteValue1_before, viteValueLocked1_before, vttValue1_before, vttValueLocked1_before);
    console.log("user2 balance before", viteValue2_before, viteValueLocked2_before, vttValue2_before, vttValueLocked2_before);

    // place Limit orders
    const price1 = "8000"
    const price3 = "0.25"
    const quantity = "6000000000000000000"
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price1, quantity); // sell 6 VTT
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderMarket, price3, quantity); // buy 6 VTT

    const quoteBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);

    const viteValue1_after = quoteBalanceUser1_after[quoteToken].available;
    const viteValueLocked1_after = quoteBalanceUser1_after[quoteToken].locked;
    const vttValue1_after = tradeBalanceUser1_after[tradeToken].available;
    const vttValueLocked1_after = tradeBalanceUser1_after[tradeToken].locked;
    const viteValue2_after = quoteBalanceUser2_after[quoteToken].available;
    const viteValueLocked2_after = quoteBalanceUser2_after[quoteToken].locked;
    const vttValue2_after = tradeBalanceUser2_after[tradeToken].available;
    const vttValueLocked2_after = tradeBalanceUser2_after[tradeToken].locked;
    console.log("user1 balance after:", viteValue1_after, viteValueLocked1_after, vttValue1_after, vttValueLocked1_after);
    console.log("user2 balance after:", viteValue2_after, viteValueLocked2_after, vttValue2_after, vttValueLocked2_after);

    const tradingQuantityOfMarketOrder = new Big(quantity).sub(new Big(vttValueLocked1_after)).toFixed();
    assert.equal(viteValue1_after, new Big(initViteAmount).add(dex.getSellerObtainAmount(price1, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed());
    assert.equal(viteValueLocked1_after, "0");
    assert.equal(vttValue1_after, new Big(initVttAmount).sub(new Big(quantity)).toFixed());
    assert.equal(vttValueLocked1_after, new Big(initVttAmount).add(new Big(quantity)).sub(new Big(vttValue2_after)));

    // the total value of VTT hold by user1 and user2 must be 20w
    assert.equal(new Big(initVttAmount).mul(2).toFixed(),
      (new Big(vttValue1_after).add(new Big(vttValueLocked1_after)).add(new Big(vttValue2_after)).add(new Big(vttValueLocked2_after)).toFixed()));

    // the total value of VITE hold by user1 and user2 + the TradingFees must be 20w
    const totalFees = dex.getSellerFee(price1, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)
      .add(dex.getBuyerFee(price1, quantity, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed();

    assert.equal(new Big(initViteAmount).mul(2).toFixed(),
      (new Big(viteValue1_after).add(new Big(viteValueLocked1_after)).add(new Big(viteValue2_after)).add(new Big(viteValueLocked2_after)
        .add(new Big(totalFees))).toFixed()));

    await dex.cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });

  it("test FundContract placeOrder - MarketOrder - Directly Fill but taker balance is not enough", async () => {
    const initViteAmount = "100000000000000000000000"; // 10w VITE
    const initVttAmount = "100000000000000000000000";  // 10w VTT

    const user1 = randomUser(provider); // seller
    const user2 = randomUser(provider); // buyer
    const user1Address = user1.address;
    const user2Address = user2.address;
    console.log(`random user1 ${user1.address}`)
    console.log(`random user2 ${user2.address}`)
    const user1FundContract = contractWithUser(user1, fundAbi, fundContractAddress);
    const user2FundContract = contractWithUser(user2, fundAbi, fundContractAddress);
    const user1TradeContract = contractWithUser(user1, tradeAbi, tradeContractAddress);
    const user2TradeContract = contractWithUser(user2, tradeAbi, tradeContractAddress);

    await initValue(deployer, user1, initVttAmount, tradeToken);
    await initValue(deployer, user1, initViteAmount);
    await initValue(deployer, user2, initVttAmount, tradeToken);
    await initValue(deployer, user2, initViteAmount);

    await dex.depositToFund(user1FundContract, initViteAmount);
    await dex.depositToFund(user1FundContract, initVttAmount, tradeToken);
    await dex.depositToFund(user2FundContract, initViteAmount);
    await dex.depositToFund(user2FundContract, initViteAmount, tradeToken);

    const quoteBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_before = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_before = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);
    const viteValue1_before = quoteBalanceUser1_before[quoteToken].available;
    const viteValueLocked1_before = quoteBalanceUser1_before[quoteToken].locked;
    const vttValue1_before = tradeBalanceUser1_before[tradeToken].available;
    const vttValueLocked1_before = tradeBalanceUser1_before[tradeToken].locked;
    const viteValue2_before = quoteBalanceUser2_before[quoteToken].available;
    const viteValueLocked2_before = quoteBalanceUser2_before[quoteToken].locked;
    const vttValue2_before = tradeBalanceUser2_before[tradeToken].available;
    const vttValueLocked2_before = tradeBalanceUser2_before[tradeToken].locked;
    console.log("user1 balance before", viteValue1_before, viteValueLocked1_before, vttValue1_before, vttValueLocked1_before);
    console.log("user2 balance before", viteValue2_before, viteValueLocked2_before, vttValue2_before, vttValueLocked2_before);

    // place Limit orders
    const price1 = "9000"
    const price3 = "0.25"
    const quantity = "60000000000000000000"
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price1, quantity); // sell 60 VTT
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderMarket, price3, quantity); // buy 60 VTT

    const quoteBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);

    const viteValue1_after = quoteBalanceUser1_after[quoteToken].available;
    const viteValueLocked1_after = quoteBalanceUser1_after[quoteToken].locked;
    const vttValue1_after = tradeBalanceUser1_after[tradeToken].available;
    const vttValueLocked1_after = tradeBalanceUser1_after[tradeToken].locked;
    const viteValue2_after = quoteBalanceUser2_after[quoteToken].available;
    const viteValueLocked2_after = quoteBalanceUser2_after[quoteToken].locked;
    const vttValue2_after = tradeBalanceUser2_after[tradeToken].available;
    const vttValueLocked2_after = tradeBalanceUser2_after[tradeToken].locked;
    console.log("user1 balance after:", viteValue1_after, viteValueLocked1_after, vttValue1_after, vttValueLocked1_after);
    console.log("user2 balance after:", viteValue2_after, viteValueLocked2_after, vttValue2_after, vttValueLocked2_after);

    const tradingQuantityOfMarketOrder = new Big(quantity).sub(new Big(vttValueLocked1_after)).toFixed();
    assert.equal(viteValue1_after, new Big(initViteAmount).add(dex.getSellerObtainAmount(price1, tradingQuantityOfMarketOrder, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed());
    assert.equal(viteValueLocked1_after, "0");
    assert.equal(vttValue1_after, new Big(initVttAmount).sub(new Big(quantity)).toFixed());
    assert.equal(vttValueLocked1_after, new Big(initVttAmount).add(new Big(quantity)).sub(new Big(vttValue2_after)));

    // the total value of VTT hold by user1 and user2 must be 20w
    assert.equal(new Big(initVttAmount).mul(2).toFixed(),
      (new Big(vttValue1_after).add(new Big(vttValueLocked1_after)).add(new Big(vttValue2_after)).add(new Big(vttValueLocked2_after)).toFixed()));

    // the total value of VITE hold by user1 and user2 + the TradingFees must be 20w
    const totalFees = dex.getSellerFee(price1, tradingQuantityOfMarketOrder, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)
      .add(dex.getBuyerFee(price1, tradingQuantityOfMarketOrder, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed();

    assert.equal(new Big(initViteAmount).mul(2).toFixed(),
      (new Big(viteValue1_after).add(new Big(viteValueLocked1_after)).add(new Big(viteValue2_after)).add(new Big(viteValueLocked2_after)
        .add(new Big(totalFees))).toFixed()));

    await dex.cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });

  it("test FundContract placeOrder - MarketOrder - first Limit then Market Order ", async () => {
    const initViteAmount = "100000000000000000000000"; // 10w VITE
    const initVttAmount = "100000000000000000000000";  // 10w VTT

    const user1 = randomUser(provider); // seller
    const user2 = randomUser(provider); // buyer
    const user1Address = user1.address;
    const user2Address = user2.address;
    console.log(`random user1 ${user1.address}`)
    console.log(`random user2 ${user2.address}`)
    const user1FundContract = contractWithUser(user1, fundAbi, fundContractAddress);
    const user2FundContract = contractWithUser(user2, fundAbi, fundContractAddress);
    const user1TradeContract = contractWithUser(user1, tradeAbi, tradeContractAddress);
    const user2TradeContract = contractWithUser(user2, tradeAbi, tradeContractAddress);

    await initValue(deployer, user1, initVttAmount, tradeToken);
    await initValue(deployer, user1, initViteAmount);
    await initValue(deployer, user2, initVttAmount, tradeToken);
    await initValue(deployer, user2, initViteAmount);

    await dex.depositToFund(user1FundContract, initViteAmount);
    await dex.depositToFund(user1FundContract, initVttAmount, tradeToken);
    await dex.depositToFund(user2FundContract, initViteAmount);
    await dex.depositToFund(user2FundContract, initViteAmount, tradeToken);

    // place Limit orders
    const price1 = "8000"
    const price2 = "9000"
    const price3 = "0.25"
    const quantity = "6000000000000000000"
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price1, quantity); // sell 6 VTT
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderLimit, price1, quantity); // buy 6 VTT
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price2, quantity); // sell 6 VTT
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderMarket, price3, quantity); // buy 6 VTT

    const quoteBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);

    const viteValue1_after = quoteBalanceUser1_after[quoteToken].available;
    const viteValueLocked1_after = quoteBalanceUser1_after[quoteToken].locked;
    const vttValue1_after = tradeBalanceUser1_after[tradeToken].available;
    const vttValueLocked1_after = tradeBalanceUser1_after[tradeToken].locked;
    const viteValue2_after = quoteBalanceUser2_after[quoteToken].available;
    const viteValueLocked2_after = quoteBalanceUser2_after[quoteToken].locked;
    const vttValue2_after = tradeBalanceUser2_after[tradeToken].available;
    const vttValueLocked2_after = tradeBalanceUser2_after[tradeToken].locked;
    console.log("user1 balance after:", viteValue1_after, viteValueLocked1_after, vttValue1_after, vttValueLocked1_after);
    console.log("user2 balance after:", viteValue2_after, viteValueLocked2_after, vttValue2_after, vttValueLocked2_after);

    const tradingQuantityOfMarketOrder = new Big(quantity).sub(new Big(vttValueLocked1_after)).toFixed();
    assert.equal(viteValue1_after, new Big(initViteAmount).add(dex.getSellerObtainAmount(price1, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getSellerObtainAmount(price2, tradingQuantityOfMarketOrder, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed());
    assert.equal(viteValueLocked1_after, "0");
    assert.equal(vttValue1_after, new Big(initVttAmount).sub(new Big(quantity)).sub(new Big(quantity)).toFixed());
    assert.equal(vttValueLocked1_after, new Big(initVttAmount).add(new Big(quantity)).add(new Big(quantity)).sub(new Big(vttValue2_after)));

    // the total value of VTT hold by user1 and user2 must be 20w
    assert.equal(new Big(initVttAmount).mul(2).toFixed(),
      (new Big(vttValue1_after).add(new Big(vttValueLocked1_after)).add(new Big(vttValue2_after)).add(new Big(vttValueLocked2_after)).toFixed()));

    // the total value of VITE hold by user1 and user2 + the TradingFees must be 20w
    const totalFees = dex.getSellerFee(price1, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal).add(dex.getBuyerFee(price1, quantity, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getSellerFee(price2, tradingQuantityOfMarketOrder, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).add(dex.getBuyerFee(price2, tradingQuantityOfMarketOrder, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed();

    assert.equal(new Big(initViteAmount).mul(2).toFixed(),
      (new Big(viteValue1_after).add(new Big(viteValueLocked1_after)).add(new Big(viteValue2_after)).add(new Big(viteValueLocked2_after)
        .add(new Big(totalFees))).toFixed()));

    await dex.cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });

  it("test FundContract placeOrder - MarketOrder - No Limit Order while placing Market Order ", async () => {
    const initViteAmount = "100000000000000000000000"; // 10w VITE
    const initVttAmount = "100000000000000000000000";  // 10w VTT

    const user1 = randomUser(provider); // seller
    const user2 = randomUser(provider); // buyer
    const user1Address = user1.address;
    const user2Address = user2.address;
    console.log(`random user1 ${user1.address}`)
    console.log(`random user2 ${user2.address}`)
    const user1FundContract = contractWithUser(user1, fundAbi, fundContractAddress);
    const user2FundContract = contractWithUser(user2, fundAbi, fundContractAddress);
    const user1TradeContract = contractWithUser(user1, tradeAbi, tradeContractAddress);
    const user2TradeContract = contractWithUser(user2, tradeAbi, tradeContractAddress);

    await initValue(deployer, user1, initVttAmount, tradeToken);
    await initValue(deployer, user1, initViteAmount);
    await initValue(deployer, user2, initVttAmount, tradeToken);
    await initValue(deployer, user2, initViteAmount);

    await dex.depositToFund(user1FundContract, initViteAmount);
    await dex.depositToFund(user1FundContract, initVttAmount, tradeToken);
    await dex.depositToFund(user2FundContract, initViteAmount);
    await dex.depositToFund(user2FundContract, initViteAmount, tradeToken);

    const quoteBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_before = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_before = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);
    const viteValue1_before = quoteBalanceUser1_before[quoteToken].available;
    const viteValueLocked1_before = quoteBalanceUser1_before[quoteToken].locked;
    const vttValue1_before = tradeBalanceUser1_before[tradeToken].available;
    const vttValueLocked1_before = tradeBalanceUser1_before[tradeToken].locked;
    const viteValue2_before = quoteBalanceUser2_before[quoteToken].available;
    const viteValueLocked2_before = quoteBalanceUser2_before[quoteToken].locked;
    const vttValue2_before = tradeBalanceUser2_before[tradeToken].available;
    const vttValueLocked2_before = tradeBalanceUser2_before[tradeToken].locked;
    console.log("user1 balance before", viteValue1_before, viteValueLocked1_before, vttValue1_before, vttValueLocked1_before);
    console.log("user2 balance before", viteValue2_before, viteValueLocked2_before, vttValue2_before, vttValueLocked2_before);

    // place Limit orders
    const price = "0.25"
    const quantity = "6000000000000000000"
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderMarket, price, quantity); // sell 6 VTT

    const quoteBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);

    const viteValue1_after = quoteBalanceUser1_after[quoteToken].available;
    const viteValueLocked1_after = quoteBalanceUser1_after[quoteToken].locked;
    const vttValue1_after = tradeBalanceUser1_after[tradeToken].available;
    const vttValueLocked1_after = tradeBalanceUser1_after[tradeToken].locked;
    const viteValue2_after = quoteBalanceUser2_after[quoteToken].available;
    const viteValueLocked2_after = quoteBalanceUser2_after[quoteToken].locked;
    const vttValue2_after = tradeBalanceUser2_after[tradeToken].available;
    const vttValueLocked2_after = tradeBalanceUser2_after[tradeToken].locked;
    console.log("user1 balance after:", viteValue1_after, viteValueLocked1_after, vttValue1_after, vttValueLocked1_after);
    console.log("user2 balance after:", viteValue2_after, viteValueLocked2_after, vttValue2_after, vttValueLocked2_after);

    assert.equal(viteValue2_after, initViteAmount);
    assert.equal(viteValueLocked2_after, "0");
    assert.equal(vttValue2_after, initVttAmount);
    assert.equal(vttValueLocked2_after, "0");

    await dex.cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });

  it("test FundContract placeOrder - MarketOrder with enough balance - fill multi Limit Orders ", async () => {
    const initViteAmount = "100000000000000000000000"; // 10w VITE
    const initVttAmount = "100000000000000000000000";  // 10w VTT

    const user1 = randomUser(provider); // seller
    const user2 = randomUser(provider); // buyer
    const user1Address = user1.address;
    const user2Address = user2.address;
    console.log(`random user1 ${user1.address}`)
    console.log(`random user2 ${user2.address}`)
    const user1FundContract = contractWithUser(user1, fundAbi, fundContractAddress);
    const user2FundContract = contractWithUser(user2, fundAbi, fundContractAddress);
    const user1TradeContract = contractWithUser(user1, tradeAbi, tradeContractAddress);
    const user2TradeContract = contractWithUser(user2, tradeAbi, tradeContractAddress);

    await initValue(deployer, user1, initVttAmount, tradeToken);
    await initValue(deployer, user1, initViteAmount);
    await initValue(deployer, user2, initVttAmount, tradeToken);
    await initValue(deployer, user2, initViteAmount);

    await dex.depositToFund(user1FundContract, initViteAmount);
    await dex.depositToFund(user1FundContract, initVttAmount, tradeToken);
    await dex.depositToFund(user2FundContract, initViteAmount);
    await dex.depositToFund(user2FundContract, initViteAmount, tradeToken);

    // place Limit orders
    const price1 = "2000"
    const price2 = "3000"
    const price3 = "0.25"
    const quantity1 = "6000000000000000000"
    const quantity2 = "6000000000000000000"
    const quantityMarketOrder = "12000000000000000000" // must > 6, such as 9,12,14
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price1, quantity1); // sell 6 VTT
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price2, quantity2); // sell 6 VTT
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderMarket, price3, quantityMarketOrder); // buy 6 VTT

    const quoteBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);

    const viteValue1_after = quoteBalanceUser1_after[quoteToken].available;
    const viteValueLocked1_after = quoteBalanceUser1_after[quoteToken].locked;
    const vttValue1_after = tradeBalanceUser1_after[tradeToken].available;
    const vttValueLocked1_after = tradeBalanceUser1_after[tradeToken].locked;
    const viteValue2_after = quoteBalanceUser2_after[quoteToken].available;
    const viteValueLocked2_after = quoteBalanceUser2_after[quoteToken].locked;
    const vttValue2_after = tradeBalanceUser2_after[tradeToken].available;
    const vttValueLocked2_after = tradeBalanceUser2_after[tradeToken].locked;
    console.log("user1 balance after:", viteValue1_after, viteValueLocked1_after, vttValue1_after, vttValueLocked1_after);
    console.log("user2 balance after:", viteValue2_after, viteValueLocked2_after, vttValue2_after, vttValueLocked2_after);

    assert.equal(viteValue1_after, new Big(initViteAmount).add(dex.getSellerObtainAmount(price1, quantity1, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getSellerObtainAmount(price2, (new Big(quantity2).sub(new Big(vttValueLocked1_after))).toFixed(), makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed());
    assert.equal(viteValueLocked1_after, "0");
    assert.equal(vttValue1_after, new Big(initVttAmount).sub(new Big(quantity1)).sub(new Big(quantity2)).toFixed());
    assert.equal(vttValueLocked1_after, new Big(initVttAmount).add(new Big(quantity1)).add(new Big(quantity2)).sub(new Big(vttValue2_after)));

    // the total value of VTT hold by user1 and user2 must be 20w
    assert.equal(new Big(initVttAmount).mul(2).toFixed(),
      (new Big(vttValue1_after).add(new Big(vttValueLocked1_after)).add(new Big(vttValue2_after)).add(new Big(vttValueLocked2_after)).toFixed()));

    // the total value of VITE hold by user1 and user2 + the TradingFees must be 20w
    const totalFees = dex.getSellerFee(price1, quantity1, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)
      .add(dex.getBuyerFee(price1, quantity1, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getSellerFee(price2, (new Big(quantity2).sub(new Big(vttValueLocked1_after))).toFixed(), makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getBuyerFee(price2, (new Big(quantity2).sub(new Big(vttValueLocked1_after))).toFixed(), takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed();

    assert.equal(new Big(initViteAmount).mul(2).toFixed(),
      (new Big(viteValue1_after).add(new Big(viteValueLocked1_after)).add(new Big(viteValue2_after)).add(new Big(viteValueLocked2_after)
        .add(new Big(totalFees))).toFixed()));

    await dex.cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });

  it("test FundContract placeOrder - MarketOrder with little balance - fill multi Limit Orders ", async () => {
    const initViteAmount = "100000000000000000000000"; // 10w VITE
    const initVttAmount = "100000000000000000000000";  // 10w VTT

    const user1 = randomUser(provider); // seller
    const user2 = randomUser(provider); // buyer
    const user1Address = user1.address;
    const user2Address = user2.address;
    console.log(`random user1 ${user1.address}`)
    console.log(`random user2 ${user2.address}`)
    const user1FundContract = contractWithUser(user1, fundAbi, fundContractAddress);
    const user2FundContract = contractWithUser(user2, fundAbi, fundContractAddress);
    const user1TradeContract = contractWithUser(user1, tradeAbi, tradeContractAddress);
    const user2TradeContract = contractWithUser(user2, tradeAbi, tradeContractAddress);

    await initValue(deployer, user1, initVttAmount, tradeToken);
    await initValue(deployer, user1, initViteAmount);
    await initValue(deployer, user2, initVttAmount, tradeToken);
    await initValue(deployer, user2, initViteAmount);

    await dex.depositToFund(user1FundContract, initViteAmount);
    await dex.depositToFund(user1FundContract, initVttAmount, tradeToken);
    await dex.depositToFund(user2FundContract, initViteAmount);
    await dex.depositToFund(user2FundContract, initViteAmount, tradeToken);

    // place Limit orders
    const price1 = "8000"
    const price2 = "9000"
    const price3 = "0.25"
    const quantity1 = "6000000000000000000"
    const quantity2 = "8000000000000000000"
    const quantityMarketOrder = "14000000000000000000" 
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price1, quantity1); // sell 6 VTT
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price2, quantity2); // sell 6 VTT
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderMarket, price3, quantityMarketOrder); // buy 6 VTT

    const quoteBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);

    const viteValue1_after = quoteBalanceUser1_after[quoteToken].available;
    const viteValueLocked1_after = quoteBalanceUser1_after[quoteToken].locked;
    const vttValue1_after = tradeBalanceUser1_after[tradeToken].available;
    const vttValueLocked1_after = tradeBalanceUser1_after[tradeToken].locked;
    const viteValue2_after = quoteBalanceUser2_after[quoteToken].available;
    const viteValueLocked2_after = quoteBalanceUser2_after[quoteToken].locked;
    const vttValue2_after = tradeBalanceUser2_after[tradeToken].available;
    const vttValueLocked2_after = tradeBalanceUser2_after[tradeToken].locked;
    console.log("user1 balance after:", viteValue1_after, viteValueLocked1_after, vttValue1_after, vttValueLocked1_after);
    console.log("user2 balance after:", viteValue2_after, viteValueLocked2_after, vttValue2_after, vttValueLocked2_after);

    assert.equal(viteValue1_after, new Big(initViteAmount).add(dex.getSellerObtainAmount(price1, quantity1, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getSellerObtainAmount(price2, (new Big(quantity2).sub(new Big(vttValueLocked1_after))).toFixed(), makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed());
    assert.equal(viteValueLocked1_after, "0");
    assert.equal(vttValue1_after, new Big(initVttAmount).sub(new Big(quantity1)).sub(new Big(quantity2)).toFixed());
    assert.equal(vttValueLocked1_after, new Big(initVttAmount).add(new Big(quantity1)).add(new Big(quantity2)).sub(new Big(vttValue2_after)));

    // the total value of VTT hold by user1 and user2 must be 20w
    assert.equal(new Big(initVttAmount).mul(2).toFixed(),
      (new Big(vttValue1_after).add(new Big(vttValueLocked1_after)).add(new Big(vttValue2_after)).add(new Big(vttValueLocked2_after)).toFixed()));

    // the total value of VITE hold by user1 and user2 + the TradingFees must be 20w
    const totalFees = dex.getSellerFee(price1, quantity1, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)
      .add(dex.getBuyerFee(price1, quantity1, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getSellerFee(price2, (new Big(quantity2).sub(new Big(vttValueLocked1_after))).toFixed(), makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getBuyerFee(price2, (new Big(quantity2).sub(new Big(vttValueLocked1_after))).toFixed(), takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed();

    assert.equal(new Big(initViteAmount).mul(2).toFixed(),
      (new Big(viteValue1_after).add(new Big(viteValueLocked1_after)).add(new Big(viteValue2_after)).add(new Big(viteValueLocked2_after)
        .add(new Big(totalFees))).toFixed()));

    await dex.cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });

  it("test FundContract placeOrder - MarketOrder - Seller as taker ", async () => {
    const initViteAmount = "100000000000000000000000"; // 10w VITE
    const initVttAmount = "100000000000000000000000";  // 10w VTT

    const user1 = randomUser(provider); // seller
    const user2 = randomUser(provider); // buyer
    const user1Address = user1.address;
    const user2Address = user2.address;
    console.log(`random user1 ${user1.address}`)
    console.log(`random user2 ${user2.address}`)
    const user1FundContract = contractWithUser(user1, fundAbi, fundContractAddress);
    const user2FundContract = contractWithUser(user2, fundAbi, fundContractAddress);
    const user1TradeContract = contractWithUser(user1, tradeAbi, tradeContractAddress);
    const user2TradeContract = contractWithUser(user2, tradeAbi, tradeContractAddress);

    await initValue(deployer, user1, initVttAmount, tradeToken);
    await initValue(deployer, user1, initViteAmount);
    await initValue(deployer, user2, initVttAmount, tradeToken);
    await initValue(deployer, user2, initViteAmount);

    await dex.depositToFund(user1FundContract, initViteAmount);
    await dex.depositToFund(user1FundContract, initVttAmount, tradeToken);
    await dex.depositToFund(user2FundContract, initViteAmount);
    await dex.depositToFund(user2FundContract, initViteAmount, tradeToken);

    const quoteBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_before = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_before = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);
    const viteValue1_before = quoteBalanceUser1_before[quoteToken].available;
    const viteValueLocked1_before = quoteBalanceUser1_before[quoteToken].locked;
    const vttValue1_before = tradeBalanceUser1_before[tradeToken].available;
    const vttValueLocked1_before = tradeBalanceUser1_before[tradeToken].locked;
    const viteValue2_before = quoteBalanceUser2_before[quoteToken].available;
    const viteValueLocked2_before = quoteBalanceUser2_before[quoteToken].locked;
    const vttValue2_before = tradeBalanceUser2_before[tradeToken].available;
    const vttValueLocked2_before = tradeBalanceUser2_before[tradeToken].locked;
    console.log("user1 balance before", viteValue1_before, viteValueLocked1_before, vttValue1_before, vttValueLocked1_before);
    console.log("user2 balance before", viteValue2_before, viteValueLocked2_before, vttValue2_before, vttValueLocked2_before);

    // place Limit orders
    const price1 = "8000"
    const price3 = "9000"
    const quantity = "6000000000000000000"
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideBuy, orderLimit, price1, quantity); // buy 6 VTT
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideSell, orderMarket, price3, quantity); // sell 6 VTT

    const quoteBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);

    const viteValue1_after = quoteBalanceUser1_after[quoteToken].available;
    const viteValueLocked1_after = quoteBalanceUser1_after[quoteToken].locked;
    const vttValue1_after = tradeBalanceUser1_after[tradeToken].available;
    const vttValueLocked1_after = tradeBalanceUser1_after[tradeToken].locked;
    const viteValue2_after = quoteBalanceUser2_after[quoteToken].available;
    const viteValueLocked2_after = quoteBalanceUser2_after[quoteToken].locked;
    const vttValue2_after = tradeBalanceUser2_after[tradeToken].available;
    const vttValueLocked2_after = tradeBalanceUser2_after[tradeToken].locked;
    console.log("user1 balance after:", viteValue1_after, viteValueLocked1_after, vttValue1_after, vttValueLocked1_after);
    console.log("user2 balance after:", viteValue2_after, viteValueLocked2_after, vttValue2_after, vttValueLocked2_after);

    const executeQuantity = new Big(initVttAmount).sub(new Big(vttValue2_after)).toFixed();
    assert.equal(viteValue2_after, new Big(initViteAmount).add(dex.getSellerObtainAmount(price1, executeQuantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed());
    assert.equal(viteValueLocked2_after, "0");
    assert.equal(vttValue2_after, new Big(initVttAmount).sub(new Big(quantity)).toFixed());
    assert.equal(vttValueLocked2_after, "0");

    // the total value of VTT hold by user1 and user2 must be 20w
    assert.equal(new Big(initVttAmount).mul(2).toFixed(),
      (new Big(vttValue1_after).add(new Big(vttValueLocked1_after)).add(new Big(vttValue2_after)).add(new Big(vttValueLocked2_after)).toFixed()));

    // the total value of VITE hold by user1 and user2 + the TradingFees must be 20w
    const totalFees = dex.getSellerFee(price1, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)
      .add(dex.getBuyerFee(price1, quantity, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed();

    assert.equal(new Big(initViteAmount).mul(2).toFixed(),
      (new Big(viteValue1_after).add(new Big(viteValueLocked1_after)).add(new Big(viteValue2_after)).add(new Big(viteValueLocked2_after)
        .add(new Big(totalFees))).toFixed()));

    await dex.cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });

  it("test FundContract placeOrder - MarketOrder - Seller as taker - with more quantity", async () => {
    const initViteAmount = "100000000000000000000000"; // 10w VITE
    const initVttAmount = "100000000000000000000000";  // 10w VTT

    const user1 = randomUser(provider); // seller
    const user2 = randomUser(provider); // buyer
    const user1Address = user1.address;
    const user2Address = user2.address;
    console.log(`random user1 ${user1.address}`)
    console.log(`random user2 ${user2.address}`)
    const user1FundContract = contractWithUser(user1, fundAbi, fundContractAddress);
    const user2FundContract = contractWithUser(user2, fundAbi, fundContractAddress);
    const user1TradeContract = contractWithUser(user1, tradeAbi, tradeContractAddress);
    const user2TradeContract = contractWithUser(user2, tradeAbi, tradeContractAddress);

    await initValue(deployer, user1, initVttAmount, tradeToken);
    await initValue(deployer, user1, initViteAmount);
    await initValue(deployer, user2, initVttAmount, tradeToken);
    await initValue(deployer, user2, initViteAmount);

    await dex.depositToFund(user1FundContract, initViteAmount);
    await dex.depositToFund(user1FundContract, initVttAmount, tradeToken);
    await dex.depositToFund(user2FundContract, initViteAmount);
    await dex.depositToFund(user2FundContract, initViteAmount, tradeToken);

    const quoteBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_before = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_before = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);
    const viteValue1_before = quoteBalanceUser1_before[quoteToken].available;
    const viteValueLocked1_before = quoteBalanceUser1_before[quoteToken].locked;
    const vttValue1_before = tradeBalanceUser1_before[tradeToken].available;
    const vttValueLocked1_before = tradeBalanceUser1_before[tradeToken].locked;
    const viteValue2_before = quoteBalanceUser2_before[quoteToken].available;
    const viteValueLocked2_before = quoteBalanceUser2_before[quoteToken].locked;
    const vttValue2_before = tradeBalanceUser2_before[tradeToken].available;
    const vttValueLocked2_before = tradeBalanceUser2_before[tradeToken].locked;
    console.log("user1 balance before", viteValue1_before, viteValueLocked1_before, vttValue1_before, vttValueLocked1_before);
    console.log("user2 balance before", viteValue2_before, viteValueLocked2_before, vttValue2_before, vttValueLocked2_before);

    // place Limit orders
    const price1 = "800"
    const price2 = "900"
    const price3 = "9000"
    const quantity = "6000000000000000000"
    const quantityMarketSell = "20000000000000000000"
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideBuy, orderLimit, price1, quantity); // buy 6 VTT
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideBuy, orderLimit, price2, quantity); // buy 6 VTT
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideSell, orderMarket, price3, quantityMarketSell); // sell 20 VTT

    const quoteBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);

    const viteValue1_after = quoteBalanceUser1_after[quoteToken].available;
    const viteValueLocked1_after = quoteBalanceUser1_after[quoteToken].locked;
    const vttValue1_after = tradeBalanceUser1_after[tradeToken].available;
    const vttValueLocked1_after = tradeBalanceUser1_after[tradeToken].locked;
    const viteValue2_after = quoteBalanceUser2_after[quoteToken].available;
    const viteValueLocked2_after = quoteBalanceUser2_after[quoteToken].locked;
    const vttValue2_after = tradeBalanceUser2_after[tradeToken].available;
    const vttValueLocked2_after = tradeBalanceUser2_after[tradeToken].locked;
    console.log("user1 balance after:", viteValue1_after, viteValueLocked1_after, vttValue1_after, vttValueLocked1_after);
    console.log("user2 balance after:", viteValue2_after, viteValueLocked2_after, vttValue2_after, vttValueLocked2_after);

    assert.equal(viteValue2_after, new Big(initViteAmount).add(dex.getSellerObtainAmount(price1, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getSellerObtainAmount(price2, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed());
    assert.equal(viteValueLocked2_after, "0");
    assert.equal(vttValue2_after, new Big(initVttAmount).sub(new Big(quantity).mul(2)).toFixed());
    assert.equal(vttValueLocked2_after, "0");

    // the total value of VTT hold by user1 and user2 must be 20w
    assert.equal(new Big(initVttAmount).mul(2).toFixed(),
      (new Big(vttValue1_after).add(new Big(vttValueLocked1_after)).add(new Big(vttValue2_after)).add(new Big(vttValueLocked2_after)).toFixed()));

    // the total value of VITE hold by user1 and user2 + the TradingFees must be 20w
    const totalFees = dex.getSellerFee(price1, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)
      .add(dex.getBuyerFee(price1, quantity, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getSellerFee(price2, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getBuyerFee(price2, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .toFixed()

    assert.equal(new Big(initViteAmount).mul(2).toFixed(),
      (new Big(viteValue1_after).add(new Big(viteValueLocked1_after)).add(new Big(viteValue2_after)).add(new Big(viteValueLocked2_after)
        .add(new Big(totalFees))).toFixed()));

    await dex.cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });

  it("test FundContract placeOrder - MarketOrder - Seller as taker - with less quantity", async () => {
    const initViteAmount = "100000000000000000000000"; // 10w VITE
    const initVttAmount = "100000000000000000000000";  // 10w VTT

    const user1 = randomUser(provider); // seller
    const user2 = randomUser(provider); // buyer
    const user1Address = user1.address;
    const user2Address = user2.address;
    console.log(`random user1 ${user1.address}`)
    console.log(`random user2 ${user2.address}`)
    const user1FundContract = contractWithUser(user1, fundAbi, fundContractAddress);
    const user2FundContract = contractWithUser(user2, fundAbi, fundContractAddress);
    const user1TradeContract = contractWithUser(user1, tradeAbi, tradeContractAddress);
    const user2TradeContract = contractWithUser(user2, tradeAbi, tradeContractAddress);

    await initValue(deployer, user1, initVttAmount, tradeToken);
    await initValue(deployer, user1, initViteAmount);
    await initValue(deployer, user2, initVttAmount, tradeToken);
    await initValue(deployer, user2, initViteAmount);

    await dex.depositToFund(user1FundContract, initViteAmount);
    await dex.depositToFund(user1FundContract, initVttAmount, tradeToken);
    await dex.depositToFund(user2FundContract, initViteAmount);
    await dex.depositToFund(user2FundContract, initViteAmount, tradeToken);

    const quoteBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_before = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_before = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);
    const viteValue1_before = quoteBalanceUser1_before[quoteToken].available;
    const viteValueLocked1_before = quoteBalanceUser1_before[quoteToken].locked;
    const vttValue1_before = tradeBalanceUser1_before[tradeToken].available;
    const vttValueLocked1_before = tradeBalanceUser1_before[tradeToken].locked;
    const viteValue2_before = quoteBalanceUser2_before[quoteToken].available;
    const viteValueLocked2_before = quoteBalanceUser2_before[quoteToken].locked;
    const vttValue2_before = tradeBalanceUser2_before[tradeToken].available;
    const vttValueLocked2_before = tradeBalanceUser2_before[tradeToken].locked;
    console.log("user1 balance before", viteValue1_before, viteValueLocked1_before, vttValue1_before, vttValueLocked1_before);
    console.log("user2 balance before", viteValue2_before, viteValueLocked2_before, vttValue2_before, vttValueLocked2_before);

    // place Limit orders
    const price1 = "800"
    const price2 = "900"
    const price3 = "9000"
    const quantity = "6000000000000000000"
    const quantityMarketSell = "8000000000000000000"
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideBuy, orderLimit, price1, quantity); // buy 6 VTT
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideBuy, orderLimit, price2, quantity); // buy 6 VTT
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideSell, orderMarket, price3, quantityMarketSell); // sell 20 VTT

    const quoteBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);

    const viteValue1_after = quoteBalanceUser1_after[quoteToken].available;
    const viteValueLocked1_after = quoteBalanceUser1_after[quoteToken].locked;
    const vttValue1_after = tradeBalanceUser1_after[tradeToken].available;
    const vttValueLocked1_after = tradeBalanceUser1_after[tradeToken].locked;
    const viteValue2_after = quoteBalanceUser2_after[quoteToken].available;
    const viteValueLocked2_after = quoteBalanceUser2_after[quoteToken].locked;
    const vttValue2_after = tradeBalanceUser2_after[tradeToken].available;
    const vttValueLocked2_after = tradeBalanceUser2_after[tradeToken].locked;
    console.log("user1 balance after:", viteValue1_after, viteValueLocked1_after, vttValue1_after, vttValueLocked1_after);
    console.log("user2 balance after:", viteValue2_after, viteValueLocked2_after, vttValue2_after, vttValueLocked2_after);

    const partlyExecutedQuantity = new Big(quantityMarketSell).sub(new Big(quantity)).toFixed();
    assert.equal(viteValue2_after, new Big(initViteAmount).add(dex.getSellerObtainAmount(price2, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getSellerObtainAmount(price1, partlyExecutedQuantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed());
    assert.equal(viteValueLocked2_after, "0");
    assert.equal(vttValue2_after, new Big(initVttAmount).sub(new Big(quantityMarketSell)).toFixed());
    assert.equal(vttValueLocked2_after, "0");

    // the total value of VTT hold by user1 and user2 must be 20w
    assert.equal(new Big(initVttAmount).mul(2).toFixed(),
      (new Big(vttValue1_after).add(new Big(vttValueLocked1_after)).add(new Big(vttValue2_after)).add(new Big(vttValueLocked2_after)).toFixed()));

    // the total value of VITE hold by user1 and user2 + the TradingFees must be 20w
    const totalFees = dex.getSellerFee(price1, partlyExecutedQuantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)
      .add(dex.getBuyerFee(price1, partlyExecutedQuantity, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getSellerFee(price2, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getBuyerFee(price2, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .toFixed()

    assert.equal(new Big(initViteAmount).mul(2).toFixed(),
      (new Big(viteValue1_after).add(new Big(viteValueLocked1_after)).add(new Big(viteValue2_after)).add(new Big(viteValueLocked2_after)
        .add(new Big(totalFees))).toFixed()));

    await dex.cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });

});


