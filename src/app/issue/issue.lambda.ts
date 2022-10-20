import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ApiClient } from '@gemeentenijmegen/apiclient';
import { IrmaApi } from '../code/IrmaApi';
import { issueRequestHandler } from './issueRequestHandler';

const dynamoDBClient = new DynamoDBClient({});

const brpClient = new ApiClient();
const irmaApi = new IrmaApi();

async function init() {
  console.time('init');
  console.timeLog('init', 'start init');
  let promiseBrp = brpClient.init();
  let promiseIrma = irmaApi.init();
  console.timeEnd('init');
  return Promise.all([promiseBrp, promiseIrma]);
}

const initPromise = init();

function parseEvent(event: any) {
  return {
    cookies: event?.cookies?.join(';'),
  };
}

exports.handler = async (event: any) => {
  try {
    const params = parseEvent(event);
    await initPromise;

    return await issueRequestHandler(params.cookies, brpClient, irmaApi, dynamoDBClient);

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
    };
  }
};