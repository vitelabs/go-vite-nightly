// import { describe } from "mocha";
import { expect, assert } from "chai";
import * as vuilder from "@vite/vuilder";
import config from "../vite.config.json";
import fundAbi from "../abi/fund.abi.json"

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
    const addr = "vite_8afc8f2de32fe48c740a092f15a6e705e46f78e27bcef970c5"
    // case1: transfer amount is more than sender`s balance
    // TODO: wallet balance or exchange balannce?
    let customTransferAmount = "100000000000000000000000000001"
    let customToken = "tti_c90c146c059b821527f40b99"
    let customAddr = "vite_0000000000000000000000000000000000000003f6af7459b9"
    await provider.request("virtual_addUpgrade", 11, 1);

    try {
      await fundContract.call(
        "Transfer",
        [addr, viteToken, customTransferAmount],
        { amount: "0" }
      );
      assert.fail("fail message")
    } catch (err) {
      expect((err as Error).message).to.be.equal("revert, methodName: Transfer")
    }

    // case2: transfer token is not exist
    customTransferAmount = "100"
    try {
      await fundContract.call(
        "Transfer",
        [addr, customToken, customTransferAmount],
        { amount: "0" }
      );
      assert.fail("fail message")
    } catch (err) {
      expect((err as Error).message).to.be.equal("revert, methodName: Transfer")
    }

    // case3: transfer address is contract address
    await fundContract.call(
      "Transfer",
      [customAddr, viteToken, customTransferAmount],
      { amount: "0" }
    );

    // case4: transfer address is illegal
    customAddr = "vite_3345524abf6bbe1809449224b5972c41790b6cf2e22fcb5caa"
    try {
      await fundContract.call(
        "Transfer",
        [customAddr, viteToken, customTransferAmount],
        { amount: "0" }
      );
      assert.fail("fail message")
    } catch (err) {
      expect((err as Error).message).to.be.equal("Illegal address.")
    }

  });

  it("test Fund/AgentDeposit", async () => {
    const addr = "vite_c2059155ab061f096426e28238c8cc25cd7349b54351fabbc8"
    // case1: deposit amount is more than sender`s balance
    let customDepositAmount = "100000000000000000000000000001"
    let customToken = "tti_c90c146c059b821527f40b99"
    await provider.request("virtual_addUpgrade", 11, 1);
    try {
      await fundContract.call(
        "AgentDeposit",
        [addr],
        {
          amount: customDepositAmount,
          tokenId: viteToken
        }
      );
      assert.fail("fail message")
    } catch (err) {
      expect((err as Error).message).to.be.equal("send block fail")
    }

    // case2: deposit token is not exist
    customDepositAmount = "100"
    try {
      await fundContract.call(
        "AgentDeposit",
        [addr],
        {
          amount: customDepositAmount,
          tokenId: customToken
        }
      );
      assert.fail("fail message")
    } catch (err) {
      expect((err as Error).message).to.be.equal("send block fail")
    }

    // case3: deposit address is contract address
    let customAddr = "vite_0000000000000000000000000000000000000003f6af7459b9"
    await fundContract.call(
      "AgentDeposit",
      [customAddr],
      {
        amount: customDepositAmount,
        tokenId: viteToken
      }
    );

    // case4: deposit address is illegal
    customAddr = "vite_3345524abf6bbe1809449224b5972c41790b6cf2e22fcb5caa"
    try {
      await fundContract.call(
        "AgentDeposit",
        [customAddr],
        {
          amount: customDepositAmount,
          tokenId: viteToken
        }
      );
      assert.fail("fail message")
    } catch (err) {
      expect((err as Error).message).to.be.equal("Illegal address.")
    }
  });

  it("test Fund/AssignedWithdraw", async () => {
    const addr = "vite_788ba2eb05dca52fc83c0251f607958748b29ea2df68e6323b"
    let customToken = "tti_c90c146c059b821527f40b99"
    let label = "hello world";
    const labelHex = Buffer.from(label, 'binary').toString('hex');

    await provider.request("virtual_addUpgrade", 11, 1);
    // case1: withdraw amount is more than sender`s balance
    let customWithdrawAmount = "100000000000000000000000000001"
    try {
      const block = await fundContract.call(
        "AssignedWithdraw",
        [addr, viteToken, customWithdrawAmount, labelHex],
        { amount: "0" }
      );
      assert.fail("fail message")
    } catch (err) {
      expect((err as Error).message).to.be.equal("revert, methodName: AssignedWithdraw")
    }

    // // case2: withdraw token is not exist
    customWithdrawAmount = "10000"
    try {
      const block = await fundContract.call(
        "AssignedWithdraw",
        [addr, customToken, customWithdrawAmount, labelHex],
        { amount: "0" }
      );
      assert.fail("fail message")
    } catch (err) {
      expect((err as Error).message).to.be.equal("revert, methodName: AssignedWithdraw")
    }

    // case3: withdraw address is contract address
    // Fatal: test case not passed that can cause the node shutdown!
    let customAddr = "vite_e94c882e6d3905ac212440b47bcdfdd1d2730610c11213d067"
    // const block = await fundContract.call(
    //   "AssignedWithdraw",
    //   [customAddr, viteToken, customWithdrawAmount, labelHex],
    //   { amount: "0" }
    // );

    // case4: deposit address is illegal
    customAddr = "vite_3345524abf6bbe1809449224b5972c41790b6cf2e22fcb5caa"
    try {
      const block = await fundContract.call(
        "AssignedWithdraw",
        [customAddr, viteToken, customWithdrawAmount, labelHex],
        { amount: "0" }
      );
      assert.fail("fail message")
    } catch (err) {
      expect((err as Error).message).to.be.equal("Illegal address.")
    }
  });
});