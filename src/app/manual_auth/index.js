const { Response } = require('./shared/response');
const { Session } = require('./shared/session');
const crypto = require('crypto');

/**
 * This lambda should not be deployed in production! Even tough it is secured using basic authentication
 * It lets the user bypass authentication trough digid or irma, very useful for testing however not for
 * in production.
 * @param {*} event 
 * @param {*} context 
 * @returns 
 */
exports.handler = async (event, context) => {
    try {

        const bsn = event.queryStringParameters.bsn;
        if (bsn === false){
            return Response.httpRedirect('/');
        }
        console.debug("Assuming bsn", bsn);

        // Create a new session
        let session = new Session(false);
        session.init();
        // NOTE: No state needed for manual authentication
        //const state = crypto.randomBytes(32); 
        await session.createSession('-');

        console.debug("Session created. Now authenticating user...");

        // Set the session to be authenticated and use the bsn from the url param
        await session.updateSession(true, bsn);

        // Send the cookie back to the user
        const newCookie = 'session='+ session.sessionId + '; HttpOnly; Secure;';
        console.debug("Sending cookies", newCookie);
        return Response.httpRedirectWithCookie('/irma-issue/issue', newCookie);

    } catch (err) {
        console.error(err);
        return Response.httpStatus(500);
    }
};