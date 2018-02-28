'use strict';

const { Collector } = require('./collector');
const { Poloniex } = require('./sources/poloniex');
const logger = require('../libs/logger');
const db = require('../db');
const queue = require('../queue');
const config = require('../config');

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

    const sources = [
      new Poloniex({ pairs: filterPairsByExchange(pairs, 'poloniex') })
    ];
    const collector = new Collector(timeframes);

    sources.forEach(src => src.onTrade((exchange, trade) =>
      collector.push(exchange, trade)
    ));
    collector.onBucketChange((pair, timeframe, bucket) => {
      console.log('sending new candle');
      queue.publish('new-candle', { pair, timeframe, bucket });
    });

    logger.info('Collecting trades...');
  })
  .catch(err => logger.error('Fatal error:', err));

function filterPairsByExchange(pairs, exchange) {
  return pairs.filter(pair => pair.exchange === exchange);
}
