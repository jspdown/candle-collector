'use strict';

const db = require('../db');

function getTimeframes(req, res, next) {
  return db.getTimeframes()
    .then(timeframes => {
      res.data = timeframes;
    })
    .asCallback(next);
}

module.exports = getTimeframes;
