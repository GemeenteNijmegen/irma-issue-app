import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ApiClient } from '@gemeentenijmegen/apiclient';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { BrpApi } from './BrpApi';
import { issueRequestHandler } from './issueRequestHandler';
import { YiviApi } from '../code/YiviApi';

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION });

const brpClient = new ApiClient();
const yiviApi = new YiviApi();
const brpApi = new BrpApi(brpClient);

async function init() {
  const promiseBrpClient = brpClient.init();
  const promiseYiviApi = yiviApi.init();
  const promiseBrpApi = brpApi.init();
  return Promise.all([promiseBrpClient, promiseBrpApi, promiseYiviApi]);
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

    return await issueRequestHandler(params.cookies, brpApi, yiviApi, dynamoDBClient, logsClient);

  } catch (err) {
    console.error(err);
    return Response.error();
  }
};