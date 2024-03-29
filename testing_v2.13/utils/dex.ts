import { assert } from "chai";
import { wallet } from "@vite/vitejs";
import * as vuilder from "@vite/vuilder";
import Big from 'big.js';

export async function depositToFund(userFundContract: vuilder.Contract, initAmount: string, tokenId: string = "tti_5649544520544f4b454e6e40") {
  await userFundContract.call("DexFundUserDeposit", [], {
    amount: initAmount,
    tokenId: tokenId,
  });
}

export async function openNewMarket(fundContract: vuilder.Contract, tradeTokenId: string, quoteTokenId: string) {
  await fundContract.call("OpenNewMarket", [tradeTokenId, quoteTokenId], {
    amount: "10000000000000000000000",
  });
}

export async function marketAdminConfig(
  fundContract: vuilder.Contract, 
  operationCode: number,
  tradeTokenId: string,
  quoteTokenId: string,
  marketOwner: string,
  takerFeeRate: number,
  makerFeeRate: number) {

  await fundContract.call("MarketAdminConfig", [operationCode, tradeTokenId, quoteTokenId, marketOwner, takerFeeRate, makerFeeRate, 0], {
    amount: "0",
  });
}

export async function tradeAdminConfig(
  fundContract: vuilder.Contract, 
  operationCode: number,
  tradeTokenId: string,
  quoteTokenId: string,
  allowMining: boolean,
  newQuoteToken: string,
  quoteTokenType: number,
  tokenTypeForTradeThreshold: number,
  minTradeThreshold: number,
  tokenTypeForMiningThreshold: number,
  minMiningThreshold: number) {
  await fundContract.call("TradeAdminConfig", [operationCode, tradeTokenId, quoteTokenId, allowMining, newQuoteToken, quoteTokenType, tokenTypeForTradeThreshold, minTradeThreshold, tokenTypeForMiningThreshold, minMiningThreshold], {
    amount: "0",
  });
}

export async function getOrderBooks(provider: any, tradeTokenId: string, quoteTokenId: string) {
  const marketOrderParam = {
    'TradeToken': tradeTokenId,
    'QuoteToken': quoteTokenId,
    'SellBegin': 0,
    'SellEnd': 100,
    'BuyBegin': 0,
    'BuyEnd': 100
  };

  return await provider.request("dextrade_getMarketOrders", marketOrderParam);
}

export async function placeOrder(userFundContract: vuilder.Contract, tradeToken: string, quoteToken: string, side: boolean, orderType: number, price: string, quantity: string) {
  await userFundContract.call(
    "PlaceOrder",
    [
      tradeToken,
      quoteToken,
      side,
      orderType,
      price,
      quantity,
    ],
    { amount: "0" }
  );
}

export async function cancelOrder(tradeContract: vuilder.Contract, orderId: string) {
  await tradeContract.call(
    "CancelOrder",
    [
      orderId,
    ],
    { amount: "0" }
  );
}

export async function getFundBalanceByAddrAndTokenId(provider: any, userAddress: string, tokenId: string) {
  return await provider.request(
    "dexfund_getAccountFundInfo",
    userAddress, tokenId
  );
}

export async function cancelAllOrders(
  provider: any,
  tradeToken: string,
  quoteToken: string,
  user1Address: string,
  user1TradeContract: vuilder.Contract,
  user2TradeContract: vuilder.Contract) {

  let orderBook = await getOrderBooks(provider, tradeToken, quoteToken);
  if (orderBook.orders === undefined) {
    console.log("no orders in the market, no need to cancel");
    return;
  }

  for (let i = 0; i < orderBook.orders.length; i++) {
    if (orderBook.orders[i].Address === user1Address) {
      await cancelOrder(user1TradeContract, orderBook.orders[i].Id);
    } else {
      await cancelOrder(user2TradeContract, orderBook.orders[i].Id);
    }
    console.log(`the order ${orderBook.orders[i].Id} is canceled by addr ${orderBook.orders[i].Address}`);
  }

  orderBook = await getOrderBooks(provider, tradeToken, quoteToken);
  assert.equal(orderBook.orders, undefined);
}

export function getBuyerCostAmount(
  price: string, 
  quantity: string, 
  takerPlatformFeeRate: number,
  takerBrokerFeeRate: number,
  tradeTokenDecimal: number, 
  quoteTokenDecimal: number): Big {
  
  if(tradeTokenDecimal == quoteTokenDecimal) {
    return new Big(price).mul(new Big(quantity)).mul(new Big(1 + (takerPlatformFeeRate + takerBrokerFeeRate))).round();
  } 

  return new Big(price).mul(new Big(quantity)).mul(new Big(1 + (takerPlatformFeeRate + takerBrokerFeeRate))).mul(new Big(Math.pow(10, quoteTokenDecimal - tradeTokenDecimal))).round();
}

export function getBuyerFee(
  price: string, 
  quantity: string, 
  takerPlatformFeeRate: number,
  takerBrokerFeeRate: number,
  tradeTokenDecimal: number, 
  quoteTokenDecimal: number): Big {

  if(tradeTokenDecimal == quoteTokenDecimal){
    return new Big(price).mul(new Big(quantity)).mul(new Big(takerPlatformFeeRate + takerBrokerFeeRate)).round();
  } 

  return new Big(price).mul(new Big(quantity)).mul(new Big(takerPlatformFeeRate + takerBrokerFeeRate)).mul(new Big(Math.pow(10, quoteTokenDecimal- tradeTokenDecimal))).round();
}

export function getSellerObtainAmount(
  price: string, 
  quantity: string,
  makerPlatformFeeRate: number,
  makerBrokerFeefeeRate: number,
  tradeTokenDecimal: number, 
  quoteTokenDecimal: number): Big {

  if (tradeTokenDecimal == quoteTokenDecimal) {
    return new Big(price).mul(new Big(quantity)).mul(new Big(1 - (makerPlatformFeeRate + makerBrokerFeefeeRate))).round();
  } 

  return new Big(price).mul(new Big(quantity)).mul(new Big(1 - (makerPlatformFeeRate + makerBrokerFeefeeRate))).mul(new Big(Math.pow(10, quoteTokenDecimal - tradeTokenDecimal))).round();
}

export function getSellerFee(
  price: string, 
  quantity: string, 
  makerPlatformFeeRate: number,
  makerBrokerFeefeeRate: number,
  tradeTokenDecimal: number, 
  quoteTokenDecimal: number): Big {

  if(tradeTokenDecimal == quoteTokenDecimal) {
    return new Big(price).mul(new Big(quantity)).mul(new Big(makerPlatformFeeRate + makerBrokerFeefeeRate)).round();
  } 

  return  new Big(price).mul(new Big(quantity)).mul(new Big(makerPlatformFeeRate + makerBrokerFeefeeRate)).mul(new Big(Math.pow(10, quoteTokenDecimal- tradeTokenDecimal))).round();
}

export async function burn(assetContract: vuilder.Contract, tokenId: string, burnAmount: string) {
  await assetContract.call("Burn", [], {
    tokenId: tokenId,
    amount: burnAmount,
  });
}

export async function switchConfig(
  fundContract: vuilder.Contract, 
  switchType: number,
  enable: boolean) {

  await fundContract.call("SwitchConfig", [switchType, enable], {
    amount: "0",
  });
}