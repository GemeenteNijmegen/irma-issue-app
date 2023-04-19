import * as crypto from 'crypto';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';
import { BrpApi } from './BrpApi';
import * as template from './issue.mustache';
import { loaToString } from '../code/DigiDLoa';
import { LogsUtil } from '../code/LogsUtil';
import render from '../code/Render';
import { YiviApi } from '../code/YiviApi';

/**
 * Check login and handle request
 */
export async function issueRequestHandler(
  cookies: string,
  brpApi: BrpApi,
  yiviApi: YiviApi,
  dynamoDBClient: DynamoDBClient,
  logsClient: CloudWatchLogsClient,
) {

  let session = new Session(cookies, dynamoDBClient);
  await session.init();
  if (session.isLoggedIn() == true) {
    return handleLoggedinRequest(session, brpApi, yiviApi, logsClient);
  }
  return Response.redirect('/login');
}

/**
 * Request persoonsgegevens form BRP send them to the YIVI server
 * logs the issue event and passes the yivi sessionPtr to the render.
 * @param session
 * @param brpClient
 * @param yiviApi
 * @returns
 */
async function handleLoggedinRequest(session: Session, brpApi: BrpApi, yiviApi: YiviApi, logsClient: CloudWatchLogsClient) {
  let error = undefined;

  // BRP request
  let naam = undefined;
  let brpData = undefined;
  if (!error) {
    const bsn = session.getValue('bsn');
    brpData = await brpApi.getBrpData(bsn);
    await LogsUtil.logToCloudWatch(logsClient, 'TICK: BRP', process.env.TICKEN_LOG_GROUP_NAME, process.env.TICKEN_LOG_STREAM_NAME);
    naam = brpData?.Persoon?.Persoonsgegevens?.Naam;
    if (brpData.error || !naam) {
      error = 'Het ophalen van uw persoonsgegevens is mis gegaan. Propeer het later opnieuw.';
    }
  }

  // Start YIVI session
  let yiviFullSession = undefined;
  if (!error) {
    console.debug('Starting YIVI session...');
    const loa = session.getValue('loa');
    const yiviResponse = await yiviApi.startSession(brpData, loa);
    console.debug('YIVI session: ', yiviResponse);
    if (!yiviResponse.error) {
      yiviFullSession = Buffer.from(JSON.stringify(yiviResponse), 'utf-8').toString('base64');
    } else {
      error = 'Er is iets mis gegaan bij het inladen van uw persoonsgegevens in Yivi. Probeer het later opnieuw';
    }
  }

  await storeIssueEventInSession(session);
  await logIssueEvent(logsClient, session, brpData, error);

  // Render the page
  const data = {
    title: 'opladen',
    yiviServer: `https://${yiviApi.getHost()}`,
    error: error,
    yiviFullSession: yiviFullSession,
  };
  const html = await render(data, template.default);
  return Response.html(html, 200, session.getCookie());
}

/**
 * Add the requred issue event data to the sessino for
 * collecting statistics one usage of the yivi-issue-app later on
 * @param session the uses session to store data in
 */
async function storeIssueEventInSession(session: Session) {
  const loggedin = session.getValue('loggedin', 'BOOL') ?? false;
  const loa = session.getValue('loa');
  const bsn = session.getValue('bsn');
  let issueAttempt = session.getValue('issueAttempt', 'N') ?? '0';
  const incrementedIssueAttempt = parseInt(issueAttempt) + 1;

  try {
    await session.updateSession({
      loggedin: { BOOL: loggedin },
      bsn: { S: bsn },
      loa: { S: loa },
      issueAttempt: { N: incrementedIssueAttempt.toString() },
    });
  } catch (err) {
    console.log('Could not add issue statistics to session', err);
  }
}

/**
 * Log the issue event to a separate log group
 * @param client
 * @param session
 * @param brpData
 * @param error
 */
async function logIssueEvent(client: CloudWatchLogsClient, session: Session, brpData: any, error?: string) {

  // Setup statistics data
  const bsn = session.getValue('bsn', 'S');
  const loa = loaToString(session.getValue('loa'));
  const issueAttempt = session.getValue('issueAttempt', 'N') ?? 0;
  const gemeente = brpData?.Persoon?.Adres?.Gemeente;
  const timestamp = Date.now();
  const diversify = `${bsn}/${gemeente}/${process.env.DIVERSIFYER}`;
  const subject = crypto.createHash('sha256').update(diversify).digest('hex');

  let message = JSON.stringify({ timestamp, gemeente, subject, loa, issueAttempt });
  if (error) {
    message = JSON.stringify({ timestamp, loa, issueAttempt, error });
  }

  const group = process.env.STATISTICS_LOG_GROUP_NAME;
  const stream = process.env.STATISTICS_LOG_STREAM_NAME;
  await LogsUtil.logToCloudWatch(client, message, group, stream);

}