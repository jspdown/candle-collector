'use strict';

const db = require('./db');
const config = require('./config');
const app = require('./app');
const logger = require('./libs/logger');

db.connect(config.database)
  .then(() => app.listen(config.port))
  .then(() => logger.info(`listening on port ${config.port}...`))
  .catch(err => {
    logger.error('Unexpected error: ', err);
    db.disconnect();
  });
