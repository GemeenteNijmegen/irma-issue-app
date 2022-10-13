import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { IrmaApi } from '../code/IrmaApi';
import { resultRequestHandler } from './handleRequest';

const dynamoDBClient = new DynamoDBClient({});
const irmaApi = new IrmaApi();

async function init() {
  console.time('init');
  console.timeLog('init', 'start init');
  let promiseIrma = irmaApi.init();
  console.timeEnd('init');
  return promiseIrma;
}

const initPromise = init();

function parseEvent(event: any) {
  return {
    cookies: event?.cookies?.join(';'),
    token: event?.queryStringParameters?.token,
  };
}

exports.handler = async (event: any) => {
  try {
    const params = parseEvent(event);
    await initPromise;
    return await resultRequestHandler(params.cookies, irmaApi, params.token, dynamoDBClient);
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
    };
  }
};