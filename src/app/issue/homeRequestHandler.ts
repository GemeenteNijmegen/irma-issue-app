import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ApiClient } from '@gemeentenijmegen/apiclient';
import { Session } from '@gemeentenijmegen/session';
import { IrmaApi } from '../code/IrmaApi';
import render from '../code/Render';
import * as template from '../templates/issue.mustache';
import { BrpApi } from './BrpApi';


function redirectResponse(location: string, code = 302) {
  return {
    statusCode: code,
    body: '',
    headers: {
      Location: location,
    },
  };
}

export async function homeRequestHandler(cookies: string, brpClient: ApiClient, irmaApi: IrmaApi, dynamoDBClient: DynamoDBClient) {
  let session = new Session(cookies, dynamoDBClient);
  await session.init();
  if (session.isLoggedIn() == true) {
    return handleLoggedinRequest(session, brpClient, irmaApi);
  }
  return redirectResponse('/login');
}

async function handleLoggedinRequest(session: Session, brpClient: ApiClient, irmaApi: IrmaApi) {
  // BRP request
  const bsn = session.getValue('bsn');
  const brpApi = new BrpApi(brpClient);
  const brpData = await brpApi.getBrpData(bsn);
  const naam = brpData?.Persoon?.Persoonsgegevens?.Naam ? brpData.Persoon.Persoonsgegevens.Naam : 'Onbekende gebruiker';

  let brpFailed = naam == 'Onbekende gebruiker';
  let irmaFailed = false;
  let irmaSession = {
    irmaSessionPtrU: undefined,
    irmaSessionPtrQr: undefined,
    irmaSessionToken: undefined,
  };
  if (!brpFailed) {
    // Start IRMA session
    const irmaResponse = await irmaApi.startSession(brpData);
    if (!irmaResponse || irmaResponse.error) {
      irmaFailed = true;
    } else {
      irmaSession.irmaSessionPtrQr = irmaResponse.sessionPtr.irmaqr;
      irmaSession.irmaSessionPtrU = irmaResponse.sessionPtr.u;
      irmaSession.irmaSessionToken = irmaResponse.token;
    }
  }

  const data = {
    title: 'opladen',
    shownav: true,
    volledigenaam: naam,
    irmaServer: `https://${irmaApi.getHost()}`,
    sessionResultEndpoint: `${process.env.APPLICATION_URL_BASE}result`,
    brpfailed: brpFailed,
    irmaFailed: irmaFailed,
    ...irmaSession,
  };

  // render page
  const html = await render(data, template.default);

  return {
    statusCode: 200,
    body: html,
    headers: {
      'Content-type': 'text/html',
    },
    cookies: [
      session.getCookie(),
    ],
  };
}

