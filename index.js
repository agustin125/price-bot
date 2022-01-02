require("dotenv").config();


const bodyParser = require('body-parser')
const express = require("express");
const http = require("http");
const Web3 = require("web3");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const moment = require("moment-timezone");
const numeral = require("numeral");
const _ = require("lodash");
const axios = require("axios");
var abi = require("./abi");

// SERVER CONFIG
const PORT = process.env.PORT || 5000;
const app = express();
const server = http
  .createServer(app)
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

// WEB3 CONFIG
const web3 = new Web3(process.env.RPC_URL);


console.log('ABI address ' + abi.UNISWAP_FACTORY_ADDRESS)

console.log('ABI ' + abi.UNISWAP_FACTORY_ABI)


const uniswapFactoryContract = new web3.eth.Contract(
 abi.UNISWAP_FACTORY_ABI,
 abi.UNISWAP_FACTORY_ADDRESS
);

const kyberRateContract = new web3.eth.Contract(
  abi.KYBER_RATE_ABI,
  abi.KYBER_RATE_ADDRESS
);

async function checkPair(args) {
  const {
    inputTokenSymbol,
    inputTokenAddress,
    outputTokenSymbol,
    outputTokenAddress,
    inputAmount,
  } = args;

  const exchangeAddress = await uniswapFactoryContract.methods
    .getExchange(outputTokenAddress)
    .call();

  console.error(exchangeAddress);

  const exchangeContract = new web3.eth.Contract(
    abi.UNISWAP_EXCHANGE_ABI,
    exchangeAddress
  );

  const uniswapResult = await exchangeContract.methods
    .getEthToTokenInputPrice(inputAmount)
    .call();
  let kyberResult = await kyberRateContract.methods
    .getExpectedRate(inputTokenAddress, outputTokenAddress, inputAmount, true)
    .call();

  console.table([
    {
      "Input Token": inputTokenSymbol,
      "Output Token": outputTokenSymbol,
      "Input Amount": web3.utils.fromWei(inputAmount, "Ether"),
      "Uniswap Return": web3.utils.fromWei(uniswapResult, "Ether"),
      "Kyber Expected Rate": web3.utils.fromWei(
        kyberResult.expectedRate,
        "Ether"
      ),
      "Kyber Min Return": web3.utils.fromWei(kyberResult.slippageRate, "Ether"),
      Timestamp: moment().tz("America/Chicago").format(),
    },
  ]);
}

let priceMonitor;
let monitoringPrice = false;

async function monitorPrice() {
  if (monitoringPrice) {
    return;
  }

  console.log("Checking prices...");
  monitoringPrice = true;

  try {
    // ADD YOUR CUSTOM TOKEN PAIRS HERE!!!

    await checkPair({
      inputTokenSymbol: "ETH",
      inputTokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      outputTokenSymbol: "MKR",
      outputTokenAddress: "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
      inputAmount: web3.utils.toWei("1", "ETHER"),
    });
    /*
    await checkPair({
      inputTokenSymbol: 'ETH',
      inputTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      outputTokenSymbol: 'DAI',
      outputTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
      inputAmount: web3.utils.toWei('1', 'ETHER')
    })


    await checkPair({
      inputTokenSymbol: 'ETH',
      inputTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      outputTokenSymbol: 'KNC',
      outputTokenAddress: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200',
      inputAmount: web3.utils.toWei('1', 'ETHER')
    })



    await checkPair({
      inputTokenSymbol: 'ETH',
      inputTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      outputTokenSymbol: 'LINK',
      outputTokenAddress: '0x514910771af9ca656af840dff83e8264ecf986ca',
      inputAmount: web3.utils.toWei('1', 'ETHER')
    })
    
*/

    /*
    await checkPair({
      inputTokenSymbol: 'BNB',
      inputTokenAddress: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
      outputTokenSymbol: 'USDT',
      outputTokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      inputAmount: web3.utils.toWei('1', 'ETHER')
    })
    */
  } catch (error) {
    console.error(error);
    monitoringPrice = false;
    clearInterval(priceMonitor);
    return;
  }

  monitoringPrice = false;
}

// Check markets every n seconds
const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 3000; // 3 Seconds
priceMonitor = setInterval(async () => {
  await monitorPrice();
}, POLLING_INTERVAL);
