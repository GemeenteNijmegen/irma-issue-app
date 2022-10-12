import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { handleLogoutRequest } from './handleLogoutRequest';

const dynamoDBClient = new DynamoDBClient({});

function parseEvent(event: any) {
  return {
    cookies: event?.cookies?.join(';'),
  };
}

exports.handler = async (event: any) => {
  try {
    const params = parseEvent(event);
    return await handleLogoutRequest(params.cookies, dynamoDBClient);
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
    };
  }
};