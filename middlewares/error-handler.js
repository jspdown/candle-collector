'use strict';

const { Err, DatabaseError, codes } = require('../libs/errors');
const logger = require('../libs/logger');

function errorHandler(error, req, res, next) {
  if (error instanceof DatabaseError) {
    logger.error('Database Error:', error.message, error.data);

    error = new Err(codes.INTERNAL_ERROR);
  } else if (!(error instanceof Err)) {
    logger.error('Unexpected Error:', error);

    error = new Err(codes.INTERNAL_ERROR);
  }

  res.status(error.status).send({
    code: error.code,
    message: error.message
  });
}

module.exports = errorHandler;
