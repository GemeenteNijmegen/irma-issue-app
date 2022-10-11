
function sendResponse(body, code = 200) {
    return {
        'statusCode': code,
        'body': JSON.stringify(body),
        'headers': {}
    };
}

async function handleRequest(irmaApi, token) {
    try {
        const result = await irmaApi.getSessionResult(token);
        sendResponse(result);
    } catch (error) {
        console.error(error.message);
        sendResponse({"error": "Could not get session result"}, 500); // TODO check what IRMA response is on failure?
        return;
    }
    return redirectResponse({}, 400); // Empty response
}

exports.handleRequest = handleRequest;
