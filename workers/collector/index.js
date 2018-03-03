'use strict';

const { Collector } = require('./collector');
const { Poloniex } = require('../../exchanges/poloniex');
const logger = require('../../libs/logger');
const db = require('../../db');
const queue = require('../../queue');
const config = require('../../config');

Promise.all([
  db.connect(config.database),
  queue.connect(config.amqp, {
    exchanges: [{ name: 'new-candle', type: 'fanout' }]
  })
])
  .then(() => Promise.all([
    db.getTimeframes(),
    db.getPairs()
  ]))
  .then(([timeframes, pairs]) => {
    logger.info('TIMEFRAMES:');
    timeframes.forEach(t => logger.info(`- ${t.value} ${t.unit}`));
    logger.info('PAIRS:');
    pairs.forEach(p => logger.info(`- ${p.base}/${p.quote} (${p.exchange})`));

    const exchanges = [new Poloniex({ pairs })];
    const collector = new Collector(timeframes);

    exchanges.forEach(ex =>
      ex.on('new-trade', trade => collector.push(ex.name, trade))
    );
    collector.onBucketChange((pair, timeframe, bucket) => {
      queue.publish('new-candle', { pair, timeframe, bucket });
    });

    logger.info('Collecting trades...');
  })
  .catch(err => logger.error('Fatal error:', err));
