import { AttributeValue, DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import Mustache from 'mustache';
import template from './report.mustache';

export async function handleReporting(sesClient: SESClient, dynamoDBClient: DynamoDBClient, recipients: string[]) {

  const ytd = new Date().setFullYear(new Date().getFullYear() - 1).toString();

  let query = createCommand(ytd);
  let result = await dynamoDBClient.send(query);

  console.debug('Updating statistics with new data', JSON.stringify(result, null, 4));

  while (result.LastEvaluatedKey) {
    // Next query calculate further statistics
    query = createCommand(ytd, result.LastEvaluatedKey);
    result = await dynamoDBClient.send(query);

    console.debug('Updating statistics with new data', JSON.stringify(result, null, 4));
  }


  // Do dynamodb query (yesterday)
  // Do dynamodb query (this month)
  // Do dynamodb query (this year)
  // calculate statistics
  // Calculate nr of issuances with same bsn

  const data = {}; // TODO fill with statistics from above.

  const report = renderReport(data);
  await sendReportViaMail(sesClient, report, recipients);

}

function createCommand(ytd: string, lastEvaluatedKey?: Record<string, AttributeValue>) {
  return new ScanCommand({
    TableName: process.env.STATISTICS_TABLE,
    ExclusiveStartKey: lastEvaluatedKey,
    ScanFilter: {
      timestamp: {
        ComparisonOperator: 'GT',
        AttributeValueList: [
          { N: ytd.toString() },
        ],
      },
    },
  });
}

function renderReport(data: any) {
  return Mustache.render(template, data);
}

async function sendReportViaMail(client: SESClient, body: string, recipients: string[]) {

  const sendEmail = new SendEmailCommand({
    Destination: {
      ToAddresses: recipients,
    },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: 'IRMA Issue Statistics',
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: body,
        },
      },
    },
    Source: 'gemeente@accp.csp-nijmegen.nl',
  });

  await client.send(sendEmail);

}