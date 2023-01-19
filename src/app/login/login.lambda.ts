import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { handleLoginRequest } from './loginRequestHandler';

const dynamoDBClient = new DynamoDBClient({});

function parseEvent(event: any) {
  return { cookies: event?.cookies?.join(';') };
}

export async function handler (event:any) {
  try {
    const params = parseEvent(event);
    const response = await handleLoginRequest(params.cookies, dynamoDBClient);
    return response;
  } catch (err) {
    console.error(err);
    return Response.error();
  }
};