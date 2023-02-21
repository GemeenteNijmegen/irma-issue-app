import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';
import * as template from './login.mustache';
import { OpenIDConnect } from '../code/OpenIDConnect';
import render from '../code/Render';

export async function handleLoginRequest(params: any, dynamoDBClient: DynamoDBClient) {
  let session = new Session(params.cookies, dynamoDBClient);
  await session.init();
  if (session.isLoggedIn() === true) {
    console.debug('redirect to home');
    return Response.redirect('/');
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
    logos: true,
    loaerror: params.loaerror,
  };
  const html = await render(data, template.default);
  const newCookies = [session.getCookie()];
  return Response.html(html, 200, newCookies);
}
