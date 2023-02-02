import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ApiClient } from '@gemeentenijmegen/apiclient';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';
import { BrpApi } from './BrpApi';
import * as template from './issue.mustache';
import render from '../code/Render';
import { YiviApi } from '../code/YiviApi';

/**
 * Check login and handle request
 */
export async function issueRequestHandler(cookies: string, brpClient: ApiClient, yiviApi: YiviApi, dynamoDBClient: DynamoDBClient) {
  let session = new Session(cookies, dynamoDBClient);
  await session.init();
  if (session.isLoggedIn() == true) {
    return handleLoggedinRequest(session, brpClient, yiviApi);
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
async function handleLoggedinRequest(session: Session, brpClient: ApiClient, yiviApi: YiviApi) {
  let error = undefined;

  // If issuing already is completed
  if (session.getValue('issued', 'BOOL')) {
    error = 'Om uw gegevens nog een keer in te laden dient u eerst uit te loggen';
  }

  // BRP request
  let naam = 'Onbekende gebruiker';
  let brpData = undefined;
  if (!error) {
    const bsn = session.getValue('bsn');
    const brpApi = new BrpApi(brpClient);
    brpData = await brpApi.getBrpData(bsn);
    naam = brpData?.Persoon?.Persoonsgegevens?.Naam ?? naam;
    if (brpData.error) {
      error = 'Het ophalen van uw persoonsgegevens is mis gegaan.';
    }
  }

  // Start YIVI session
  let yiviSession = undefined;
  if (!error) {
    const yiviResponse = await yiviApi.startSession(brpData);
    console.debug('YIVI session: ', yiviResponse);
    if (!yiviResponse.error) {
      yiviSession = {
        yiviSessionPtrQr: yiviResponse.sessionPtr.irmaqr,
        yiviSessionPtrU: yiviResponse.sessionPtr.u,
      };
    } else {
      error = 'Er is iets mis gegaan bij het inladen van uw persoonsgegevens in YIVI.';
    }
  }

  // Log the issue event
  if (!error) {
    await storeIssueEventInSession(brpData, session);
  }

  // Render the page
  const data = {
    title: 'opladen',
    shownav: true,
    volledigenaam: naam,
    yiviServer: `https://${yiviApi.getHost()}`,
    error: error,
    ...yiviSession,
  };
  console.debug('Rendering page with data:', data);
  const html = await render(data, template.default);
  return Response.html(html, 200, session.getCookie());
}

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
