# automated test for gvite v2.13.0

This directory is mainly about test cases for market orders 

## run test
```bash
cd ~/vscode/go-vite-nightly/testing_v2.13
npm install
npx vuilder node --config v2.13.0/vuilder.node.config.json
python3 dex_init.py
npx vuilder test v2.13.0/version13.order.market.helper.spec.ts --noneNode true

npx vuilder test v2.13.0/version13.order.market.hotfix.spec.ts --noneNode true
npx vuilder test v2.13.0/version13.order.market.morecases.spec.ts --noneNode true
npx vuilder test v2.13.0/version13.order.market.decimal.spec.ts --noneNode true
npx vuilder test v2.13.0/version13.order.market.decimal.newmarket.spec.ts --noneNode true
# npm run test_v2.13.0
```

## reusing ledger
```bash
kill -9 ${vuilder_node}
cd node_modules/@vite/vuilder/bin
cp -R ledger ledger_dex_init
rm -rf ledger ; cp -R ledger_dex_init ledger ; ./gvite-v2.13.0-nightly-202209271223 virtual
```

## cases
### case1
