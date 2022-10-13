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
npx vuilder test v2.13.0/version13.order.limit.ordertype.spec.ts --noneNode true
# npm run test_v2.13.0
```

## reusing ledger
```bash
kill -9 ${vuilder_node}
cd node_modules/@vite/vuilder/bin
cp -R ledger ledger_dex_init
rm -rf ledger ; cp -R ledger_dex_init ledger ; ./gvite-v2.13.0-nightly-202209271223 virtual
```

##  cases

### decimal diff
#### case1 
VTT/VITE: tradeTokenDecimal = quoteTokenDecimal

#### case2
VTT/BTC: tradeTokenDecimal > quoteTokenDecimal

#### case3
WOW/VITE: tradeTokenDecimal < quoteTokenDecimal

### morecases
#### case1 
1.seller: placeLimitOrder price:8000  qty: 6000000000000000000 (6)

2.buyer:  placeLimitOrder price:8000  qty: 6000000000000000000 (6)

#### case2
1.seller: placeLimitOrder price:8000  qty: 6000000000000000000 (6)

2.buyer:  placeMarketOrder price:0.25  qty: 6000000000000000000 (6)

#### case3
1.seller: placeLimitOrder price:8000  qty: 60000000000000000000 (60)

2.buyer:  placeMarketOrder price:0.25  qty: 60000000000000000000 (60)

#### case4
1.seller: placeLimitOrder price:8000  qty: 6000000000000000000 (6)

2.buyer:  placeLimitOrder price:8000  qty: 6000000000000000000 (6)

3.seller: placeLimitOrder price:9000  qty: 6000000000000000000 (6)

4.buyer:  placeMarketOrder price:0.25  qty: 6000000000000000000 (6)

#### case5
1.buyer:  placeMarketOrder price:0.25  qty: 6000000000000000000 (6)

#### case6(buyer has enough balance)
1.seller: placeLimitOrder price:2000  qty: 6000000000000000000 (6)

2.buyer:  placeLimitOrder price:3000  qty: 6000000000000000000 (6)

3.buyer:  placeMarketOrder price:0.25  qty: 9000000000000000000 (9)

#### case7(buyer don`t have enough balance)
1.seller: placeLimitOrder price:8000  qty: 6000000000000000000 (6)

2.buyer:  placeLimitOrder price:9000  qty: 8000000000000000000 (8)

3.buyer:  placeMarketOrder price:0.25  qty: 9000000000000000000 (14)

#### case8(seller place market order)
1.buyer: placeLimitOrder price:8000  qty: 6000000000000000000 (6)

2.seller: placeMarketOrder price:9000  qty: 6000000000000000000 (6)

#### case9(seller with enough quantity - fill all bids)
1.buyer: placeLimitOrder price:800  qty: 6000000000000000000 (6)

2.buyer: placeLimitOrder price:900  qty: 6000000000000000000 (6)

3.seller: placeMarketOrder price:9000  qty: 20000000000000000000 (20)

#### case10(seller with less quantity - place market order)
1.buyer: placeLimitOrder price:800  qty: 9000000000000000000 (6)

2.buyer: placeLimitOrder price:900  qty: 6000000000000000000 (6)

3.seller: placeMarketOrder price:9000  qty: 6000000000000000000 (8)

#### case11(seller with just a little more quantity - fill all bids)
1.buyer: placeLimitOrder price:8000  qty: 6000000000000000000 (6)

2.buyer: placeLimitOrder price:6000  qty: 60000000000000000 (0.06)

3.buyer: placeLimitOrder price:5000  qty: 1000000000000000000 (6)

4.seller: placeMarketOrder price:90000  qty: 6006000000000000000 (6.006)

### limit other orderType

#### case1
limit PostOnly order

#### case2
limit FillOrKill order

#### case3
limit ImmediateOrCancel order