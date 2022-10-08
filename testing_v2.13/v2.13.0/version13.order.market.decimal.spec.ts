// import { describe } from "mocha";
import { expect, assert } from "chai";
import * as vuilder from "@vite/vuilder";
import fundAbi from "../abi/fund.abi.json";
import tradeAbi from "../abi/trade.abi.json";
import Decimal from 'decimal.js';
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
let tradeTokenDecimal: number = 18;
let quoteTokenDecimal: number = 8;

const fundContractAddress =
  "vite_0000000000000000000000000000000000000006e82b8ba657";
const tradeContractAddress =
  "vite_00000000000000000000000000000000000000079710f19dc7";
const tradeToken = "tti_2736f320d7ed1c2871af1d9d"; // vtt
const quoteToken = "tti_322862b3f8edae3b02b110b1"; // BTC

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
    const initBtcAmount = "1000000000"; // 10 BTC
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
    await initValue(deployer, user1, initBtcAmount, quoteToken);
    await initValue(deployer, user2, initVttAmount, tradeToken);
    await initValue(deployer, user2, initBtcAmount, quoteToken);

    await dex.depositToFund(user1FundContract, initBtcAmount, quoteToken);
    await dex.depositToFund(user1FundContract, initVttAmount, tradeToken);
    await dex.depositToFund(user2FundContract, initBtcAmount, quoteToken);
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

    assert.equal(viteValue1_before, initBtcAmount);
    assert.equal(viteValueLocked1_before, "0");
    assert.equal(vttValue1_before, initVttAmount);
    assert.equal(vttValueLocked1_before, "0");
    assert.equal(viteValue2_before, initBtcAmount);
    assert.equal(viteValueLocked2_before, "0");
    assert.equal(vttValue2_before, initVttAmount);
    assert.equal(vttValueLocked2_before, "0");


    // place Limit orders: VTT/BTC
    const price = "0.008"
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

    const tradingQuantity = new Decimal(vttValue2_after).sub(new Decimal(vttValue2_before)).toFixed();
    assert.equal(viteValue1_after, new Decimal(initBtcAmount).add(dex.getSellerObtainAmount(price, tradingQuantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal)).toFixed());
    assert.equal(viteValueLocked1_after, "0");
    assert.equal(vttValue1_after, new Decimal(initVttAmount).sub(new Decimal(tradingQuantity)).toFixed());
    assert.equal(vttValueLocked1_after, "0");
    assert.equal(viteValue2_after, (new Decimal(initBtcAmount).sub(dex.getBuyerCostAmount(price, tradingQuantity, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))).toFixed());
    assert.equal(viteValueLocked2_after, "0");
    assert.equal(vttValue2_after, new Decimal(initVttAmount).add(new Decimal(tradingQuantity)).toFixed());
    assert.equal(vttValueLocked2_after, "0");

    await dex.cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });

  it("test FundContract placeOrder - MarketOrder ", async () => {
    const initBtcAmount = "10000000"; // 10 BTC
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
    await initValue(deployer, user1, initBtcAmount, quoteToken);
    await initValue(deployer, user2, initVttAmount, tradeToken);
    await initValue(deployer, user2, initBtcAmount, quoteToken);

    await dex.depositToFund(user1FundContract, initBtcAmount, quoteToken);
    await dex.depositToFund(user1FundContract, initVttAmount, tradeToken);
    await dex.depositToFund(user2FundContract, initBtcAmount, quoteToken);
    await dex.depositToFund(user2FundContract, initVttAmount, tradeToken);

    // place Limit orders
    const price1 = "0.008"
    const price2 = "0.009"
    const price3 = "0.00025"
    const quantity = "6000000000000000000"
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price1, quantity); // sell 6 VTT
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderLimit, price1, quantity); // sell 6 VTT
    await dex.placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, price2, quantity); // sell 6 VTT
    await dex.placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderMarket, price3, quantity); // sell 6 VTT

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

    const tradingQuantityOfMarketOrder = new Decimal(quantity).sub(new Decimal(vttValueLocked1_after)).toFixed();
    assert.equal(viteValue1_after, new Decimal(initBtcAmount).add(dex.getSellerObtainAmount(price1, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getSellerObtainAmount(price2, tradingQuantityOfMarketOrder, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal ,quoteTokenDecimal)).toFixed());
    assert.equal(viteValueLocked1_after, "0");
    assert.equal(vttValue1_after, new Decimal(initVttAmount).sub(new Decimal(quantity)).sub(new Decimal(quantity)).toFixed());
    assert.equal(vttValueLocked1_after, new Decimal(initVttAmount).add(new Decimal(quantity)).add(new Decimal(quantity)).sub(new Decimal(vttValue2_after)));

    // the total value of VTT hold by user1 and user2 must be 20w
    assert.equal(new Decimal(initVttAmount).mul(2).toFixed(),
      (new Decimal(vttValue1_after).add(new Decimal(vttValueLocked1_after)).add(new Decimal(vttValue2_after)).add(new Decimal(vttValueLocked2_after)).toFixed()));

    // the total value of VITE hold by user1 and user2 + the TradingFees must be 20w
    const totalFees = dex.getSellerFee(price1, quantity, makerPlatformFeeRate, makerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal).add(dex.getBuyerFee(price1, quantity, takerPlatformFeeRate, takerBrokerFeeRate, tradeTokenDecimal, quoteTokenDecimal))
      .add(dex.getSellerFee(price2, tradingQuantityOfMarketOrder, makerPlatformFeeRate, makerBrokerFeeRate,tradeTokenDecimal ,quoteTokenDecimal)).add(dex.getBuyerFee(price2, tradingQuantityOfMarketOrder, takerPlatformFeeRate, takerBrokerFeeRate,tradeTokenDecimal ,quoteTokenDecimal)).toFixed();

    assert.equal(new Decimal(initBtcAmount).mul(2).toFixed(),
      (new Decimal(viteValue1_after).add(new Decimal(viteValueLocked1_after)).add(new Decimal(viteValue2_after)).add(new Decimal(viteValueLocked2_after)
        .add(new Decimal(totalFees))).toFixed()));

    await dex.cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });
});


