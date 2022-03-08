const { render } = require('./shared/render');
const { Response } = require('./shared/response');
const { Session } = require('./shared/session');

function parseEvent(event) {
    return { 'cookies': event?.cookies?.join(';') };
}

/**
 * Lambda handler for accessing BRP, creating an IRMA session and 
 * providing the user with the QR code
 * @param {*} event 
 * @param {*} context 
 * @returns 
 */
exports.handler = async (event, context) => {
    const template = __dirname + '/templates/index.mustache';
        
    try {

        const params = parseEvent(event);
        let session = new Session(params.cookies);
        await session.init();
        if(session.isLoggedIn() === false) {
            return redirectResponse('/');
        }

        const bsn = session.getValue('bsn', 's');

        // TODO fetch data from BRP based on bsn
        // TODO start IRMA session
        // TODO Show irma session qr code to user

        // Render the issue page
        const html = await render(template, {
            assets: process.env.ASSETS_URL,
            bsn: bsn
        });

        return Response.htmlResponse(html);
    } catch (err) {
        console.error(err);
        return Response.httpStatus(500);
    }
};