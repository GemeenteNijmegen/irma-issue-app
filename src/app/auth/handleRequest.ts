import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';
import { OpenIDConnect } from '../code/OpenIDConnect';

export async function handleRequest(cookies: string, queryStringParamCode: string, queryStringParamState: string, dynamoDBClient: DynamoDBClient) {
  let session = new Session(cookies, dynamoDBClient);
  await session.init();
  if (session.sessionId === false) {
    return Response.redirect('/login');
  }
  const state = session.getValue('state');
  const OIDC = new OpenIDConnect();
  try {
    const claims = await OIDC.authorize(queryStringParamCode, state, queryStringParamState);
    if (claims) {
      await session.createSession({
        loggedin: { BOOL: true },
        bsn: { S: claims.sub },
      });
    } else {
      return Response.redirect('/login');
    }
  } catch (error: any) {
    console.error(error.message);
    return Response.redirect('/login');
  }
  return Response.redirect('/', 302, session.getCookie());
}
