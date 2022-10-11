import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Session } from '@gemeentenijmegen/session';
import { OpenIDConnect } from '../code/OpenIDConnect';

function redirectResponse(location: string, code = 302, cookies: string[] = []) {
  return {
    statusCode: code,
    body: '',
    headers: {
      Location: location,
    },
    cookies: cookies,
  };
}

export async function handleRequest(cookies: string, queryStringParamCode: string, queryStringParamState: string, dynamoDBClient: DynamoDBClient) {
  let session = new Session(cookies, dynamoDBClient);
  await session.init();
  if (session.sessionId === false) {
    return redirectResponse('/login');
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
      return redirectResponse('/login');
    }
  } catch (error: any) {
    console.error(error.message);
    return redirectResponse('/login');
  }
  return redirectResponse('/', 302, [session.getCookie()]);
}
