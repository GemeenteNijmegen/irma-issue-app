const { render } = require('./shared/render');
const { Response } = require('./shared/response');
const { Session } = require('./shared/session');
const { IrmaClient } = require('./irmaClient');
const { BrpClient } = require('./brpClient');

function parseEvent(event) {
    return { 'cookies': event?.headers?.Cookie };
}

// Initialize irma client
const irmaClient = new IrmaClient();
irmaClient.initializeParameters().then(() => {
    console.log('Initialized IRMA client');
}).catch(error => {
    console.error('Could not initalize irma client', error)
});

// Initialize brp client
const brpClient = new BrpClient();

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

        if (session.isLoggedIn() === false) {
            return Response.httpRedirect('/irma-issue');
        }

        // Get bsn from session
        const bsn = session.getValue('bsn');

        // Fetch data from BRP based on bsn
        const personalData = brpClient.getBrpIrmaData(bsn); //TODO unmock this method

        // Start the irma session
        const irmaResponse = irmaClient.startIrmaSession(personalData);

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