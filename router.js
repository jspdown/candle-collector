'use strict';

const express = require('express');
const { compose } = require('compose-middleware');
const { Err, codes } = require('./libs/errors');
const controllers = require('./controllers');
const render = require('./middlewares/render');

const routeNotFound = (req, res, next) =>
  next(new Err(codes.NOT_FOUND));

const route = controller => compose([controller, render]);
const router = express.Router();

router
  .get('/timeframes', route(controllers.getTimeframes))
  .get('/pairs', route(controllers.getPairs))
  .get('/candles', route(controllers.getCandles))
  .use(routeNotFound);

module.exports = router;
