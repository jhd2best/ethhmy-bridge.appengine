# ethhmy-bridge.appengine
Harmony Eth Bridge appengine

## Install instructions

### Requirements 

* nodejs 

### Commands

* Fetch repo 

```
git clone git@github.com:harmony-one/ethhmy-bridge.appengine.git
```

* Install dependencies

```
npm install
```

* Develop

```
npm run start:watch
```

* Build

```
npm run build
```

* Start

```
npm run start:prod
```

* How to create new ETH -> ONE BUSD transfer operation 
* It is test operation with hardcoded PK

```
curl --location --request POST 'http://localhost:8080/busd/operations' \
--header 'Content-Type: application/json' \
--data-raw '{
    "type": "busd_eth_one",
    "ethAddress": "0x0FBb9C31eabc2EdDbCF59c03E76ada36f5AB8723",
    "oneAddress": "0x203fc3cA24D4194A4CD1614Fec186a7951Bb0244",
    "amount": "1"
}'
```

* How to get all operations list 

```
curl --location --request GET 'http://localhost:8080/busd/operations'
```

