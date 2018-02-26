'use strict';

function render(req, res, next) {
  const status = res.statusCode || 200;
  const data = res.data || {};

  res
    .status(status)
    .send(data)
    .end();
}

module.exports = render;
