// import { describe } from "mocha";
import { expect, assert } from "chai";
import * as vuilder from "@vite/vuilder";
import fundAbi from "../abi/fund.abi.json";
import Big from 'big.js';
import assetAbi from "../abi/asset.abi.json";
import * as dex from "../utils/dex";

let provider: any;
let deployer: vuilder.UserAccount;
let fundContract: vuilder.Contract;
let assetContract: vuilder.Contract;

const fundContractAddress =
  "vite_0000000000000000000000000000000000000006e82b8ba657";
const assetContractAddress =
  "vite_000000000000000000000000000000000000000595292d996d";
const VXToken = "tti_564954455820434f494e69b5"
const VxTotalSupply = "100000000"
const proportionTrading = 0.5
const proportionStaking = 0.1
const proportionMarketMaking = 0.15
const proportionMaintainer = 0.25

describe("test version13 upgrade", () => {
  before(async function () {
    provider = vuilder.newProvider(vuilder.defaultViteNetwork.http);
    console.log(await provider.request("ledger_getSnapshotChainHeight"));
    deployer = vuilder.newAccount(vuilder.defaultViteNetwork.mnemonic, 0, provider);
    console.log("the deployer addr", deployer.address);

    fundContract = new vuilder.Contract("FundContract", "", fundAbi);
    fundContract.attach(fundContractAddress);
    fundContract.setDeployer(deployer);
    fundContract.setProvider(provider);

    assetContract = new vuilder.Contract("AssetContract", "", assetAbi);
    assetContract.attach(assetContractAddress);
    assetContract.setDeployer(deployer);
    assetContract.setProvider(deployer._provider);
  });

  beforeEach(async function () {
    // assert VX token totalSupply
    const res = await provider.request("contract_getTokenInfoList", 0, 100);
    for (let i = 0; i < res.tokenInfoList.length; i++) {
      if(res.tokenInfoList[i]["tokenId"] == "tti_564954455820434f494e69b5"){
        assert(res.tokenInfoList[i]["totalSupply"], VxTotalSupply)
      }
    }

    const isNormalMiningStarted = await provider.request("dex_isNormalMiningStarted");
    assert.equal(isNormalMiningStarted, true)

    // firstMiningPeriodId is 1 while mainnet is 199, it`s the cycleKey when normal mine started
    const firstMiningPeriodId = await provider.request("dex_getFirstMiningPeriodId");
    console.log("firstMiningPeriodId", firstMiningPeriodId)
    assert(firstMiningPeriodId, "1")
  });


  it("test VX release - change VX proportion", async () => {
    const miningInfo = await provider.request("dex_getMiningInfo", 1099);
    var total = miningInfo["total"]

    assert.equal(total, "7372734213066479626928")
    assert(new Big(total).mul(new Big(proportionTrading).toFixed()), "3686367106533239813464")
    assert(new Big(total).mul(new Big(proportionStaking).toFixed()), "737273421306647962693")
    assert(new Big(total).mul(new Big(proportionMarketMaking).toFixed()), "1105910131959971944038")
  });


  it("test VX release - mineVx for maintainer", async () => {
    const miningInfo = await provider.request("dex_getMiningInfo", 1);
    var total = miningInfo["total"]
    assert(total, "10000000000000000000000")
    assert(new Big(total).mul(new Big(proportionMaintainer).toFixed()), "2500000000000000000000")

    const dexConfig = await provider.request("dex_getDexConfig");
    var maintainer = dexConfig["maintainer"]
    console.log("maintainer:", maintainer)

    // lock vx of maintainer
    // dex.switchConfig(fundContract, 1, true)
    const vxBalance = await dex.getFundBalanceByAddrAndTokenId(provider, maintainer, VXToken);
    console.log("vx available:", vxBalance[VXToken]["available"])
    assert(vxBalance[VXToken]["available"], new Big(total).mul(new Big(proportionMaintainer)).toFixed())
    assert(vxBalance[VXToken]["locked"], "0")
  });
});



