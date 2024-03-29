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
let fundContract: vuilder.Contract;
let takerPlatformFeeRate: number = 0.002;
let makerPlatformFeeRate: number = 0.002;
let takerBrokerFeeRate: number = 0;
let makerBrokerFeeRate: number = 0;
let tradeTokenDecimal: number = 6;
let quoteTokenDecimal: number = 18;

const fundContractAddress =
  "vite_0000000000000000000000000000000000000006e82b8ba657";
const tradeContractAddress =
  "vite_00000000000000000000000000000000000000079710f19dc7";
const tradeToken = "tti_b409b0a83380a8c3f28fe05c"; // wow
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

    fundContract = new vuilder.Contract("FundContract", "", fundAbi);
    fundContract.attach(fundContractAddress);
    fundContract.setDeployer(deployer);
    fundContract.setProvider(provider);

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
    const initWowAmount = "1000000000"; // 1000 WOW
    const initViteAmount = "100000000000000000000000";  // 10w VITE

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

    await initValue(deployer, user1, initViteAmount, quoteToken);
    await initValue(deployer, user1, initWowAmount, tradeToken);
    await initValue(deployer, user2, initViteAmount, quoteToken);
    await initValue(deployer, user2, initWowAmount, tradeToken);

    await dex.depositToFund(user1FundContract, initWowAmount, tradeToken);
    await dex.depositToFund(user1FundContract, initViteAmount, quoteToken);
    await dex.depositToFund(user2FundContract, initWowAmount, tradeToken);
    await dex.depositToFund(user2FundContract, initViteAmount, quoteToken);

    const quoteBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_before = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_before = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_before = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);

    const quoteValue1_before = quoteBalanceUser1_before[quoteToken].available;
    const quoteValueLocked1_before = quoteBalanceUser1_before[quoteToken].locked;
    const tradeValue1_before = tradeBalanceUser1_before[tradeToken].available;
    const tradeValueLocked1_before = tradeBalanceUser1_before[tradeToken].locked;
    const quoteValue2_before = quoteBalanceUser2_before[quoteToken].available;
    const quoteValueLocked2_before = quoteBalanceUser2_before[quoteToken].locked;
    const tradeValue2_before = tradeBalanceUser2_before[tradeToken].available;
    const tradeValueLocked2_before = tradeBalanceUser2_before[tradeToken].locked;
    console.log("user1 balance before", quoteValue1_before, quoteValueLocked1_before, tradeValue1_before, tradeValueLocked1_before);
    console.log("user2 balance before", quoteValue2_before, quoteValueLocked2_before, tradeValue2_before, tradeValueLocked2_before);

    assert.equal(quoteValue1_before, initViteAmount);
    assert.equal(quoteValueLocked1_before, "0");
    assert.equal(tradeValue1_before, initWowAmount);
    assert.equal(tradeValueLocked1_before, "0");
    assert.equal(quoteValue2_before, initViteAmount);
    assert.equal(quoteValueLocked2_before, "0");
    assert.equal(tradeValue2_before, initWowAmount);
    assert.equal(tradeValueLocked2_before, "0");


    // place Limit orders: WOW/VITE
    const price = "8000"
    const quantity = "6000000" 
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price, quantity); // sell 6 VTT
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderLimit, price, quantity); // buy 6 VTT

    const quoteBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);

    const quoteValue1_after = quoteBalanceUser1_after[quoteToken].available;
    const quoteValueLocked1_after = quoteBalanceUser1_after[quoteToken].locked;
    const tradeValue1_after = tradeBalanceUser1_after[tradeToken].available;
    const tradeValueLocked1_after = tradeBalanceUser1_after[tradeToken].locked;
    const quoteValue2_after = quoteBalanceUser2_after[quoteToken].available;
    const quoteValueLocked2_after = quoteBalanceUser2_after[quoteToken].locked;
    const tradeValue2_after = tradeBalanceUser2_after[tradeToken].available;
    const tradeValueLocked2_after = tradeBalanceUser2_after[tradeToken].locked;
    console.log("user1 balance after:", quoteValue1_after, quoteValueLocked1_after, tradeValue1_after, tradeValueLocked1_after);
    console.log("user2 balance after:", quoteValue2_after, quoteValueLocked2_after, tradeValue2_after, tradeValueLocked2_after);

    const tradingQuantity = new Big(tradeValue2_after).sub(new Big(tradeValue2_before)).toFixed();
    assert.equal(quoteValue1_after, new Big(initViteAmount).add(dex.getSellerObtainAmount(price, tradingQuantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed());
    assert.equal(quoteValueLocked1_after, "0");
    assert.equal(tradeValue1_after, new Big(initWowAmount).sub(new Big(tradingQuantity)).toFixed());
    assert.equal(tradeValueLocked1_after, "0");
    assert.equal(quoteValue2_after, (new Big(initViteAmount).sub(dex.getBuyerCostAmount(price, tradingQuantity, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))).toFixed());
    assert.equal(quoteValueLocked2_after, "0");
    assert.equal(tradeValue2_after, new Big(initWowAmount).add(new Big(tradingQuantity)).toFixed());
    assert.equal(tradeValueLocked2_after, "0");

    await dex.cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });

  it("test FundContract placeOrder - MarketOrder - market order directly fill - not enough balance ", async () => {
    const initTradeAmount = "1000000000"; // 1000 WOW
    const initQuoteAmount = "100000000000000000000000";  // 10w VITE

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

    await initValue(deployer, user1, initTradeAmount, tradeToken);
    await initValue(deployer, user1, initQuoteAmount, quoteToken);
    await initValue(deployer, user2, initTradeAmount, tradeToken);
    await initValue(deployer, user2, initQuoteAmount, quoteToken);

    await dex.depositToFund(user1FundContract, initQuoteAmount, quoteToken);
    await dex.depositToFund(user1FundContract, initTradeAmount, tradeToken);
    await dex.depositToFund(user2FundContract, initQuoteAmount, quoteToken);
    await dex.depositToFund(user2FundContract, initTradeAmount, tradeToken);

    // place orders
    const price2 = "18000"
    const price3 = "0.00025"
    const quantity = "6000000"
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price2, quantity); // sell 6 WOW
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderMarket, price3, quantity); // buy 6 WOW

    const quoteBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);

    const quoteValue1_after = quoteBalanceUser1_after[quoteToken].available;
    const quoteValueLocked1_after = quoteBalanceUser1_after[quoteToken].locked;
    const tradeValue1_after = tradeBalanceUser1_after[tradeToken].available;
    const tradeValueLocked1_after = tradeBalanceUser1_after[tradeToken].locked;
    const quoteValue2_after = quoteBalanceUser2_after[quoteToken].available;
    const quoteValueLocked2_after = quoteBalanceUser2_after[quoteToken].locked;
    const tradeValue2_after = tradeBalanceUser2_after[tradeToken].available;
    const tradeValueLocked2_after = tradeBalanceUser2_after[tradeToken].locked;
    console.log("user1 balance after:", quoteValue1_after, quoteValueLocked1_after, tradeValue1_after, tradeValueLocked1_after);
    console.log("user2 balance after:", quoteValue2_after, quoteValueLocked2_after, tradeValue2_after, tradeValueLocked2_after);

    const tradingQuantityOfMarketOrder = new Big(quantity).sub(new Big(tradeValueLocked1_after)).toFixed();
    assert.equal(quoteValue1_after, new Big(initQuoteAmount).add(dex.getSellerObtainAmount(price2, tradingQuantityOfMarketOrder, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal ,quoteTokenDecimal)).toFixed());
    assert.equal(quoteValueLocked1_after, "0");
    assert.equal(tradeValue1_after, new Big(initTradeAmount).sub(new Big(quantity)).toFixed());
    assert.equal(tradeValueLocked1_after, new Big(initTradeAmount).add(new Big(quantity)).sub(new Big(tradeValue2_after)).toFixed());

    assert.equal(new Big(initTradeAmount).mul(2).toFixed(),
      (new Big(tradeValue1_after).add(new Big(tradeValueLocked1_after)).add(new Big(tradeValue2_after)).add(new Big(tradeValueLocked2_after)).toFixed()));

    const totalFees = dex.getSellerFee(price2, tradingQuantityOfMarketOrder, makerPlatformFeeRate, makerBrokerFeeRate,tradeTokenDecimal ,quoteTokenDecimal)
      .add(dex.getBuyerFee(price2, tradingQuantityOfMarketOrder, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .toFixed();

    assert.equal(new Big(initQuoteAmount).mul(2).toFixed(),
      (new Big(quoteValue1_after).add(new Big(quoteValueLocked1_after)).add(new Big(quoteValue2_after)).add(new Big(quoteValueLocked2_after)
        .add(new Big(totalFees))).toFixed()));

    await dex.cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });

  it("test FundContract placeOrder - MarketOrder ", async () => {
    const initTradeAmount = "1000000000"; // 1000 WOW
    const initQuoteAmount = "100000000000000000000000";  // 10w VITE

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

    await initValue(deployer, user1, initQuoteAmount, quoteToken);
    await initValue(deployer, user1, initTradeAmount, tradeToken);
    await initValue(deployer, user2, initQuoteAmount, quoteToken);
    await initValue(deployer, user2, initTradeAmount, tradeToken);

    await dex.depositToFund(user1FundContract, initTradeAmount, tradeToken);
    await dex.depositToFund(user1FundContract, initQuoteAmount, quoteToken);
    await dex.depositToFund(user2FundContract, initTradeAmount, tradeToken);
    await dex.depositToFund(user2FundContract, initQuoteAmount, quoteToken);

    // place Limit orders
    const price1 = "8000"
    // pass - price2:[500, 600, 8600, 8800, 8900, 9000, 10000, 11000, 12000, 13000, 15000] 
    const price2 = "9000"
    const price3 = "0.25"
    const quantity = "6000000"
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price1, quantity); // sell 6 WOW
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderLimit, price1, quantity); // buy 6 WOW
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price2, quantity); // sell 6 WOW
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderMarket, price3, quantity); // buy 6 WOW

    const quoteBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);

    const quoteValue1_after = quoteBalanceUser1_after[quoteToken].available;
    const quoteValueLocked1_after = quoteBalanceUser1_after[quoteToken].locked;
    const tradeValue1_after = tradeBalanceUser1_after[tradeToken].available;
    const tradeValueLocked1_after = tradeBalanceUser1_after[tradeToken].locked;
    const quoteValue2_after = quoteBalanceUser2_after[quoteToken].available;
    const quoteValueLocked2_after = quoteBalanceUser2_after[quoteToken].locked;
    const tradeValue2_after = tradeBalanceUser2_after[tradeToken].available;
    const tradeValueLocked2_after = tradeBalanceUser2_after[tradeToken].locked;
    console.log("user1 balance after:", quoteValue1_after, quoteValueLocked1_after, tradeValue1_after, tradeValueLocked1_after);
    console.log("user2 balance after:", quoteValue2_after, quoteValueLocked2_after, tradeValue2_after, tradeValueLocked2_after);

    const tradingQuantityOfMarketOrder = new Big(quantity).sub(new Big(tradeValueLocked1_after)).toFixed();
    assert.equal(quoteValue1_after, new Big(initQuoteAmount).add(dex.getSellerObtainAmount(price1, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getSellerObtainAmount(price2, tradingQuantityOfMarketOrder, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal ,quoteTokenDecimal)).toFixed());
    assert.equal(quoteValueLocked1_after, "0");
    assert.equal(tradeValue1_after, new Big(initTradeAmount).sub(new Big(quantity)).sub(new Big(quantity)).toFixed());
    assert.equal(tradeValueLocked1_after, new Big(initTradeAmount).add(new Big(quantity)).add(new Big(quantity)).sub(new Big(tradeValue2_after).toFixed()));

    // the total value of WOW hold by user1 and user2 must be 2000
    assert.equal(new Big(initTradeAmount).mul(2).toFixed(),
      (new Big(tradeValue1_after).add(new Big(tradeValueLocked1_after)).add(new Big(tradeValue2_after)).add(new Big(tradeValueLocked2_after)).toFixed()));

    // the total value of VITE hold by user1 and user2 + the TradingFees must be 20w
    const totalFees = dex.getSellerFee(price1, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)
      .add(dex.getBuyerFee(price1, quantity, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getSellerFee(price2, tradingQuantityOfMarketOrder, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getBuyerFee(price2, tradingQuantityOfMarketOrder, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .toFixed();

    assert.equal(new Big(initQuoteAmount).mul(2).toFixed(),
      (new Big(quoteValue1_after).add(new Big(quoteValueLocked1_after)).add(new Big(quoteValue2_after)).add(new Big(quoteValueLocked2_after)
        .add(new Big(totalFees))).toFixed()));

    await dex.cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });

  it("test FundContract placeOrder - MarketOrder - multi Limit Sell Orders ", async () => {
    const initTradeAmount = "1000000000"; // 1000 WOW
    const initQuoteAmount = "100000000000000000000000";  // 10w VITE

    const user1 = randomUser(provider); // seller
    const user2 = randomUser(provider); // buyer
    const user3 = randomUser(provider); // buyer
    const user1Address = user1.address;
    const user2Address = user2.address;
    const user3Address = user3.address;
    console.log(`random user1 ${user1.address}`)
    console.log(`random user2 ${user2.address}`)
    console.log(`random user3 ${user3.address}`)
    const user1FundContract = contractWithUser(user1, fundAbi, fundContractAddress);
    const user2FundContract = contractWithUser(user2, fundAbi, fundContractAddress);
    const user3FundContract = contractWithUser(user3, fundAbi, fundContractAddress);
    const user1TradeContract = contractWithUser(user1, tradeAbi, tradeContractAddress);
    const user2TradeContract = contractWithUser(user2, tradeAbi, tradeContractAddress);
    const user3TradeContract = contractWithUser(user3, tradeAbi, tradeContractAddress);
    

    await initValue(deployer, user1, initQuoteAmount, quoteToken);
    await initValue(deployer, user1, initTradeAmount, tradeToken);
    await initValue(deployer, user2, initQuoteAmount, quoteToken);
    await initValue(deployer, user2, initTradeAmount, tradeToken);
    await initValue(deployer, user3, initQuoteAmount, quoteToken);
    await initValue(deployer, user3, initTradeAmount, tradeToken);

    await dex.depositToFund(user1FundContract, initTradeAmount, tradeToken);
    await dex.depositToFund(user1FundContract, initQuoteAmount, quoteToken);
    await dex.depositToFund(user2FundContract, initTradeAmount, tradeToken);
    await dex.depositToFund(user2FundContract, initQuoteAmount, quoteToken);
    await dex.depositToFund(user3FundContract, initTradeAmount, tradeToken);
    await dex.depositToFund(user3FundContract, initQuoteAmount, quoteToken);

    // place Limit orders
    const price1 = "8000"
    // pass - price2:[500, 600, 8600, 8800, 8900, 9000, 10000, 11000, 12000, 13000, 15000] 
    const price2 = "9000"
    const price3 = "0.25"
    const quantity = "6000000"
    const quantity1 = "1000000"
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price1, quantity); // sell 6 WOW
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderLimit, price1, quantity); // buy 6 WOW


    await dex.placeOrder(user3FundContract, tradeToken, quoteToken, sideSell, orderLimit, "10001", quantity1); // sell 1 WOW
    await dex.placeOrder(user3FundContract, tradeToken, quoteToken, sideSell, orderLimit, "10002", quantity1); // sell 1 WOW
    await dex.placeOrder(user3FundContract, tradeToken, quoteToken, sideSell, orderLimit, "10003", quantity1); // sell 1 WOW
    await dex.placeOrder(user3FundContract, tradeToken, quoteToken, sideSell, orderLimit, "10004", quantity1); // sell 1 WOW


    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price2, quantity); // sell 6 WOW
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderMarket, price3, quantity); // buy 6 WOW

    const quoteBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1_after = await dex.getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2_after = await dex.getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);

    const quoteValue1_after = quoteBalanceUser1_after[quoteToken].available;
    const quoteValueLocked1_after = quoteBalanceUser1_after[quoteToken].locked;
    const tradeValue1_after = tradeBalanceUser1_after[tradeToken].available;
    const tradeValueLocked1_after = tradeBalanceUser1_after[tradeToken].locked;
    const quoteValue2_after = quoteBalanceUser2_after[quoteToken].available;
    const quoteValueLocked2_after = quoteBalanceUser2_after[quoteToken].locked;
    const tradeValue2_after = tradeBalanceUser2_after[tradeToken].available;
    const tradeValueLocked2_after = tradeBalanceUser2_after[tradeToken].locked;
    console.log("user1 balance after:", quoteValue1_after, quoteValueLocked1_after, tradeValue1_after, tradeValueLocked1_after);
    console.log("user2 balance after:", quoteValue2_after, quoteValueLocked2_after, tradeValue2_after, tradeValueLocked2_after);

    const tradingQuantityOfMarketOrder = new Big(quantity).sub(new Big(tradeValueLocked1_after)).toFixed();
    assert.equal(quoteValue1_after, new Big(initQuoteAmount).add(dex.getSellerObtainAmount(price1, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getSellerObtainAmount(price2, tradingQuantityOfMarketOrder, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal ,quoteTokenDecimal)).toFixed());
    assert.equal(quoteValueLocked1_after, "0");
    assert.equal(tradeValue1_after, new Big(initTradeAmount).sub(new Big(quantity)).sub(new Big(quantity)).toFixed());
    assert.equal(tradeValueLocked1_after, new Big(initTradeAmount).add(new Big(quantity)).add(new Big(quantity)).sub(new Big(tradeValue2_after).toFixed()));

    // the total value of WOW hold by user1 and user2 must be 2000
    assert.equal(new Big(initTradeAmount).mul(2).toFixed(),
      (new Big(tradeValue1_after).add(new Big(tradeValueLocked1_after)).add(new Big(tradeValue2_after)).add(new Big(tradeValueLocked2_after)).toFixed()));

    // the total value of VITE hold by user1 and user2 + the TradingFees must be 20w
    const totalFees = dex.getSellerFee(price1, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)
      .add(dex.getBuyerFee(price1, quantity, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getSellerFee(price2, tradingQuantityOfMarketOrder, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getBuyerFee(price2, tradingQuantityOfMarketOrder, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .toFixed();

    assert.equal(new Big(initQuoteAmount).mul(2).toFixed(),
      (new Big(quoteValue1_after).add(new Big(quoteValueLocked1_after)).add(new Big(quoteValue2_after)).add(new Big(quoteValueLocked2_after)
        .add(new Big(totalFees))).toFixed()));

    // await dex.cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });
});


