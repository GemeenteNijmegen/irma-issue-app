import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import * as template from './statistics.mustache';
import render from '../code/Render';

export class StatisticsRequestHandler {
  private readonly dynamoDBClient;
  constructor(dynamoDBClient: DynamoDBClient) {
    this.dynamoDBClient = dynamoDBClient;
  }

  async handleStatisticsRequest() {
    const html = await render({ title: 'Statistieken' }, template.default);
    return Response.html(html, 200);
  }

  async handleStatisticsDataRequest(type: string) {

    // Only allow monthly and annual requests
    if (type !== 'month' && type !== 'year') {
      throw Error('Only month and year are supported date scopes');
    }

    // Set a max number of items to be returned
    const limit = 12;

    // Query dynamodb
    const query = await this.dynamoDBClient.send(new QueryCommand({
      TableName: process.env.TABLE_NAME!,
      KeyConditionExpression: '#type = :type',
      ExpressionAttributeValues: {
        ':type': { S: type },
      },
      ExpressionAttributeNames: { '#type': 'type' },
      Limit: limit,
      ScanIndexForward: false,
    }));

    const data: Record<string, number> = {};

    query.Items?.forEach(item => {
      const label = item.date.S;
      const count = item.value.N;
      if (!label || !count) {
        return;
      }
      data[label] = parseInt(count);
    });

    return Response.json(data, 200);
  }

}

