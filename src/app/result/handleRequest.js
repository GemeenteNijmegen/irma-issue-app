const { default: axios } = require("axios");
const aws4 = require('aws4')

function sendResponse(body, code = 200) {
    return {
        'statusCode': code,
        'body': JSON.stringify(body),
        'headers': {}
    };
}

async function handleRequest(token) {
    
    // Make request to session result endpoint
    const baseUrl = 'gw-test.nijmegen.nl'
    const url = `https://${baseUrl}/irma/session/${token}/result`;

    try {
        let resp = await axios(aws4.sign({
            host: baseUrl,
            method: "GET",
            url: url,
            path: "/foobot/foobot",
            headers: {
                "irma-authorization": "APIKEY",
            }
        }));
        
        if(resp.data){
            sendResponse(resp.data);
        } else {
            sendResponse({"error": "Could not get session result"}, 500); // TODO check what IRMA response is on failure?
            return;
        }
    } catch (error) {
        console.error(error.message);
        sendResponse({"error": "Could not get session result"}, 500); // TODO check what IRMA response is on failure?
        return;
    }
    return redirectResponse({}, 200); // Empty response
}
exports.handleRequest = handleRequest;
