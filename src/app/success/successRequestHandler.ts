import * as crypto from 'crypto';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';

/**
 * Check login and handle request
 */
export async function successRequestHandler(cookies: string, dynamoDBClient: DynamoDBClient) {
  let session = new Session(cookies, dynamoDBClient);
  await session.init();
  if (session.isLoggedIn() == true) {
    return handleLoggedinRequest(session, dynamoDBClient);
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
async function handleLoggedinRequest(session: Session, dynamoDBClient: DynamoDBClient) {

  const subject = session.getValue('bsn', 'S');
  const gemeente = session.getValue('gemeente', 'S');
  const timestamp = Date.now();
  const ttl = new Date().setFullYear(new Date().getFullYear()+1).toString();

  // Log the issue event
  await registerIssueEvent(dynamoDBClient, subject, gemeente, timestamp, ttl);

  return Response.json({ message: 'success' });
}

/**
 * Logs the issue event for collecting statistics one usage of the irma-issue-app
 * @param dynamoDBClient dynamodbclient
 * @param bsn hashed BSN from session
 * @param gemeente municipality from session
 * @param timestamp event time
 * @param ttl time to live in DynamoDB table
 */
async function registerIssueEvent(dynamoDBClient: DynamoDBClient, bsn: string, gemeente:string, timestamp:number, ttl:string) {

  const subject = crypto.createHash('sha256').update(bsn).digest('hex');
  try {
    const log = new PutItemCommand({
      Item: {
        subject: { S: subject },
        timestamp: { N: timestamp.toString() },
        gemeente: { S: gemeente },
        ttl: { N: ttl },
      },
      TableName: process.env.STATISTICS_TABLE,
    });

    await dynamoDBClient.send(log);
  } catch (err) {
    console.log('Could not add issue statistics', err);
  }
}