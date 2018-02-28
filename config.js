'use strict';

function getEnv(name) {
  if (typeof process.env[name] === 'undefined') {
    throw new Error(`Missing env variable '${name}'`);
  }

  return process.env[name];
}

const config = {
  database: {
    connectionLimit: 100,
    host: getEnv('CANDLE_COLLECTOR_MYSQL_HOST'),
    port: getEnv('CANDLE_COLLECTOR_MYSQL_PORT'),
    user: getEnv('CANDLE_COLLECTOR_MYSQL_USER'),
    password: getEnv('CANDLE_COLLECTOR_MYSQL_PASS'),
    database: getEnv('CANDLE_COLLECTOR_MYSQL_DATABASE')
  },
  amqp: {
    protocol: 'amqp',
    hostname: getEnv('CANDLE_COLLECTOR_AMQP_HOST'),
    port: getEnv('CANDLE_COLLECTOR_AMQP_PORT'),
    username: getEnv('CANDLE_COLLECTOR_AMQP_USER'),
    password: getEnv('CANDLE_COLLECTOR_AMQP_PASS'),
    vhost: '/',
  },
  port: getEnv('CANDLE_COLLECTOR_PORT')
};

module.exports = config;
