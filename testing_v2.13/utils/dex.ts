import { assert } from "chai";
import { wallet } from "@vite/vitejs";
import * as vuilder from "@vite/vuilder";
import Decimal from 'decimal.js';

export async function depositToFund(userFundContract: vuilder.Contract, initAmount: string, tokenId: string = "tti_5649544520544f4b454e6e40") {
  await userFundContract.call("DexFundUserDeposit", [], {
    amount: initAmount,
    tokenId: tokenId,
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
    console.log("no orders in the market, don`t need to cancel");
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

export function getBuyerCostAmount(price: string, quantity: string, takerPlatformFeeRate: number, takerBrokerFeeRate: number): Decimal {
  let totalAmount: Decimal;
  totalAmount = new Decimal(price).mul(new Decimal(quantity)).mul(new Decimal(1 + (takerPlatformFeeRate + takerBrokerFeeRate)));

  return totalAmount;
}

export function getBuyerFee(price: string, quantity: string, takerPlatformFeeRate: number, takerBrokerFeeRate: number): Decimal {
  let totalFee: Decimal;
  totalFee = new Decimal(price).mul(new Decimal(quantity)).mul(new Decimal(takerPlatformFeeRate + takerBrokerFeeRate));

  return totalFee;
}

export function getSellerObtainAmount(price: string, quantity: string, makerPlatformFeeRate: number, makerBrokerFeefeeRate: number): Decimal {
  let totalAmount: Decimal;
  totalAmount = new Decimal(price).mul(new Decimal(quantity)).mul(new Decimal(1 - (makerPlatformFeeRate + makerBrokerFeefeeRate)));

  return totalAmount;
}

export function getSellerFee(price: string, quantity: string, makerPlatformFeeRate: number, makerBrokerFeefeeRate: number): Decimal {
  let totalFee: Decimal;
  totalFee = new Decimal(price).mul(new Decimal(quantity)).mul(new Decimal(makerPlatformFeeRate + makerBrokerFeefeeRate));

  return totalFee;
}
