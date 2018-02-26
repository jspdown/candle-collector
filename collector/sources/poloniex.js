'use strict';

const _ = require('lodash');
const WebSocket = require('ws');
const BigNumber = require('bignumber.js');
const { Source } = require('./source');
const logger = require('../../libs/logger');
const request = require('../request');

class Poloniex extends Source {
  constructor(config) {
    super('poloniex');

    this.config = Object.assign({
      apiURL: 'https://poloniex.com',
      wsURL: 'wss://api2.poloniex.com',
      pairs: []
    }, config);

    this.ws = new WebSocket(this.config.wsURL);

    this.ws.on('open', () => this._onOpen());
    this.ws.on('close', () => logger.info('close'));
    this.ws.on('error', err => logger.error('error', err));
    this.ws.on('message', (message, d) => this._onMessage(message, d));

    this.channelPair = {};
  }

  _onClose(err) {
    logger.error('close', err);
  }

  _onOpen() {
    logger.info('Connected to Poloniex websocket');
    return this._getPairs(this.config.pairs)
      .then(pairs => {
        this.channelPair = _.keyBy(pairs, 'id');
        pairs.forEach(pair => this.ws.send(JSON.stringify({
          command: 'subscribe',
          channel: pair.id
        })));
      })
      .catch(err => logger.error('Unexpected error', err));
  }

  _getPairs(pairs) {
    const url = `${this.config.apiURL}/public?command=returnTicker`;

    return request('GET', url)
      .then(ticks => Object.keys(ticks)
        .map(name => {
          const [quote, base] = name.split('_');

          return {
            base, quote,
            id: ticks[name].id
          };
        })
        .filter(({ base, quote }) => _.findIndex(pairs, { quote, base }) !== -1)
      );
  }

  _onMessage(message) {
    const [channel, , data] = JSON.parse(message);

    if (!this.channelPair[channel]) return;

    data
      .filter(([action]) => action === 't')
      .forEach(([, id, type, price, amount, date]) => {
        const { quote, base } = this.channelPair[channel];
        const trade = {
          id,
          quote, base,
          type: type === 1 ? 'buy' : 'sell',
          price: new BigNumber(price),
          amount: new BigNumber(amount),
          date: new Date(parseInt(date, 10) * 1000)
        };

        this._dispatchTradeListeners(trade);
      });
  }
}

module.exports = { Poloniex };
