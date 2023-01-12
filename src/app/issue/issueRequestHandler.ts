import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ApiClient } from '@gemeentenijmegen/apiclient';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';
import { BrpApi } from './BrpApi';
import * as template from './issue.mustache';
import { IrmaApi } from '../code/IrmaApi';
import render from '../code/Render';

/**
 * Check login and handle request
 */
export async function issueRequestHandler(cookies: string, brpClient: ApiClient, irmaApi: IrmaApi, dynamoDBClient: DynamoDBClient) {
  let session = new Session(cookies, dynamoDBClient);
  await session.init();
  if (session.isLoggedIn() == true) {
    return handleLoggedinRequest(session, brpClient, irmaApi);
  }
  return Response.redirect('/login');
}

/**
 * Request persoonsgegevens form BRP send them to the IRMA server
 * logs the issue event and passes the irma sessionPtr to the render.
 * @param session
 * @param brpClient
 * @param irmaApi
 * @returns
 */
async function handleLoggedinRequest(session: Session, brpClient: ApiClient, irmaApi: IrmaApi) {
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

  // Start IRMA session
  let irmaSession = undefined;
  if (!error) {
    const irmaResponse = await irmaApi.startSession(brpData);
    if (!irmaResponse.error) {
      irmaSession = {
        irmaSessionPtrQr: irmaResponse.sessionPtr.irmaqr,
        irmaSessionPtrU: irmaResponse.sessionPtr.u,
      };
    } else {
      error = 'Er is iets mis gegaan bij het inladen van uw persoonsgegevens in IRMA.';
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
    irmaServer: `https://${irmaApi.getHost()}`,
    error: error,
    ...irmaSession,
  };
  const html = await render(data, template.default);
  return Response.html(html, 200, session.getCookie());
}

/**
 * Logs the issue event for collecting statistics one usage of the irma-issue-app
 * @param brpData the BRP-IRMA api response
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
