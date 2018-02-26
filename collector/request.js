'use strict';

const Promise = require('bluebird');
const request = require('request');

function sendRequest(method, url, body, headers) {
  const options = {
    method, url,
    headers: Object.assign({
      'Content-Type': 'application/json'
    }, headers)
  };

  if ((method === 'POST' || method === 'PUT') && body) {
    options.body = JSON.stringify(body);
  }

  return new Promise((resolve, reject) =>
    request(options, (error, response, responseBodyStr) => {
      if (error) {
        return reject(error);
      }

      if (response.statusCode === 401) {
        return reject(new Error('UNAUTHORIZED'));
      } else if (response.statusCoce >= 300) {
        return reject(new Error(`Unhandled error: ${responseBodyStr}`));
      }

      let resBody;

      try {
        resBody = JSON.parse(responseBodyStr);
      } catch (err) {
        return reject(new Error('Invalid json'));
      }

      return resolve(resBody);
    })
  );
}

module.exports = sendRequest;
