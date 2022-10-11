import { IrmaApi } from '../code/IrmaApi';
import { handleRequest } from './handleRequest';

const irmaApi = new IrmaApi();

async function init() {
  console.time('init');
  console.timeLog('init', 'start init');
  let promiseIrma = irmaApi.init();
  console.timeEnd('init');
  return promiseIrma;
}

const initPromise = init();

function parseEvent(event: any) {
  return {
    token: event?.queryStringParameters?.token,
  };
}

exports.handler = async (event: any) => {
  try {
    const params = parseEvent(event);
    await initPromise;
    return await handleRequest(irmaApi, params.token);
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
    };
  }
};