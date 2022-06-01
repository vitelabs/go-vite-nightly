// import { describe } from "mocha";
import { expect,assert } from "chai";
import * as vuilder from "@vite/vuilder";
import config from "./vite.config.json";
import fundAbi from "./abi/fund.abi.json"

let provider: any;
let deployer: vuilder.UserAccount;
let fundContract: vuilder.Contract;

const fundContractAddress = "vite_0000000000000000000000000000000000000006e82b8ba657"

describe("test version11 upgrade", () => {
  before(async function() {
    provider = vuilder.newProvider(config.networks.local.http);
    console.log(await provider.request("ledger_getSnapshotChainHeight"));
    deployer = vuilder.newAccount(config.networks.local.mnemonic, 0, provider);
    console.log("deployer", deployer.address);
    fundContract = new vuilder.Contract("FundContract", "", fundAbi);
    fundContract.attach(fundContractAddress);
    fundContract.setDeployer(deployer);
    fundContract.setProvider(provider);



    await fundContract.call("DexFundUserDeposit", [],{
      amount:"2000000000000000000"
    });

  });

  it("test Fund/Transfer ", async () => {
    // call Cafe.buyCoffee(to, numOfCups);
    // const dd = await provider.request("virtual_mineBatch", 10);

    await provider.request("virtual_addUpgrade", 11, 1000000);
    try{
      await fundContract.call(
        "Transfer",
        ["vite_3345524abf6bbe1809449224b5972c41790b6cf2e22fcb5caf", "tti_5649544520544f4b454e6e40", "1000000000000000000"],
        { amount: "0" }
      );
      assert.fail("fail message")
    }catch(err){
      expect((err as Error).message).to.be.equal("send block fail")
    }

    await provider.request("virtual_addUpgrade", 11, 1);
    await fundContract.call(
        "Transfer",
        ["vite_3345524abf6bbe1809449224b5972c41790b6cf2e22fcb5caf", "tti_5649544520544f4b454e6e40", "1000000000000000000"],
        { amount: "0" }
      );
   
   

    // console.log(block);
    // const events = await fundContract.getPastEvents("Buy", {
    //   fromHeight: block.height,
    //   toHeight: block.height,
    // });
    // console.log(events);
    // expect(events.map((event: any) => event.returnValues)).to.be.deep.equal([
    //   {
    //     "0": "vite_61214664a1081e286152011570993a701735f5c2c12198ce63",
    //     "1": "vite_3345524abf6bbe1809449224b5972c41790b6cf2e22fcb5caf",
    //     "2": "2",
    //     from: "vite_61214664a1081e286152011570993a701735f5c2c12198ce63",
    //     to: "vite_3345524abf6bbe1809449224b5972c41790b6cf2e22fcb5caf",
    //     num: "2",
    //   },
    // ]);
  });
});