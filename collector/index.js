'use strict';

const { Collector } = require('./collector');
const { Poloniex } = require('./sources/poloniex');
const logger = require('../libs/logger');
const db = require('../db');
const config = require('../config');

db.connect(config.database)
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
    collector.onBucketChange(unsertCandleInDb);

    logger.info('Collecting trades...');
  });

function filterPairsByExchange(pairs, exchange) {
  return pairs.filter(pair => pair.exchange === exchange);
}

let id = 0;
function unsertCandleInDb(pair, timeframe, bucket) {
  const timeframeStr = `${timeframe.value}_${timeframe.unit}`;
  const pairStr = `${pair.base}_${pair.quote}`;
  const { open, low, high, close, date, volume } = bucket;

  db.upsertCandle(timeframe, pair, date, { open, low, high, close, volume }, id++)
    .catch(err => logger.error('Cannot update', pair, timeframe, bucket, err));
}
