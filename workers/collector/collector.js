'use strict';

const moment = require('moment');
const logger = require('../../libs/logger');

const MAX_BUCKETS = 100;

class Collector {
  constructor(timeframes) {
    this.timeframes = timeframes;
    this.buckets = {};
    this.bucketListeners = [];
    this.bucketsIds = {};
  }

  push(exchange, trade) {
    const pair = `${trade.base}_${trade.quote}`;

    logger.info('TRADE', trade.date, pair, 'price:', trade.price.toString(), 'volume:', trade.amount.toString());

    this.timeframes.forEach(frame => this.addInBucket(exchange, frame, trade));
  }

  addInBucket(exchange, timeframe, trade) {
    const pair = `${trade.base}_${trade.quote}`;
    const frame = `${timeframe.value}_${timeframe.unit}`;
    const key = `${exchange}-${pair}-${frame}`;

    if (!this.buckets[key]) {
      this.buckets[key] = [];
      this.bucketsIds[key] = 0;
    }

    const startOfBucket = this.getBucketDate(timeframe, moment(trade.date));
    let buckets = this.buckets[key];
    let bucket = buckets.find(({ date }) => +date === +startOfBucket);

    if (!bucket) {
      logger.info(`NEW BUCKET[${frame}][${pair}]`, buckets.length, startOfBucket.toDate());

      bucket = {
        id: this.bucketsIds[key]++,
        date: startOfBucket.toDate(),
        open: trade.price,
        close: trade.price,
        low: trade.price,
        high: trade.price,
        volume: trade.amount
      };

      if (buckets.length) {
        this.dispatchBucketListeners({
          exchange,
          base: trade.base,
          quote: trade.quote
        }, timeframe, buckets[buckets.length - 1]);
      }

      buckets.push(bucket);
      buckets = buckets.slice(-MAX_BUCKETS);
    } else {
      bucket.close = trade.price;
      bucket.low = trade.price.lt(bucket.low) ? trade.price : bucket.low;
      bucket.high = trade.price.gt(bucket.high) ? trade.price : bucket.high;
      bucket.volume = bucket.volume.plus(trade.amount);
    }
  }

  getBucketDate(timeframe, date) {
    const sortedUnits = ['month', 'week', 'day', 'hour', 'minute', 'second'];
    const { value, unit } = timeframe;

    const nbUnits = Math.trunc(date[unit]() / value) * value;
    const parentUnit = sortedUnits[sortedUnits.indexOf(unit) - 1];

    return date.clone()
      .startOf(parentUnit)
      .add(nbUnits, unit);
  }

  dispatchBucketListeners(pair, timeframe, bucket) {
    this.bucketListeners.forEach(listener => listener(pair, timeframe, bucket));
  }

  onBucketChange(listener) {
    this.bucketListeners.push(listener);
  }
}

module.exports = { Collector };
