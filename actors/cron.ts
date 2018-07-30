require('dotenv').config();

import * as amqp from 'amqplib';

import * as cron from 'cron';

import * as http from 'superagent';

const exchange = 'coinmarketcap';

const routingKey = 'prices.update';

const queue = 'coinmarketcap.prices.updates';

const cronPattern = '0 0 * * * *'; // every hour

async function getPrices() {

  let resp = await http.get('https://api.coinmarketcap.com/v1/ticker');

  return resp.body.reduce((accumulator, item) => {

      accumulator[item.symbol] = 1 / parseFloat(item.price_btc);

      return accumulator;

  }, {});

}

async function publishPrice(chan: amqp.Channel, prices: any) {

  let message = new Buffer(JSON.stringify({
    prices,
    timestamp: new Date()
  }));

  await chan.publish(exchange, routingKey, message);

}

export async function start() {

  let conn = await amqp.connect(process.env.AMQP_URL);

  let chan = await conn.createChannel();

  await chan.assertExchange(exchange, 'direct');

  await chan.assertQueue(queue);

  await chan.bindQueue(queue, exchange, routingKey);

  // every minute
  var job = new cron.CronJob(cronPattern, async () => {

    let prices = await getPrices();

    await publishPrice(chan, prices);

  });

  job.start();

}

