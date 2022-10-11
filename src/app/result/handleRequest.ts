import { IrmaApi } from '../code/IrmaApi';

function sendResponse(body: any, code = 200) {
  return {
    statusCode: code,
    body: JSON.stringify(body),
    headers: {},
  };
}

export async function handleRequest(irmaApi: IrmaApi, token: string) {
  try {
    const result = await irmaApi.getSessionResult(token);
    sendResponse(result);
  } catch (error: any) {
    console.error(error.message);
    sendResponse({ error: 'Could not get session result' }, 500); // TODO check what IRMA response is on failure?
    return;
  }
  return sendResponse({}, 400); // Empty response
}
