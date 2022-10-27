import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { successRequestHandler } from './successRequestHandler';

const dynamoDBClient = new DynamoDBClient({});


function parseEvent(event: any) {
  return {
    cookies: event?.cookies?.join(';'),
  };
}

exports.handler = async (event: any) => {
  try {
    const params = parseEvent(event);

    return await successRequestHandler(params.cookies, dynamoDBClient);

  } catch (err) {
    console.error(err);
    return Response.error();
  }
};