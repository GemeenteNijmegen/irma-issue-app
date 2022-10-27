import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { callbackRequestHandler } from './callbackRequestHandler';

const dynamoDBClient = new DynamoDBClient({});


function parseEvent(event: APIGatewayProxyEventV2) {
  return {
    cookies: event?.cookies?.join(';') ?? '',
    result: event?.queryStringParameters?.result ?? 'success',
  };
}

exports.handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const params = parseEvent(event);

    return await callbackRequestHandler(params.cookies, params.result, dynamoDBClient);

  } catch (err) {
    console.error(err);
    return Response.error();
  }
};