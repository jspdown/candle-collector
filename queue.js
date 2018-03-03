'use strict';

const Promise = require('bluebird');
const amqp = require('amqplib');
const logger = require('./libs/logger');
const { AmqpError, code } = require('./libs/errors');

let channel = null;

const codes = {
  CANNOT_CONNECT: code(1, 'Can\'t connect to AMQP server'),
  CANNOT_CREATE_CHANNEL: code(2, 'Can\'t create a new channel'),
  INVALID_TOPOLOGY: code(3, 'Invalid queues/exchange topology')
};

function connect(config, { exchanges, queues }) {
  return amqp.connect(config)
    .catch(() => {
      throw new AmqpError(codes.CANNOT_CONNECT);
    })
    .then(conn => conn.createChannel())
    .catch(err => {
      if (err instanceof AmqpError) throw err;

      throw new AmqpError(codes.CANNOT_CREATE_CHANNEL);
    })
    .then(chan => {
      channel = chan;

      channel.prefetch(1);

      const queueAsserted = (queues || []).map(queue =>
        channel.assertQueue(queue, { durable: true })
      );

      const exchangeAsserted = (exchanges || []).map(exchange =>
        channel.assertExchange(exchange.name, exchange.type, { durable: true })
          .then(() => (exchange.bindings || []))
          .map(({ queue, pattern }) =>
            channel.bindQueue(queue, exchange.name, pattern)
          )
      );

      return Promise.all([
        ...queueAsserted,
        ...exchangeAsserted
      ]);
    })
    .catch(err => {
      if (err instanceof AmqpError) throw err;
      logger.log(err);

      throw new AmqpError(codes.INVALID_TOPOLOGY);
    });
}

function consume(queue, handler) {
  return channel.consume(queue, message => {
    let data;

    try {
      data = JSON.parse(message.content.toString('utf8'));
    } catch (err) {
      logger.error('Invalid message format: ', message.content.toString('utf8'));

      return channel.ack(message);
    }

    return Promise.resolve(handler(data))
      .finally(() => channel.ack(message));
  }, { noAck: false });
}

function subscribe(exchange, handler) {
  return channel.assertQueue('', { exclusive: true })
    .tap(q => channel.bindQueue(q.queue, exchange, ''))
    .then(q => consume(q.name, handler));
}

function publish(exchange, data) {
  const message = Buffer.from(JSON.stringify(data));

  return channel.publish(exchange, '', message, { persistent: true });
}

function send(queue, data) {
  const message = Buffer.from(JSON.stringify(data));

  return channel.sendToQueue(queue, message, { persistent: true });
}

module.exports = { connect, subscribe, consume, send, publish };
