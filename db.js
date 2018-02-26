'use strict';

const Promise = require('bluebird');
const BigNumber = require('bignumber.js');
const mysql = require('mysql');
const { DatabaseError, code } = require('./libs/errors');

const codes = {
  UNKNOWN_ERROR: code(1, 'Unknown error'),
  CANNOT_CONNECT: code(2, 'Can\'t connect to database'),
  NOT_FOUND: code(3, 'Not Found')
};
let pool;

function connect(config) {
  pool = mysql.createPool({
    connectionLimit: config.connectionLimit,
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
  });

  return new Promise((resolve, reject) =>
    pool.getConnection(err => {
      if (err) return reject(new DatabaseError(codes.CANNOT_CONNECT));

      return resolve();
    })
  );
}

function disconnect() {
  pool.end();
}

function _query(query, params) {
  return new Promise((resolve, reject) => pool.getConnection((err, conn) => {
    if (err) return reject(err);

    conn.query(query, params, (error, results, fields) => {
      conn.release();

      if (error) {
        return reject(new DatabaseError(codes.UNKNOWN_ERROR, error));
      }

      return resolve({ results, fields });
    });
  }));
}

function executeQuery(query, params) {
  return _query(query, params)
    .then(({ results }) => results);
}

function fetchQuery(query, params) {
  return _query(query, params)
    .then(({ results }) => results);
}

function getExchanges() {
  return fetchQuery('SELECT name FROM exchanges');
}

function getTimeframes() {
  return fetchQuery('SELECT value, unit FROM timeframes');
}

function getPairs(exchange) {
  const params = [];
  let query = `
    SELECT  base.symbol AS base,
            quote.symbol AS quote,
            exchanges.name AS exchange,
            quote.decimals AS decimals
    FROM pairs
    INNER JOIN coins AS base
      ON base.id = pairs.base_id
    INNER JOIN coins AS quote
      ON quote.id = pairs.quote_id
    INNER JOIN exchanges
      ON exchanges.id = pairs.exchange_id
  `;

  if (exchange) {
    query += 'WHERE exchange.name = ?';

    params.push(exchange);
  }

  return fetchQuery(query, params);
}

function getPair(exchange, base, quote) {
  return fetchQuery(`
    SELECT pairs.id AS id,
           base.id AS baseId,
           quote.id AS quoteId,
           quote.decimals AS decimals
    FROM pairs
    INNER JOIN coins AS base
      ON base.id = pairs.base_id
    INNER JOIN coins AS quote
      ON quote.id = pairs.quote_id
    INNER JOIN exchanges
      ON exchanges.id = pairs.exchange_id
    WHERE base.symbol = ?
      AND quote.symbol = ?
      AND exchanges.name = ?
  `, [base, quote, exchange])
    .then(([pair]) => {
      if (!pair) {
        throw new DatabaseError(codes.NOT_FOUND);
      }

      return pair;
    });
}

function getTimeframe(value, unit) {
  return fetchQuery(`
    SELECT *
    FROM timeframes
    WHERE unit = ?
      AND value = ?
  `, [unit, value])
    .then(([timeframe]) => {
      if (!timeframe) {
        throw new DatabaseError(codes.NOT_FOUND);
      }

      return timeframe;
    });
}

function getCandles(exchange, timeframe, pair, limit=500) {
  const query = `
    SELECT date, low, high, open, close, volume
    FROM candles
    WHERE pair_id = ?
      AND timeframe_id = ?
    ORDER BY date DESC
    LIMIT ?
  `;

  const convertPrice = (price, decimals) =>
    new BigNumber(price).shiftedBy(-decimals);

  return Promise.props({
    pair: getPair(exchange, pair.base, pair.quote),
    timeframe: getTimeframe(timeframe.value, timeframe.unit)
  })
    .then(fetched => {
      const { decimals } = fetched.pair;

      return fetchQuery(query, [fetched.pair.id, fetched.timeframe.id, limit])
        .map(({ date, low, high, open, close, volume }) => ({
          date,
          low: convertPrice(low, decimals),
          high: convertPrice(high, decimals),
          open: convertPrice(open, decimals),
          close: convertPrice(close, decimals),
          volume: convertPrice(volume, decimals)
        }));
    });
}

function upsertCandle(timeframe, pair, date, candle, id) {
  const query = `
    INSERT INTO candles (
      date, pair_id, timeframe_id,
      low, high, open, close, volume
    )
    VALUES (
      ?, ?, ?,
      ?, ?, ?, ?, ?
    )
    ON DUPLICATE KEY UPDATE
      low = ?,
      high = ?,
      open = ?,
      close = ?,
      volume = ?
  `;

  const convertPrice = (price, decimals) =>
    price.shiftedBy(decimals).toString();

  return Promise.props({
    pair: getPair(pair.exchange, pair.base, pair.quote),
    timeframe: getTimeframe(timeframe.value, timeframe.unit)
  })
    .then(fetched => {
      const { decimals } = fetched.pair;
      const { open, close, low, high, volume } = Object.keys(candle)
        .reduce((acc, prop) => {
          acc[prop] = convertPrice(candle[prop], decimals);

          return acc;
        }, {});

      return executeQuery(query, [
        date, fetched.pair.id, fetched.timeframe.id,
        low, high, open, close, volume,
        low, high, open, close, volume
      ]);
    });
}

module.exports = {
  connect, disconnect, codes,
  getPairs, getTimeframes, getExchanges,
  upsertCandle, getCandles
};
