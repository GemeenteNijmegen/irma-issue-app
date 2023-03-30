import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handleLoginRequest } from './loginRequestHandler';
import { OpenIDConnect } from '../code/OpenIDConnect';

const dynamoDBClient = new DynamoDBClient({});

function parseEvent(event: APIGatewayProxyEventV2) {
  return {
    loaerror: event?.queryStringParameters?.loa,
    cookies: event?.cookies?.join(';'),
  };
}

const OIDC = new OpenIDConnect();
const init = OIDC.init();

export async function handler (event: APIGatewayProxyEventV2) {
  await init;
  try {
    const params = parseEvent(event);
    const response = await handleLoginRequest(params, dynamoDBClient, OIDC);
    return response;
  } catch (err) {
    console.error(err);
    return Response.error();
  }
};