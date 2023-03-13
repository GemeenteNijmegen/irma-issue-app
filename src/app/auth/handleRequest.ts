import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';
import { IdTokenClaims } from 'openid-client';
import { OpenIDConnect } from '../code/OpenIDConnect';

// DigiD levels of assurance
const DigiD_LOA_BASIC = 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport';
// const DigiD_LOA_MIDDEN = 'urn:oasis:names:tc:SAML:2.0:ac:classes:MobileTwoFactorContract';
// const DigiD_LOA_Substantieel = 'urn:oasis:names:tc:SAML:2.0:ac:classes:Smartcard';
// const DigiD_LOA_HOOG = 'urn:oasis:names:tc:SAML:2.0:ac:classes:SmartcardPKI';

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
    return await authenticate(session, claims, logger);
  } catch (error: any) {
    return fail(logger, error.message, undefined, 'error');
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
async function authenticate(session: Session, claims: IdTokenClaims, logger: Logger) {
  if (claims && claims.hasOwnProperty('acr')) {
    const loa = claims.acr;
    if ( loa == DigiD_LOA_BASIC) {
      return fail(logger, 'Insufficient OIDC claims', 'loa');
    }
    await session.createSession({
      loggedin: { BOOL: true },
      bsn: { S: claims.sub },
    });
    logger.info('Authentication successful', { loa });
  } else {
    return fail(logger, 'Insufficient OIDC claims');
  }
  return Response.redirect('/', 302, session.getCookie());
}

/**
 * Log the failed authentication attempt including the reason
 * and redirect the user to the loging page (optionally
 * with a url param flag)
 * @param logger
 * @param reason log the reason authentication failed
 * @param flag url pagameter with true value (error handling)
 * @returns
 */
function fail(logger: Logger, reason: string, flag?: string, error?: 'error') {
  let url = '/login';
  if (flag) {
    url += `?${flag}=true`;
  }
  if (error) {
    logger.error('Authentication failed', { reason });
  } else {
    logger.info('Authentication failed', { reason });
  }
  return Response.redirect(url);
}