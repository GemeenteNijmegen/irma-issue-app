import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import Mustache from 'mustache';
import template from './report.mustache';

export async function handleReporting(sesClient: SESClient, dynamoDBClient: DynamoDBClient, recipients: string[]){

  console.log(dynamoDBClient.config.apiVersion);
  // Do dynamodb query (yesterday)
  // Do dynamodb query (this month)
  // Do dynamodb query (this year)
  // calculate statistics
  // Calculate nr of issuances with same bsn

  const data = {}; // TODO fill with statistics from above.

  const report = renderReport(data);
  await sendReportViaMail(sesClient, report, recipients);

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
      Subject:  {
        Charset: 'UTF-8',
        Data: 'IRMA Issue Statistics',
      },
      Body: { 
        Html: {
          Charset: "UTF-8",
          Data: body
        },
      },
    },
    Source: 'gemeente@accp.csp-nijmegen.nl'
  });

  await client.send(sendEmail)

}