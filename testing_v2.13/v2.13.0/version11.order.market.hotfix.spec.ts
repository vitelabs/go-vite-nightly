// import { describe } from "mocha";
import { expect, assert } from "chai";
import * as vuilder from "@vite/vuilder";
import config from "../vite.config.json";
import fundAbi from "../abi/fund.abi.json";
import tradeAbi from "../abi/trade.abi.json";
import { contractWithUser, initValue, randomUser } from "../utils/user";
import { depositToFund, getOrderBooks, placeOrder, cancelAllOrders, getFundBalanceByAddrAndTokenId} from "../utils/dex";

let provider: any;
let deployer: vuilder.UserAccount;
let tradeContract: vuilder.Contract;

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

describe("test version11 upgrade", () => {
  before(async function () {
    provider = vuilder.newProvider(config.networks.local.http);
    console.log(await provider.request("ledger_getSnapshotChainHeight"));
    deployer = vuilder.newAccount(config.networks.local.mnemonic, 0, provider);

    tradeContract = new vuilder.Contract("TradeContract", "", tradeAbi);
    tradeContract.attach(tradeContractAddress);
    tradeContract.setDeployer(deployer);
    tradeContract.setProvider(provider);
  });

  beforeEach(async function () {
    let orderBook = await getOrderBooks(provider, tradeToken, quoteToken);
    assert.equal(orderBook.orders, undefined); // no orders in the beginning
    // assert.equal(0, orderBook.orders.length);
  });

  it("test Fund/placeOrder orderType - Market ", async () => {
    const initViteAmount = "1000000000000000000000"; // 1000 VITE
    const initVttAmount = "1000000000000000000000";  // 1000 VTT

    const user1 = randomUser(provider);
    const user2 = randomUser(provider);
    console.log(`random user1 ${user1.address}`)
    console.log(`random user2 ${user2.address}`)
    const user1FundContract = contractWithUser(user1, fundAbi, fundContractAddress);
    const user2FundContract = contractWithUser(user2, fundAbi, fundContractAddress);
    const user1TradeContract = contractWithUser(user1,tradeAbi, tradeContractAddress);
    const user2TradeContract = contractWithUser(user2, tradeAbi, tradeContractAddress);

    await initValue(deployer, user1, initVttAmount, tradeToken);
    await initValue(deployer, user2, initViteAmount);

    await depositToFund(user2FundContract, initViteAmount);
    await depositToFund(user1FundContract, initVttAmount, tradeToken);
    
    // case1. place Market order while there are no orders in orderbook(predict:cancel)
    await placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, "30", "50000000000000000000"); // sell 50 VTT
    await placeOrder(user1FundContract, tradeToken, quoteToken, sideSell, orderLimit, "40", "50000000000000000000"); // sell 50 VTT
    await placeOrder(user2FundContract, tradeToken, quoteToken, sideBuy, orderMarket, "8", "90000000000000000000");  // buy 90 VTT
    
    const user1Address = user1.address;
    const user2Address = user2.address;
    const quoteBalanceUser1 = await getFundBalanceByAddrAndTokenId(provider, user1Address, quoteToken);
    const tradeBalanceUser1 = await getFundBalanceByAddrAndTokenId(provider, user1Address, tradeToken);
    const quoteBalanceUser2 = await getFundBalanceByAddrAndTokenId(provider, user2Address, quoteToken);
    const tradeBalanceUser2 = await getFundBalanceByAddrAndTokenId(provider, user2Address, tradeToken);
    
    console.log(quoteBalanceUser1, tradeBalanceUser1);
    console.log(quoteBalanceUser2, tradeBalanceUser2);

    await cancelAllOrders(provider, tradeToken, quoteToken, user1Address, user1TradeContract, user2TradeContract);
  });
});


