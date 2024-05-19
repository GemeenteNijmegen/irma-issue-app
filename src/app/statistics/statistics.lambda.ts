import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { StatisticsRequestHandler } from './StatisticsRequestHandler';

const dynamoDBClient = new DynamoDBClient({});
const handler = new StatisticsRequestHandler(dynamoDBClient);

function parseEvent(event: APIGatewayProxyEventV2) {
  return {
    data: event.queryStringParameters?.data !== undefined,
  };
}

exports.handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const params = parseEvent(event);
    if (params.data) {
      await handler.handleStatisticsDataRequest();
    }
    return await handler.handleStatisticsRequest();
  } catch (err) {
    console.error(err);
    return Response.error();
  }
};