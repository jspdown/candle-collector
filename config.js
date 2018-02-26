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
    host: getEnv('SCANNER_MYSQL_HOST'),
    port: getEnv('SCANNER_MYSQL_PORT'),
    user: getEnv('SCANNER_MYSQL_USER'),
    password: getEnv('SCANNER_MYSQL_PASS'),
    database: getEnv('SCANNER_MYSQL_DATABASE')
  },
  port: getEnv('SCANNER_PORT')
};

module.exports = config;
