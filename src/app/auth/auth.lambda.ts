import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { handleRequest } from './handleRequest';
import { OpenIDConnect } from '../code/OpenIDConnect';

const dynamoDBClient = new DynamoDBClient({});

function parseEvent(event: any) {
  return {
    cookies: event?.cookies?.join(';'),
    code: event?.queryStringParameters?.code,
    state: event?.queryStringParameters?.state,
  };
}

const OIDC = new OpenIDConnect();
const init = OIDC.init();

exports.handler = async (event: any) => {
  await init;
  try {
    const params = parseEvent(event);
    return await handleRequest(params.cookies, params.code, params.state, dynamoDBClient, OIDC);
  } catch (err) {
    console.error(err);
    return Response.error();
  }
};