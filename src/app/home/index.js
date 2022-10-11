const { ApiClient } = require('@gemeentenijmegen/apiclient');
const { IrmaApi } = require('./shared/IrmaApi');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { homeRequestHandler } = require("./homeRequestHandler");
const { BrpApi } = require('./BrpApi');
const dynamoDBClient = new DynamoDBClient();

const brpClient = new ApiClient();
const irmaApi = new IrmaApi();

async function init() {
    console.time('init');
    console.timeLog('init', 'start init');
    let promiseBrp = brpClient.init();
    let promiseIrma = irmaApi.init();
    console.timeEnd('init');
    return Promise.all(promiseBrp, promiseIrma);
}

const initPromise = init();

function parseEvent(event) {
    return { 
        'cookies': event?.cookies?.join(';'),
    };
}

exports.handler = async (event, context) => {
    try {
        const params = parseEvent(event);
        await initPromise;

        return await homeRequestHandler(params.cookies, brpClient, irmaApi, dynamoDBClient);
    
    } catch (err) {
        console.error(err);
        response = {
            'statusCode': 500
        }
        return response;
    }
};