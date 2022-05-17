# go-vite-nightly
nightly build go-vite


github action example: 
```
release from: master
release tag: v2.11.0
```




```

./versions/integration_test/boot

npx vuilder test scripts/basic.ts --config scripts/vuilder.json

docker cp integration_test_s1_1:/root/.gvite/node1/devdata/ledger/blocks ~/tmp/gvite

docker run -v /Users/jie/tmp/gvite/ddd:/root/.gvite -p 127.0.0.1:48132:48132  --rm vitelabs/gvite-nightly:test --config /root/.gvite/node_config.json load --fromDir=/root/.gvite


```