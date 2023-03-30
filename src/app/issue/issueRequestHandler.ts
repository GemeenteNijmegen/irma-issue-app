import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';
import { BrpApi } from './BrpApi';
import * as template from './issue.mustache';
import render from '../code/Render';
import { YiviApi } from '../code/YiviApi';

/**
 * Check login and handle request
 */
export async function issueRequestHandler(cookies: string, brpApi: BrpApi, yiviApi: YiviApi, dynamoDBClient: DynamoDBClient) {
  let session = new Session(cookies, dynamoDBClient);
  await session.init();
  if (session.isLoggedIn() == true) {
    return handleLoggedinRequest(session, brpApi, yiviApi);
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
async function handleLoggedinRequest(session: Session, brpApi: BrpApi, yiviApi: YiviApi) {
  let error = undefined;

  // If issuing already is completed
  // TODO kan misschien weg omdat de callback de user al uitlogt (kan dus niet voorkomen)
  if (session.getValue('issued', 'BOOL')) {
    error = 'Om uw gegevens nog een keer in te laden dient u eerst uit te loggen.';
  }

  // BRP request
  let naam = undefined;
  let brpData = undefined;
  if (!error) {
    const bsn = session.getValue('bsn');
    brpData = await brpApi.getBrpData(bsn);
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

  // Log the issue event
  if (!error) {
    await storeIssueEventInSession(brpData, session);
  }

  // Render the page
  const data = {
    title: 'opladen',
    shownav: true, // TODO check if still required
    volledigenaam: naam, // TODO check if still required
    yiviServer: `https://${yiviApi.getHost()}`,
    error: error,
    yiviFullSession: yiviFullSession,
  };
  const html = await render(data, template.default);
  return Response.html(html, 200, session.getCookie());
}

// TODO update docs
/**
 * Logs the issue event for collecting statistics one usage of the yivi-issue-app
 * @param brpData the BRP-YIVI api response
 * @param session the uses session to store data in
 */
async function storeIssueEventInSession(brpData: any, session: Session) {
  const gemeente = brpData.Persoon.Adres.Gemeente;
  const loggedin = session.getValue('loggedin', 'BOOL') ?? false;

  try {
    await session.updateSession({
      loggedin: { BOOL: loggedin },
      bsn: { S: brpData.Persoon.BSN.BSN },
      gemeente: { S: gemeente },
    });
  } catch (err) {
    console.log('Could not add issue statistics to session', err);
  }
}
