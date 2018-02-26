'use strict';

class Source {
  constructor(name) {
    this.name = name;
    this.onTradeListeners = [];
  }

  onTrade(callback) {
    this.onTradeListeners.push(callback);
  }

  _dispatchTradeListeners(trade) {
    this.onTradeListeners.forEach(listener => listener(this.name, trade));
  }
}

module.exports = { Source };
