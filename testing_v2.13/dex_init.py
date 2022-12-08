#!/usr/bin/env python
# coding: utf-8
#

import json
import time
import os
import requests

session = requests.Session()
session.trust_env = False

NODE_HTTP_URL = 'http://127.0.0.1:23456'
if os.getenv('NODE_HTTP_URL') != None:
    NODE_HTTP_URL = os.getenv('NODE_HTTP_URL')


def json_rpc(rpc_url, payload, thx=True):
    response = session.post(rpc_url, json=payload, timeout=2).json()
    print(json.dumps(payload), json.dumps(response))
    if thx:
        assert "error" not in response
        assert "Error" not in response
    return response


def height():
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "ledger_getSnapshotChainHeight",
        "params": []
    }
    result = json_rpc(NODE_HTTP_URL, payload)
    return result['result']


def confirmedNum(blockHash):
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "ledger_getAccountBlockByHash",
        "params": [blockHash]
    }
    result = json_rpc(NODE_HTTP_URL, payload)
    if result['result']['confirmations'] == None:
        return 0
    else:
        return int(result['result']['confirmations'])


def dexTokenInfoDone():
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "dex_getTokenInfo",
        "params": ["tti_5649544520544f4b454e6e40"]
    }

    result = json_rpc(NODE_HTTP_URL, payload, False)
    return "error" not in result


def notify_time_data():
    payload = {
        "jsonrpc":
        "2.0",
        "id":
        1,
        "method":
        "contract_getCallContractData",
        "params": [
            '[{"type": "function", "name": "NotifyTime", "inputs": [{"name": "timestamp", "type": "int64"}]}]',
            'NotifyTime', [str(int(time.time()))]
        ]
    }
    result = json_rpc(NODE_HTTP_URL, payload)
    return result['result']


def notify_next_time_data(t):
    payload = {
        "jsonrpc":
        "2.0",
        "id":
        1,
        "method":
        "contract_getCallContractData",
        "params": [
            '[{"type": "function", "name": "NotifyTime", "inputs": [{"name": "timestamp", "type": "int64"}]}]',
            'NotifyTime', [str(int(t))]
        ]
    }
    result = json_rpc(NODE_HTTP_URL, payload)
    return result['result']


def get_dex_time():
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "dex_getTime",
        "params": []
    }
    result = json_rpc(NODE_HTTP_URL, payload)
    return result['result']


def sendWithPriv(from_address, to_address, amount, data, tokenId, priv):
    payload = {
        "jsonrpc":
        "2.0",
        "id":
        1,
        "method":
        "tx_sendTxWithPrivateKey",
        "params": [{
            "selfAddr": from_address,
            "toAddr": to_address,
            "tokenTypeId": tokenId,
            "privateKey": priv,
            "amount": amount,
            "data": data,
            "blockType": 2
        }]
    }
    result = json_rpc(NODE_HTTP_URL, payload)
    return result['result']


def waitConfirmed(hash):
    while int(confirmedNum(hash)) < 1:
        print("waiting " + hash + ",confirm")
        time.sleep(1)


while int(height()) < 3:
    print("waiting snapshot height inc")
    time.sleep(2)

tokenId = 'tti_5649544520544f4b454e6e40'
from_address = 'vite_962eab5a19e51fe36506308f6fcf337876139bd5fee3048c46'
from_priv = '1fe8a06b1f91641d7842beebac93be69be41a539904c9abafdb60ec0c7b2e2ff9d4c7376b59705dd5c0028a3e2613dadcc103dc3f91747eff6e6980647ee2c4a'
# dex fund address
fund_address = 'vite_0000000000000000000000000000000000000006e82b8ba657'
if dexTokenInfoDone():
    print('dex initd')
    exit(0)

# 初始化各种owner
data_init_fund = '0t4wUgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3AAAAAAAAAAAAAACWLqtaGeUf42UGMI9vzzN4dhOb1QAAAAAAAAAAAAAAAJYuq1oZ5R/jZQYwj2/PM3h2E5vVAAAAAAAAAAAAAAAAli6rWhnlH+NlBjCPb88zeHYTm9UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJYuq1oZ5R/jZQYwj2/PM3h2E5vVAAAAAAAAAAAAAAAAli6rWhnlH+NlBjCPb88zeHYTm9UA'
block = sendWithPriv(from_address, fund_address, "0", data_init_fund, tokenId,
                     from_priv)
waitConfirmed(block['hash'])

# 初始化时间戳
data_vite_quote_fund = notify_time_data()

block = sendWithPriv(from_address, fund_address, "0", data_vite_quote_fund,
                     tokenId, from_priv)

