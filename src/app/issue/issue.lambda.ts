import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ApiClient } from '@gemeentenijmegen/apiclient';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { issueRequestHandler } from './issueRequestHandler';
import { YiviApi } from '../code/YiviApi';

const dynamoDBClient = new DynamoDBClient({});

const brpClient = new ApiClient();
const yiviApi = new YiviApi();

async function init() {
  console.time('init');
  console.timeLog('init', 'start init');
  let promiseBrp = brpClient.init();
  let promiseYivi = yiviApi.init();
  console.timeEnd('init');
  return Promise.all([promiseBrp, promiseYivi]);
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

    return await issueRequestHandler(params.cookies, brpClient, yiviApi, dynamoDBClient);

  } catch (err) {
    console.error(err);
    return Response.error();
  }
};