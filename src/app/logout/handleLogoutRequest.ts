import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Session } from '@gemeentenijmegen/session';
import * as cookie from 'cookie';
import render from '../code/Render';

import * as template from './logout.mustache';

function htmlResponse(body: string, cookies: string[] = []) {
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

export async function handleLogoutRequest(cookies: string, dynamoDBClient: DynamoDBClient) {
  let session = new Session(cookies, dynamoDBClient);
  if (await session.init()) {
    await session.updateSession({
      loggedin: { BOOL: false },
    });
  }

  const html = await render({ title: 'Uitgelogd' }, template.default);
  const emptyCookie = cookie.serialize('session', '', {
    httpOnly: true,
    secure: true,
  });
  return htmlResponse(html, [emptyCookie]);
}
