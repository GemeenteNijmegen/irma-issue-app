const { handleRequest } = require("./handleRequest");
const { IrmaClient } = require('./shared/IrmaApi');

const irmaClient = new IrmaClient();

async function init() {
    console.time('init');
    console.timeLog('init', 'start init');
    let promiseIrma = irmaClient.init();
    console.timeEnd('init');
    return promiseIrma;
}

const initPromise = init();

function parseEvent(event) {
    return { 
        'token': event?.queryStringParameters?.token,
    };
}

exports.handler = async (event, context) => {
    try {
        const params = parseEvent(event);
        await initPromise;
        return await handleRequest(irmaClient, params.token);
    } catch (err) {
        console.error(err);
        response = {
            'statusCode': 500
        }
        return response;
    }
};