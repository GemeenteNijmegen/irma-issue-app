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

  if (naam == 'Onbekende gebruiker') {
    // TODO fout afhandelen geen BRP data om uit te geven...
    throw Error('Kon BRP data niet ophalen...');
  }

  // Start IRMA session
  const irmaSession = irmaApi.startSession(brpData);

  const data = {
    title: 'overzicht',
    shownav: true,
    volledigenaam: naam,
    irmaSession: JSON.stringify(irmaSession),
    irmaServer: `https://${irmaApi.getHost()}`,
    sessionResultEndpoint: `https://${process.env.APPLICATION_URL_BASE}/result`,
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

