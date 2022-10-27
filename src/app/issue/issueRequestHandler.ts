import * as crypto from 'crypto';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { ApiClient } from '@gemeentenijmegen/apiclient';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';
import { IrmaApi } from '../code/IrmaApi';
import render from '../code/Render';
import { BrpApi } from './BrpApi';
import * as template from './issue.mustache';

/**
 * Check login and handle request
 */
export async function issueRequestHandler(cookies: string, brpClient: ApiClient, irmaApi: IrmaApi, dynamoDBClient: DynamoDBClient) {
  let session = new Session(cookies, dynamoDBClient);
  await session.init();
  if (session.isLoggedIn() == true) {
    return handleLoggedinRequest(session, brpClient, irmaApi, dynamoDBClient);
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
async function handleLoggedinRequest(session: Session, brpClient: ApiClient, irmaApi: IrmaApi, dynamoDBClient: DynamoDBClient) {
  // BRP request
  const bsn = session.getValue('bsn');
  const brpApi = new BrpApi(brpClient);
  const brpData = await brpApi.getBrpData(bsn);
  const naam = brpData?.Persoon?.Persoonsgegevens?.Naam ? brpData.Persoon.Persoonsgegevens.Naam : 'Onbekende gebruiker';

  let error = undefined;
  if (brpData.error) {
    error = 'Het ophalen van uw persoonsgegevens is mis gegaan.';
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
    await registerIssueEvent(brpData, dynamoDBClient);
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
 */
async function registerIssueEvent(brpData: any, dynamoDBClient: DynamoDBClient) {
  const subject = crypto.createHash('sha256').update(brpData.Persoon.BSN.BSN).digest('hex');
  const timestamp = Date.now();
  const gemeente = brpData.Persoon.Adres.Gemeente;
  const ttl = new Date().setFullYear(new Date().getFullYear()+1).toString();

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