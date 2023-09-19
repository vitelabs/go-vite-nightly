# automated test for gvite v2.13.0

This directory is mainly about test cases for market orders 

## run test
```bash
cd ~/vscode/go-vite-nightly/testing_v2.14
npm install
npx vuilder node --config v2.14.0/vuilder.node.config.json
python3 dex_init.py # init 
npx vuilder test v2.14.0/version14.order.market.helper.spec.ts --noneNode true # issue token & open new tradepair

# reusing ledger
kill -9 ${vuilder_node}
cd node_modules/@vite/vuilder/bin 
cp -R ledger ledger_dex_init
rm -rf ledger ; cp -R ledger_dex_init ledger ; ./gvite-v2.13.0-nightly-${version} virtual

##  cases

### cancel staking for Quota at any time
#### case1 

### the staked VITE be returned after 7 days
#### case1 