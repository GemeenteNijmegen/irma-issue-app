import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';
import * as cookie from 'cookie';
import * as template from './logout.mustache';
import render from '../code/Render';

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

  return Response.html(html, 200, emptyCookie);
}
