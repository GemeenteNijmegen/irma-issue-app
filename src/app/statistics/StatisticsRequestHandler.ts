import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
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

  async handleStatisticsDataRequest() {

    // Query dynamodb


    // Expected data
    const data = {
      '2024-05-19': 13,
    };

    return Response.json(data, 200);
  }

}

