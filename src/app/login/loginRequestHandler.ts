import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Session } from '@gemeentenijmegen/session';
import { OpenIDConnect } from '../code/OpenIDConnect';
import render from '../code/Render';

import * as template from '../templates/login.mustache';

function redirectResponse(location: string, status = 302) {
  const response = {
    statusCode: status,
    headers: {
      Location: location,
    },
  };
  return response;
}
function htmlResponse(body: string, cookies: string[]=[]) {
  const response = {
    statusCode: 200,
    body: body,
    headers: {
      'Content-type': 'text/html',
    },
    cookies: cookies,
  };
  return response;
}

export async function handleLoginRequest(cookies: string, dynamoDBClient: DynamoDBClient) {
  let session = new Session(cookies, dynamoDBClient);
  await session.init();
  if (session.isLoggedIn() === true) {
    console.debug('redirect to home');
    return redirectResponse('/');
  }
  let OIDC = new OpenIDConnect();
  const state = OIDC.generateState();
  await session.createSession({
    loggedin: { BOOL: false },
    state: { S: state },
  });
  const authUrl = OIDC.getLoginUrl(state);

  const data = {
    title: 'Inloggen',
    authUrl: authUrl,
  };
  const html = await render(data, template.default);
  const newCookies = [session.getCookie()];
  return htmlResponse(html, newCookies);
}
