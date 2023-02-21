import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';
import { OpenIDConnect } from '../code/OpenIDConnect';

export async function handleRequest(
  cookies: string,
  queryStringParamCode: string,
  queryStringParamState: string,
  dynamoDBClient: DynamoDBClient,
  logger: Logger,
) {
  let session = new Session(cookies, dynamoDBClient);
  await session.init();
  if (session.sessionId === false) {
    logger.info('No session found');
    return Response.redirect('/login');
  }
  const state = session.getValue('state');
  const OIDC = new OpenIDConnect();
  try {
    const claims = await OIDC.authorize(queryStringParamCode, state, queryStringParamState);
    logger.debug('OIDC Claims', claims); // Log in debug to see the claims (set by LOG_LEVEL, see powertools)
    if (claims) {
      await session.createSession({
        loggedin: { BOOL: true },
        bsn: { S: claims.sub },
      });
    } else {
      logger.info('Authentication failed');
      return Response.redirect('/login');
    }
  } catch (error: any) {
    logger.info('Authentication failed');
    logger.error(error.message);
    return Response.redirect('/login');
  }
  logger.info('Authentication successful');
  return Response.redirect('/', 302, session.getCookie());
}