waitConfirmed(block['hash'])

# 初始化btc市场
data_btc_quote_fund = 'Qa/ldgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFZJVEUgVE9LRU4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAVklURSBUT0tFTgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADIoYrP47a47ArEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

block = sendWithPriv(from_address, fund_address, "0", data_btc_quote_fund,
                     tokenId, from_priv)

waitConfirmed(block['hash'])

time.sleep(5)

# 初始化eth市场
data_eth_quote_fund = 'Qa/ldgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFZJVEUgVE9LRU4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAVklURSBUT0tFTgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaCL40Jbs35NWsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

block = sendWithPriv(from_address, fund_address, "0", data_eth_quote_fund,
                     tokenId, from_priv)

waitConfirmed(block['hash'])
time.sleep(5)

# 初始化usdt市场
data_usdt_quote_fund = 'Qa/ldgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFZJVEUgVE9LRU4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAVklURSBUT0tFTgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJc6/J/9GMRnneQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

block = sendWithPriv(from_address, fund_address, "0", data_usdt_quote_fund,
                     tokenId, from_priv)

waitConfirmed(block['hash'])
time.sleep(5)

# 初始化vite市场
data_vite_quote_fund = 'Qa/ldgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFZJVEUgVE9LRU4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAVklURSBUT0tFTgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFZJVEUgVE9LRU4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

block = sendWithPriv(from_address, fund_address, "0", data_vite_quote_fund,
                     tokenId, from_priv)

waitConfirmed(block['hash'])
time.sleep(5)

vxTokenId = "tti_564954455820434f494e69b5"
data_endorse_vx = "Kcu6jg=="
block = sendWithPriv(from_address, fund_address, "100000000000000000000000000",
                     data_endorse_vx, vxTokenId, from_priv)

waitConfirmed(block['hash'])

# start vx normal mine
data_start_normal_line = 'Qa/ldgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAACc28yDX7Rwoca8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAMihis/jtrjsCsQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFZJVEUgVE9LRU4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
block = sendWithPriv(from_address, fund_address, "0", data_start_normal_line, tokenId,
                     from_priv)
waitConfirmed(block['hash'])

# 向交易所划转deposit
data_deposit_vx = "MZ5G3Q=="
block = sendWithPriv(from_address, fund_address, "100000000000000000000000",
                     data_deposit_vx, tokenId, from_priv)

waitConfirmed(block['hash'])

# 开通交易对[ VTT/ETH, VTT/VITE, VTT/USDT, VTT/BTC ]
data_open_market_pairs = [
    "/ltSiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnNvMg1+0cKHGvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaCL40Jbs35NWs=",
    "/ltSiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnNvMg1+0cKHGvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFZJVEUgVE9LRU4=",
    "/ltSiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnNvMg1+0cKHGvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJc6/J/9GMRnneQ=",
    "/ltSiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnNvMg1+0cKHGvAAAAAAAAAAAAAAAAAAAAAAAAAAAAADIoYrP47a47ArE=",
]

for data_open in data_open_market_pairs:
    block = sendWithPriv(from_address, fund_address, "0", data_open, tokenId,
                         from_priv)
    waitConfirmed(block['hash'])

# 初始化挖矿交易对
data_trade_mining_arr = [
    "Qa/ldgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAACc28yDX7Rwoca8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAMihis/jtrjsCsQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFZJVEUgVE9LRU4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "Qa/ldgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAACc28yDX7Rwoca8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAlzr8n/0YxGed5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFZJVEUgVE9LRU4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "Qa/ldgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAACc28yDX7Rwoca8AAAAAAAAAAAAAAAAAAAAAAAAAAAAABoIvjQluzfk1awAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFZJVEUgVE9LRU4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "Qa/ldgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAACc28yDX7Rwoca8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAVklURSBUT0tFTgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFZJVEUgVE9LRU4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
]

for data_trade in data_trade_mining_arr:
    block = sendWithPriv(from_address, fund_address, "0", data_trade, tokenId,
                         from_priv)
    waitConfirmed(block['hash'])

# ["DexFundPeriodJob", "1", "1"]
# 初始trigger, 统一trigger一次
data_dex_trigger_arr = [
    "803SLgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE=",
    "803SLgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI=",
    "803SLgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM=",
    "803SLgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQ=",
    "803SLgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU=",
    "803SLgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY=",
    "803SLgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAc="
]

for data_trigger in data_dex_trigger_arr:
    block = sendWithPriv(from_address, fund_address, "0", data_trigger,
                         tokenId, from_priv)
    waitConfirmed(block['hash'])
