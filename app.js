'use strict';

const express = require('express');
const cors = require('cors');
const router = require('./router');
const errorHandler = require('./middlewares/error-handler');

const app = express();

app
  .use(cors())
  .use(router)
  .use(errorHandler);

module.exports = app;
