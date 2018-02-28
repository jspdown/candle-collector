'use strict';

const Promise = require('bluebird');
const BigNumber = require('bignumber.js');
const logger = require('../libs/logger');
const db = require('../db');
const queue = require('../queue');
const config = require('../config');

function convertType(bucket) {
  const bigNumbers = ['open', 'low', 'high', 'close', 'volume'];
  const dates = ['date'];

  return Object.keys(bucket).reduce((acc, prop) => {
    if (bigNumbers.includes(prop)) {
      acc[prop] = new BigNumber(bucket[prop]);
    } else if (dates.includes(prop)) {
      acc[prop] = new Date(bucket.date)
    } else {
      acc[prop] = bucket[prop];
    }

    return acc;
  }, {});
}

Promise.all([
  db.connect(config.database),
  queue.connect(config.amqp, {
    exchanges: [{ name: 'new-candle', type: 'fanout' }]
  })
])
  .then(() => queue.subscribe('new-candle', ({ pair, timeframe, bucket }) => {
    const { open, low, high, close, date, volume } = convertType(bucket);


    return db.upsertCandle(timeframe, pair, date, { open, low, high, close, volume })
      .then(() => logger.info('Saved new candle in database', pair, timeframe, bucket))
      .catch(err => logger.error('Cannot update', pair, timeframe, bucket, err));
  }))
  .catch(err => logger.error('Fatal error', err));
