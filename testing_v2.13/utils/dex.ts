import { wallet } from "@vite/vitejs";
import * as vuilder from "@vite/vuilder";

export async function depositToFund(userFundContract: vuilder.Contract, initAmount: string, tokenId: string="tti_5649544520544f4b454e6e40") {
  await userFundContract.call("DexFundUserDeposit", [], {
    amount: initAmount,
    tokenId: tokenId,
  });
}

export async function getOrderBooks(tradeContract: vuilder.Contract, tradeTokenId: string, quoteTokenId: string) {
  return await tradeContract.call("dextrade_getMarketOrders", [tradeTokenId, quoteTokenId, '0', '10', '0', '10'], {});
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
