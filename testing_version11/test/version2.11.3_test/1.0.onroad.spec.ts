import { expect, assert } from "chai";
import * as vuilder from "@vite/vuilder";
import config from "../vite.config.json";
import { sleep } from "@vite/vuilder/lib/utils";
import { isOrdered } from "../utils/sorted";

let provider: any;
let deployer: vuilder.UserAccount;

// account -> contract methods
describe("test Cafe", () => {
  before(async function () {
    provider = vuilder.newProvider(config.networks.local.http);
    console.log(await provider.request("ledger_getSnapshotChainHeight"));
    deployer = vuilder.newAccount(config.networks.local.mnemonic, 0, provider);
    console.log('deployer', deployer.address);
  });

  it("test account calls contract func", async () => {
    const compiledContracts = await vuilder.compile("Cafe.solpp");
    expect(compiledContracts).to.have.property("Cafe");

    // deploy
    let cafe = compiledContracts.Cafe;
    cafe.setDeployer(deployer).setProvider(provider);
    await cafe.deploy({});
    expect(cafe.address).to.be.a("string");
    console.log(cafe.address);

    // call methods
    let resArr: Array<any> = []
    const num = 1;
    for (let i = 0; i < num; i++) {
      const res = cafe.call(
        "buyCoffee",
        ["vite_3345524abf6bbe1809449224b5972c41790b6cf2e22fcb5caf", 2],
        { amount: "2000000000000000000" }
      );
      resArr.push(res);
      await sleep(100)
    }
    

    // verify height of sendBlocks and receiveBlocks 
    let sendBlocks: Array<any> = []
    let receiveHeights: Array<number> = []
    let sendHeights: Array<number> = []

    await Promise.all(resArr).then(async receiveBlocks => {
      receiveBlocks.forEach(receiveBlock => {
        // console.log("the receiveBlock:", receiveBlock);
        receiveHeights.push(Number(receiveBlock.height));
        const block = provider.request("ledger_getAccountBlockByHash", receiveBlock.sendBlockHash);
        sendBlocks.push(block);
      });
      assert.equal(receiveHeights.length, num);
      expect(isOrdered(receiveHeights, true)).to.be.true;
      console.log("the receiveBlock`s height", receiveHeights);

      await Promise.all(sendBlocks).then(sendBlocks => {
        // console.log("the sendBlock:", sendBlocks);
        sendBlocks.forEach(sendBlock => {
          sendHeights.push(Number(sendBlock.height));
        });
        assert.equal(sendHeights.length, num);
        expect(isOrdered(sendHeights, true)).to.be.true;
        console.log("the sendBlock`s height", sendHeights);
      });
    });
  });
});

