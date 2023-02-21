import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { handleRequest } from './handleRequest';

const logger = new Logger({ serviceName: 'YiviAuthLambda' });
const dynamoDBClient = new DynamoDBClient({});

function parseEvent(event: any) {
  return {
    cookies: event?.cookies?.join(';'),
    code: event?.queryStringParameters?.code,
    state: event?.queryStringParameters?.state,
  };
}

exports.handler = async (event: any) => {
  try {
    const params = parseEvent(event);
    return await handleRequest(params.cookies, params.code, params.state, dynamoDBClient, logger);
  } catch (err) {
    console.error(err);
    return Response.error();
  }
};