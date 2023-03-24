import * as crypto from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';

/**
 * Check login and handle request
 */
export async function callbackRequestHandler(params: any, dynamoDBClient: DynamoDBClient) {
  let session = new Session(params.cookies, dynamoDBClient);
  await session.init();
  if (session.isLoggedIn() == true) {
    return handleLoggedinRequest(session, params);
  }
  return Response.error(403);
}

/**
 * Request persoonsgegevens form BRP send them to the YIVI server
 * logs the issue event and passes the yivi sessionPtr to the render.
 * @param session the session object
 * @param params the http request parameters
 * @returns
 */
async function handleLoggedinRequest(session: Session, params: any) {
  const bsn = session.getValue('bsn', 'S');
  const gemeente = session.getValue('gemeente', 'S');
  const loa = session.getValue('loa', 'S');
  const timestamp = Date.now();
  const success = params.result == 'success';
  const error = params.error;

  // Log the issue event
  await registerIssueEvent(bsn, gemeente, loa, success, timestamp, error);
  if (success) {
    // Only disable the session if the issueing was successful.
    await updateSessionStatus(session);
  }
  return Response.json({ message: 'success' });
}

/**
 * Logs the issue event for collecting statistics one usage of the yivi-issue-app
 * @param bsn hashed BSN from session
 * @param gemeente municipality from session
 * @param timestamp event time
 * @param errorMessage optional error message from frontend
 */
async function registerIssueEvent(
  bsn: string,
  gemeente: string,
  loa: string,
  success: boolean,
  timestamp: number,
  errorMessage?: string,
) {
  // Combine with gemeente and key value to make more unique
  const diversify = `${bsn}/${gemeente}/${process.env.DIVERSIFYER}`;
  const subject = crypto.createHash('sha256').update(diversify).digest('hex');

  let error = undefined;
  if (errorMessage) { // Trim errorMessage if needed
    const msg =
      errorMessage.length > 200
        ? errorMessage.substring(0, 200)
        : errorMessage;
    error = { error: { S: msg } };
  }

  // Important! This logs the issue event (success/failure) for this lambda,
  // this log is used to construct the CloudWatch dashboard
  console.log({ subject, timestamp, gemeente, loa, success, error: error?.error.S });
}

/**
 * Clean the date for this issue request from the session after logging it
 * Note this also destroys the users session as loggedin is not set anymore
 * @param session Session object
 */
async function updateSessionStatus(session: Session) {
  try {
    await session.updateSession({
      issued: { BOOL: true },
    });
  } catch (err) {
    console.log('Could not update session', err);
  }
}