const { handleRequest } = require("./handleRequest");

function parseEvent(event) {
    return { 
        'token': event?.queryStringParameters?.code,
    };
}

exports.handler = async (event, context) => {
    try {
        const params = parseEvent(event);
        return await handleRequest(params.token);
    } catch (err) {
        console.error(err);
        response = {
            'statusCode': 500
        }
        return response;
    }
};