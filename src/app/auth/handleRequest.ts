import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';
import { IdTokenClaims } from 'openid-client';
import { DigidLoa } from '../code/DigiDLoa';
import { OpenIDConnect } from '../code/OpenIDConnect';

export async function handleRequest(
  cookies: string,
  queryStringParamCode: string,
  queryStringParamState: string,
  dynamoDBClient: DynamoDBClient,
  OIDC: OpenIDConnect,
) {
  let session = new Session(cookies, dynamoDBClient);
  await session.init();
  if (session.sessionId === false) {
    console.info('No session found');
    return Response.redirect('/login');
  }
  const state = session.getValue('state');
  try {
    const claims = await OIDC.authorize(queryStringParamCode, state, queryStringParamState);
    return await authenticate(session, claims);
  } catch (error: any) {
    console.error(error.message);
    return Response.redirect('/login');
  }
}

/**
 * Try to authenticate a user based on the OIDC claims, register
 * in the session and send a redirect to the main page.
 * @param session session object
 * @param claims the OIDC claims
 * @param logger logging
 * @returns
 */
async function authenticate(session: Session, claims: IdTokenClaims) {
  if (claims && claims.hasOwnProperty('acr')) {
    const loa = claims.acr;
    if ( loa == DigidLoa.Basis) {
      console.error('Authentication using DigiD loa Basis is used');
      return Response.redirect('/login?loa=true'); // TODO fix flag name to include error
    }
    await session.createSession({
      loggedin: { BOOL: true },
      bsn: { S: claims.sub },
      loa: { S: loa },
    });
    console.info('Authentication successful', loa);
  } else {
    console.error('Insufficient OIDC claims');
    return Response.redirect('/login');
  }
  return Response.redirect('/', 302, session.getCookie());
}