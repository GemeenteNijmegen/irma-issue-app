import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handleLoginRequest } from './loginRequestHandler';

const dynamoDBClient = new DynamoDBClient({});

function parseEvent(event: APIGatewayProxyEventV2) {
  return {
    loaerror: event?.queryStringParameters?.loa,
    cookies: event?.cookies?.join(';'),
  };
}

export async function handler (event: APIGatewayProxyEventV2) {
  try {
    const params = parseEvent(event);
    const response = await handleLoginRequest(params, dynamoDBClient);
    return response;
  } catch (err) {
    console.error(err);
    return Response.error();
  }
};