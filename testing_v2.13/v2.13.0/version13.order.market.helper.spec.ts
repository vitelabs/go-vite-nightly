// import { describe } from "mocha";
import { expect, assert } from "chai";
import * as vuilder from "@vite/vuilder";
import fundAbi from "../abi/fund.abi.json";
import * as dex from "../utils/dex";

let provider: any;
let deployer: vuilder.UserAccount;
let fundContract: vuilder.Contract;

const fundContractAddress =
  "vite_0000000000000000000000000000000000000006e82b8ba657";

const tradeToken = "tti_b409b0a83380a8c3f28fe05c"; // WOW
const quoteToken = "tti_5649544520544f4b454e6e40"; // VITE
const initialBalance = "100000000000000000000000"  // 10w


describe("test version13 upgrade", () => {
  before(async function () {
    provider = vuilder.newProvider(vuilder.defaultViteNetwork.http);
    console.log(await provider.request("ledger_getSnapshotChainHeight"));
    deployer = vuilder.newAccount(vuilder.defaultViteNetwork.mnemonic, 0, provider);

    fundContract = new vuilder.Contract("FundContract", "", fundAbi);
    fundContract.attach(fundContractAddress);
    fundContract.setDeployer(deployer);
    fundContract.setProvider(provider);
  });

  beforeEach(async function () {
    await fundContract.call("DexFundUserDeposit", [], {
      amount: initialBalance  // 100000
    });
  });

  it("test AssetContract - Issue New Token ", async () => {
    // need 1000 VITE as fee in the wallet balance
    const block = await deployer.issueToken({ tokenName: "WOWToken", tokenSymbol: "WOW", decimals: '6', maxSupply: '0', totalSupply: '1000000000000', isReIssuable: false, isOwnerBurnOnly: false });
    await block.autoSend();
    await sleep(1000);
    // receive totalSupply
    await deployer.receiveAll();
    console.log("issue new token succeed!");
  });

  it("test FundContract - Open tradePairs ", async () => {
    // need 10000 VITE in the dex balance 
    await dex.openNewMarket(fundContract, tradeToken, quoteToken);
    console.log("open new tradepair succeed!");

    await sleep(2000);
    // set takerBrokerFeeRate
    await dex.marketAdminConfig(fundContract, 2, tradeToken, quoteToken, "vite_61214664a1081e286152011570993a701735f5c2c12198ce63", 0, 0);
    // set makerBrokerFeeRate
    await dex.marketAdminConfig(fundContract, 4, tradeToken, quoteToken, "vite_61214664a1081e286152011570993a701735f5c2c12198ce63", 0, 0);
  });

  function sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
});



