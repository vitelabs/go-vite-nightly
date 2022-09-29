import { assert } from "chai";
import { wallet } from "@vite/vitejs";
import * as vuilder from "@vite/vuilder";

export async function depositToFund(userFundContract: vuilder.Contract, initAmount: string, tokenId: string="tti_5649544520544f4b454e6e40") {
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
