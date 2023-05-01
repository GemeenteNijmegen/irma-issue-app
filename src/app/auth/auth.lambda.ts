import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { handleRequest } from './handleRequest';
import { OpenIDConnect } from '../code/OpenIDConnect';

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION });

function parseEvent(event: any) {
  return {
    cookies: event?.cookies?.join(';'),
    code: event?.queryStringParameters?.code,
    state: event?.queryStringParameters?.state,
  };
}

const OIDC = new OpenIDConnect();
const init = OIDC.init();
console.debug("OIDC init called...")

exports.handler = async (event: any) => {
  try {
    await init;
    console.debug("OIDC init completed...");
    const params = parseEvent(event);
    console.debug("Event params parsed...");
    return await handleRequest(params.cookies, params.code, params.state, dynamoDBClient, OIDC, logsClient);
  } catch (err) {
    console.error(err);
    return Response.error();
  }
};