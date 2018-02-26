'use strict';

const { Poloniex } = require('./poloniex');
const logger = require('../../libs/logger');

const pairs = [{
  exchange: 'poloniex',
  base: 'ETH',
  quote: 'BTC'
}];

const source = new Poloniex({ pairs });

logger.info(source.config);
