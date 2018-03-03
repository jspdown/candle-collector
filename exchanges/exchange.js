'use strict';

const { EventEmitter } = require('events');

class Exchange extends EventEmitter {
  constructor(name) {
    super();

    this.name = name;
  }

  static get ORDER_TYPE() {
    return { BUY: 'buy', SELL: 'sell' };
  }

  static get FEE_TYPE() {
    return { TAKER: 'taker', MAKER: 'maker' };
  }

  calculateFee() { throw new Error('Not Implemented'); }
  createOrder() { throw new Error('Not Implemented'); }
  cancelOrder() { throw new Error('Not Implemented'); }
  getOpenOrders() { throw new Error('Not Implemented'); }
  getBalances() { throw new Error('Not Implemented'); }
}

module.exports = { Exchange };
