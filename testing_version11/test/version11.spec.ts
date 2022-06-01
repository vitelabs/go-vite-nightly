// import { describe } from "mocha";
import { expect, assert } from "chai";
import * as vuilder from "@vite/vuilder";
import config from "./vite.config.json";
import fundAbi from "./abi/fund.abi.json"

let provider: any;
let deployer: vuilder.UserAccount;
let fundContract: vuilder.Contract;

const fundContractAddress = "vite_0000000000000000000000000000000000000006e82b8ba657"
const transferAmount = "1000000000000000000"
const viteToken = "tti_5649544520544f4b454e6e40"

describe("test version11 upgrade", () => {
  before(async function () {
    provider = vuilder.newProvider(config.networks.local.http);
    console.log(await provider.request("ledger_getSnapshotChainHeight"));
    deployer = vuilder.newAccount(config.networks.local.mnemonic, 0, provider);
    console.log("deployer", deployer.address);
    fundContract = new vuilder.Contract("FundContract", "", fundAbi);
    fundContract.attach(fundContractAddress);
    fundContract.setDeployer(deployer);
    fundContract.setProvider(provider);

    console.log("the deployer addr", deployer.address);
  });

  beforeEach(async function () {
    await fundContract.call("DexFundUserDeposit", [], {
      amount: "2000000000000000000"
    });
  });

  it("test Fund/Transfer ", async () => {
    // const dd = await provider.request("virtual_mineBatch", 10);
    // before upgrade
    const addr = "vite_3345524abf6bbe1809449224b5972c41790b6cf2e22fcb5caf"

    await provider.request("virtual_addUpgrade", 11, 1000000);
    try {
      await fundContract.call(
        "Transfer",
        [addr, viteToken, transferAmount],
        { amount: "0" }
      );
      assert.fail("fail message")
    } catch (err) {
      expect((err as Error).message).to.be.equal("send block fail")
    }

    // after upgrade
    await provider.request("virtual_addUpgrade", 11, 1);
    await fundContract.call(
      "Transfer",
      [addr, viteToken, transferAmount],
      { amount: "0" }
    );

    const agentBalance = await provider.request("dexfund_getAccountFundInfo", addr, viteToken)
    const viteValue = agentBalance[viteToken].available;
    assert.equal(viteValue, transferAmount);
  });

  it("test Fund/AgentDeposit", async () => {
    const addr = "vite_c2059155ab061f096426e28238c8cc25cd7349b54351fabbc8"
    await provider.request("virtual_addUpgrade", 11, 1000000);
    try {
      await fundContract.call(
        "AgentDeposit",
        [addr],
        {
          amount: transferAmount,
          tokenId: viteToken
        }
      );
      assert.fail("fail message")
    } catch (err) {
      expect((err as Error).message).to.be.equal("send block fail")
    }


    await provider.request("virtual_addUpgrade", 11, 1);
    // before AgentDeposit
    await fundContract.call(
      "AgentDeposit",
      [addr],
      {
        amount: transferAmount,
        tokenId: viteToken
      }
    );

    // after AgentDeposit
    // console.log("getAccountFundInfo", await provider.request("dexfund_getAccountFundInfo", "vite_3345524abf6bbe1809449224b5972c41790b6cf2e22fcb5caf", "tti_5649544520544f4b454e6e40"));
    const agentBalance = await provider.request("dexfund_getAccountFundInfo", addr, viteToken)
    const viteValue = agentBalance[viteToken].available;
    assert.equal(viteValue, transferAmount);
  });

  it("test Fund/AssignedWithdraw", async () => {
    const addr = "vite_788ba2eb05dca52fc83c0251f607958748b29ea2df68e6323b"
    let label = "hello world";
    const labelHex = Buffer.from(label, 'binary').toString('hex');
    await provider.request("virtual_addUpgrade", 11, 1000000);
    try {
      await fundContract.call(
        "AssignedWithdraw",
        [addr, viteToken, transferAmount, labelHex],
        { amount: "0" }
      );
      assert.fail("fail message")
    } catch (err) {
      expect((err as Error).message).to.be.equal("send block fail")
    }

    // before AssignedWithdraw
    await provider.request("virtual_addUpgrade", 11, 1);
    // console.log("getAccountFundInfo-before", await provider.request("dexfund_getAccountFundInfo", "vite_61214664a1081e286152011570993a701735f5c2c12198ce63", "tti_5649544520544f4b454e6e40"));
    const deployerBalance = await provider.request("dexfund_getAccountFundInfo", "vite_61214664a1081e286152011570993a701735f5c2c12198ce63", "tti_5649544520544f4b454e6e40")
    const deployerViteValue = deployerBalance[viteToken].available;

    const block = await fundContract.call(
      "AssignedWithdraw",
      [addr, viteToken, transferAmount, labelHex],
      { amount: "0" }
    );

    // console.log("the sendBlockList", block);
    const labelFromBlock = Buffer.from(block.sendBlockList[0].data, 'base64').toString();
    assert.equal(labelFromBlock, label);

    // // after AssignedWithdraw
    // console.log("getAccountFundInfo-after", await provider.request("dexfund_getAccountFundInfo", "vite_61214664a1081e286152011570993a701735f5c2c12198ce63", "tti_5649544520544f4b454e6e40"));
    const deployerBalanceAfter = await provider.request("dexfund_getAccountFundInfo", "vite_61214664a1081e286152011570993a701735f5c2c12198ce63", "tti_5649544520544f4b454e6e40")
    const deployerViteValueAfter = deployerBalanceAfter[viteToken].available;
    assert.equal((deployerViteValue - deployerViteValueAfter).toString(), transferAmount);
  });

  it("test Fund/Deposit Event", async () => {
    await provider.request("virtual_addUpgrade", 11, 1000000);
    const block = await fundContract.call(
      "Deposit",
      [],
      {
        amount: transferAmount,
        tokenId: viteToken
      }
    );
    // console.log("the block", block);
    assert.isNull(block.vmLogHash);

    await provider.request("virtual_addUpgrade", 11, 1);

    const blockUpgrade = await fundContract.call(
      "Deposit",
      [],
      {
        amount: transferAmount,
        tokenId: viteToken
      }
    );

    // console.log("the blockUpgrade", blockUpgrade);
    assert.isNotNull(blockUpgrade.vmLogHash);
  });
});