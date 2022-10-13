import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Session } from '@gemeentenijmegen/session';
import { IrmaApi } from '../code/IrmaApi';

function sendResponse(body: any, code = 200) {
  return {
    statusCode: code,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

export async function resultRequestHandler(cookies: string, irmaApi: IrmaApi, token: string, dynamoDBClient: DynamoDBClient) {
  let session = new Session(cookies, dynamoDBClient);
  await session.init();
  if (session.isLoggedIn() == true) {
    return handleRequest(irmaApi, token);
  }
  const data = {
    message: 'Unauthorized',
  };
  return sendResponse(data, 403);
}

async function handleRequest(irmaApi: IrmaApi, token: string) {
  try {
    const result = await irmaApi.getSessionResult(token);
    return sendResponse(result);
  } catch (error: any) {
    console.error(error.message);
    return sendResponse({ error: 'Could not get session result' }, 500); // TODO check what IRMA response is on failure?
  }
}
