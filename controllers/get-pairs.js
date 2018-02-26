'use strict';

const db = require('../db');

function getPairs(req, res, next) {
  const { exchange } = req.query;

  return db.getPairs(exchange)
    .then(pairs => {
      res.data = pairs;
    })
    .asCallback(next);
}

module.exports = getPairs;
