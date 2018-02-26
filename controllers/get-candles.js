'use strict';

const { Err, DatabaseError, codes } = require('../libs/errors');
const db = require('../db');

function getCandles(req, res, next) {
  const { exchange, pair, timeframe } = validate(req);

  return db.getCandles(exchange, timeframe, pair)
    .catch(DatabaseError, err => {
      if (err.code === db.codes.NOT_FOUND.id) {
        throw new Err(codes.NOT_FOUND);
      }
      throw err;
    })
    .then(candles => res.data = candles)
    .asCallback(next);
}

function validate(req) {
  const { exchange, pair, timeframe } = req.query;

  if (!exchange || !pair || !timeframe) {
    throw new Err(codes.MISSING_PARAMETERS);
  }

  const timeframeIsValid = /^[0-9]+_[a-z]+$/i.test(timeframe);
  const pairIsValid = /^[a-z]+_[a-z]+$/i.test(pair);

  if (!timeframeIsValid || !pairIsValid) {
    throw new Err(codes.INVALID_PARAMETERS);
  }

  const splitUnderscore = str => str.split('_').map(v => v.toLowerCase());
  const unpluralize = str => (/s$/.test(str) ? str.slice(0, -1) : str);

  const [base, quote] = splitUnderscore(pair);
  const [value, unit] = splitUnderscore(timeframe);

  return {
    exchange,
    pair: { base, quote },
    timeframe: {
      value,
      unit: unpluralize(unit)
    }
  };
}

module.exports = getCandles;
