'use strict';

const Promise = require('bluebird');
const ccxt = require('ccxt');
const _ = require('lodash');
const WebSocket = require('ws');
const BigNumber = require('bignumber.js');
const { Exchange } = require('./exchange');
const logger = require('../libs/logger');

class Poloniex extends Exchange {
  constructor(config) {
    super('poloniex');

    this.config = Object.assign({
      apiURL: 'https://poloniex.com',
      wsURL: 'wss://api2.poloniex.com',
      pairs: []
    }, config);

    this.ccxt = new ccxt.poloniex({
      apiKey: this.config.apiKey,
      secret: this.config.apiSecret
    });
    this.channelPair = {};

    this.ws = new WebSocket(this.config.wsURL);

    this.ws.on('open', () => this._onWebsocketOpen());
    this.ws.on('close', () => logger.info('close'));
    this.ws.on('error', err => logger.error('error', err));
    this.ws.on('message', (message, d) => this._onWebsocketMessage(message, d));

    this.exchangeReady = Promise.resolve(this.ccxt.loadMarkets());
  }

  calculateFee(type, pair, amount, price, takerOrMaker) {
    const currencyPair = `${pair.base}/${pair.quote}`;
    const orderType = 'limit';
    const orderSide = type === Exchange.ORDER_TYPE.BUY ? 'buy' : 'sell';
    const feeType = takerOrMaker === Exchange.FEE_TYPE.MAKER ? 'maker' : 'taker';
    const amountFloat = amount.toNumber();
    const priceFloat = price.toNumber();

    return this.exchangeReady
      .then(() => this.ccxt.calculateFee(
        currencyPair,
        orderType,
        orderSide,
        amountFloat,
        priceFloat,
        feeType
      ))
      .then(res => ({
        currency: res.currency,
        feeRate: res.rate,
        cost: new BigNumber(res.cost)
      }));
  }

  createOrder(type, pair, amount, price) {
    const currencyPair = `${pair.base}/${pair.quote}`;
    const orderType = 'limit';
    const orderSide = type === Exchange.ORDER_TYPE.BUY ? 'buy' : 'sell';
    const amountFloat = amount.toNumber();
    const priceFloat = price.toNumber();

    return this.exchangeReady
      .then(() => this.ccxt.createOrder(
        currencyPair,
        orderType,
        orderSide,
        amountFloat,
        priceFloat
      ))
      .then(order => order.id);
  }

  cancelOrder(orderNumber) {
    return this.exchangeReady
      .then(() => this.ccxt.cancelOrder(orderNumber))
      .return();
  }

  getOpenOrders(pair) {
    const currencyPair = `${pair.base}/${pair.quote}`;

    return this.exchangeReady
      .then(() => this.ccxt.fetchOpenOrders(currencyPair))
      .then(orders => orders.map(order => ({
        id: order.id,
        date: new Date(order.datetime),
        type: order.side === 'buy'
          ? Exchange.ORDER_TYPE.BUY
          : Exchange.ORDER_TYPE.SELL,
        price: new BigNumber(order.price),
        amount: new BigNumber(order.amount),
        remaining: new BigNumber(order.remaining)
      })));
  }

  getBalances() {
    return this.exchangeReady
      .then(() => this.ccxt.fetchBalance())
      .then(res => _.omit(res, ['info', 'free', 'used', 'total']))
      .then(balances => _.mapValues(balances, ({ free, used, total }) => ({
        free: new BigNumber(free),
        used: new BigNumber(used),
        total: new BigNumber(total)
      })));
  }

  _onWebsocketOpen() {
    logger.info('Connected to Poloniex websocket');

    return this.exchangeReady
      .then(() => this.ccxt.fetchTickers())
      .then(tickers => this.config.pairs
        .filter(pair => pair.exchange === this.name)
        .forEach(pair => {
          const currencyPair = `${pair.base}/${pair.quote}`;
          const channel = _.get(tickers, [currencyPair, 'info', 'id']);

          if (!channel) {
            logger.error(`Cannot subscribe to ${currencyPair}. Pair not found`);

            return;
          }
          logger.info(`Subscribing to ${currencyPair} on channel ${channel}`);

          this.channelPair[channel] = pair;
          this.ws.send(JSON.stringify({ command: 'subscribe', channel }));
        })
      )
      .catch(err => logger.error('Unexpected error', err));
  }

  _onWebsocketMessage(message) {
    const [channel, , data] = JSON.parse(message);

    if (!this.channelPair[channel]) return;

    data
      .filter(([action]) => action === 't')
      .forEach(([, id, type, price, amount, date]) => {
        const { quote, base } = this.channelPair[channel];
        const trade = {
          id, quote, base,
          type: type === 1
            ? Exchange.ORDER_TYPE.BUY
            : Exchange.ORDER_TYPE.SELL,
          price: new BigNumber(price),
          amount: new BigNumber(amount),
          date: new Date(parseInt(date, 10) * 1000)
        };

        this.emit('new-trade', trade);
      });
  }
}

module.exports = { Poloniex };
