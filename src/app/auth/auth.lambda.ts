import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { handleRequest } from './handleRequest';

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
    return await handleRequest(params.cookies, params.code, params.state, dynamoDBClient);
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
    };
  }
};