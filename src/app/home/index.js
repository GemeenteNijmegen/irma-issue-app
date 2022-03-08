const { render } = require('./shared/render');
const { Response } = require('./shared/response');


exports.handler = async (event, context) => {
    const template = __dirname + '/templates/index.mustache';
    const irmaEnabled = process.env.IRMA_AUTH_ENABLED === 'true';


    if (irmaEnabled){
        // TODO: Create url for starting IRMA authentication?
    }

    try {
        const html = await render(template, {
            assets: process.env.ASSETS_URL,
            authUrl: '',
            irmaEnabled: irmaEnabled
        });
        return Response.htmlResponse(html);
    } catch (err) {
        return Response.httpStatus(500);
    }
    
};