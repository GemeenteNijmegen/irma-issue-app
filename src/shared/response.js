class Response {

    static htmlResponse(body){
        const response = {
            'statusCode': 200,
            'body': body,
            'headers': { 
                'Content-type': 'text/html'
            }
        };
        return response;
    }

    static httpRedirect(target) {
        const response = {
            'statusCode': 302,
            'headers': { 
                'Location': target
            }
        };
        return response;
    }

    static httpRedirectWithCookie(target, cookie) {
        const response = {
            'statusCode': 302,
            'headers': { 
                'Location': target,
                'Set-Cookie': cookie
            }
        };
        return response;
    }
    
    static httpStatus(status){
        const response = {
            'statusCode': status
        }
        return response
    }

}
exports.Response = Response;