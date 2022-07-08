import { expect } from "chai";
import * as vuilder from "@vite/vuilder";
import config from "../vite.config.json";
import { sleep } from "@vite/vuilder/lib/utils";

let provider: any;
let deployer: vuilder.UserAccount;

// contract -> contract methods
describe("test onroad", () => {
  before(async function () {
    provider = vuilder.newProvider(config.networks.local.http);
    console.log(await provider.request("ledger_getSnapshotChainHeight"));
    deployer = vuilder.newAccount(config.networks.local.mnemonic, 0, provider);
    console.log('deployer', deployer.address);
  });

  it("test account calls contract func", async () => {
    const compiledContracts = await vuilder.compile("SyncCall.solpp");
    expect(compiledContracts).to.have.property("A");
    expect(compiledContracts).to.have.property("B");

    // deploy A
    let a = compiledContracts.A;
    a.setDeployer(deployer).setProvider(provider);
    await a.deploy({});
    expect(a.address).to.be.a("string");
    console.log("addressA:", a.address);

    // deploy B
    let b = compiledContracts.B;
    b.setDeployer(deployer).setProvider(provider);
    await b.deploy({ tokenId: 'tti_5649544520544f4b454e6e40', amount: '10000000000000000000', params: [a.address] });
    expect(b.address).to.be.a("string");
    console.log("addressB:", b.address);

    // call methods
    let resArr: Array<any> = []
    const num = 5;
    for (let i = 0; i < num; i++) {
      const res = b.call('test', ['123456'], {});
      resArr.push(res);
      await sleep(200)
    }

    // verify height of sendBlocks and receiveBlocks 
    let sendBlocks: Array<any> = []
    let receiveHeights: Array<number> = []
    let sendHeights: Array<number> = []
    let triggerSendBlockList: Array<any> = []
    let triggerSendBlockHeights: Array<number> = []
    let triggerReceiveBlockHashs: Array<string> = []
    let triggerReceiveBlocks: Array<any> = []
    let triggerReceiveBlockHeights: Array<any> = []

    Promise.all(resArr).then(receiveBlocks => {
      receiveBlocks.forEach(receiveBlock => {
        // console.log("the receiveBlock:", receiveBlock);
        receiveHeights.push(receiveBlock.height);

        for (let i = 0, len = receiveBlock.sendBlockList.length; i < len; i++) {
          triggerSendBlockList.push(receiveBlock.sendBlockList[i]);
        }

        const block = provider.request("ledger_getAccountBlockByHash", receiveBlock.sendBlockHash);
        sendBlocks.push(block);
      });
      console.log("the receiveBlock`s height", receiveHeights);

      Promise.all(sendBlocks).then(sendBlocks => {
        // console.log("the sendBlock:", sendBlocks);
        sendBlocks.forEach(sendBlock => {
          sendHeights.push(sendBlock.height);
        });
        console.log("the sendBlock`s height", sendHeights);
      });

      // console.log("the triggerSendBlocks:", triggerSendBlockList);
      triggerSendBlockList.forEach(triggerSendBlock => {
        // console.log("the triggerSendBlockList", a);
        triggerSendBlockHeights.push(triggerSendBlock.height);
        triggerReceiveBlockHashs.push(triggerSendBlock.receiveBlockHash);
      });
      console.log("the triggerSendBlockHeights:", triggerSendBlockHeights);

      triggerReceiveBlockHashs.forEach(triggerReceiveBlockHash => {
        const b = provider.request("ledger_getAccountBlockByHash", triggerReceiveBlockHash);
        triggerReceiveBlocks.push(b);
      });

      Promise.all(triggerReceiveBlocks).then(receiveBlocks => {
        // console.log("the triggerReceiveBlocks:", receiveBlocks);
        receiveBlocks.forEach(r => {
          triggerReceiveBlockHeights.push(r.height);
        });
        console.log("the triggerReceiveBlockHeights", triggerReceiveBlockHeights);
      });
    });
  });
});
