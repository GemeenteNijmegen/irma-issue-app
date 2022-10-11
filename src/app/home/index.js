const { ApiClient } = require('@gemeentenijmegen/apiclient');
const { IrmaClient } = require('./IrmaApi');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { homeRequestHandler } = require("./homeRequestHandler");

const dynamoDBClient = new DynamoDBClient();
const brpClient = new ApiClient();
const irmaClient = new irmaClient();

async function init() {
    console.time('init');
    console.timeLog('init', 'start init');
    let promise = brpClient.init();
    console.timeEnd('init');
    return promise;
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
        return await homeRequestHandler(params.cookies, brpClient, irmaClient, dynamoDBClient);
    
    } catch (err) {
        console.error(err);
        response = {
            'statusCode': 500
        }
        return response;
    }
};