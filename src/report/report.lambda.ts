import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SESClient } from '@aws-sdk/client-ses'
import { AwsUtil } from '../app/code/AwsUtil';
import { handleReporting } from './reportRequestHandler';

const dynamoDBClient = new DynamoDBClient({region: 'eu-west-1'});
const sesClient = new SESClient({region: 'eu-west-1'});
let recipients: string[] = [];

async function init() {
  if(!process.env.RECIPIENTS_LIST){
    throw Error("process.env.RECIPIENTS_LIST not set!");
  }
  const util = new AwsUtil();
  const recipientsList = await util.getParameter(process.env.RECIPIENTS_LIST);
  recipients = recipientsList ? recipientsList.split('\n') : [];
}

const initialization = init();

exports.handler = async () => {
  try {
    await initialization;
    await handleReporting(sesClient, dynamoDBClient, recipients);
  } catch (err) {
    console.error(err);
  }
};