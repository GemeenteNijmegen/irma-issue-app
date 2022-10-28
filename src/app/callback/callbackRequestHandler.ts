import * as crypto from 'crypto';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';

/**
 * Check login and handle request
 */
export async function callbackRequestHandler(params: any, dynamoDBClient: DynamoDBClient) {
  let session = new Session(params.cookies, dynamoDBClient);
  await session.init();
  if (session.isLoggedIn() == true) {
    return handleLoggedinRequest(session, params, dynamoDBClient);
  }
  return Response.error(403);
}

/**
 * Request persoonsgegevens form BRP send them to the IRMA server
 * logs the issue event and passes the irma sessionPtr to the render.
 * @param session
 * @param dynamoDBClient
 * @returns
 */
async function handleLoggedinRequest(session: Session, params: any, dynamoDBClient: DynamoDBClient) {

  if (session.getValue('issued', 'BOOL')) {
    return;
  }

  const bsn = session.getValue('bsn', 'S');
  const gemeente = session.getValue('gemeente', 'S');
  const timestamp = Date.now();
  const ttl = new Date().setFullYear(new Date().getFullYear() + 1).toString();
  const success = params.result == 'success';
  const error = params.error;

  // Log the issue event
  await registerIssueEvent(dynamoDBClient, bsn, gemeente, success, timestamp, ttl, error);
  await updateSessionStatus(session, bsn);
  return Response.json({ message: 'success' });

}

/**
 * Logs the issue event for collecting statistics one usage of the irma-issue-app
 * @param dynamoDBClient dynamodbclient
 * @param bsn hashed BSN from session
 * @param gemeente municipality from session
 * @param timestamp event time
 * @param ttl time to live in DynamoDB table
 * @param errorMessage optional error message from frontend
 */
async function registerIssueEvent(
  dynamoDBClient: DynamoDBClient,
  bsn: string,
  gemeente: string,
  success: boolean,
  timestamp: number,
  ttl: string,
  errorMessage?: string,
) {
  const subject = crypto.createHash('sha256').update(bsn).digest('hex');

  let error = undefined;
  if (errorMessage) { // Trim errorMessage if needed
    const msg =
      errorMessage.length > 200
        ? errorMessage.substring(0, 200)
        : errorMessage;
    error = { error: { S: msg } };
  }

  try {
    const log = new PutItemCommand({
      Item: {
        subject: { S: subject },
        timestamp: { N: timestamp.toString() },
        gemeente: { S: gemeente },
        success: { BOOL: success },
        ttl: { N: ttl },
        ...error,
      },
      TableName: process.env.STATISTICS_TABLE,
    });
    await dynamoDBClient.send(log);
  } catch (err) {
    console.log('Could not add issue statistics', err);
  }
}

/**
 * Clean the date for this issue request from the session after logging it
 * @param session Session object
 * @param bsn BSN from session
 */
async function updateSessionStatus(session: Session, bsn: string) {
  try {
    await session.updateSession({
      bsn: { S: bsn },
      issued: { BOOL: true },
    });
  } catch (err) {
    console.log('Could not update session', err);
  }
}