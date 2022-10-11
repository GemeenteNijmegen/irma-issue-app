const { render } = require('./shared/render');
const { Session } = require('@gemeentenijmegen/session');
const { BrpApi } = require('./BrpApi');

function redirectResponse(location, code = 302) {
    return {
        'statusCode': code,
        'body': '',
        'headers': { 
            'Location': location
        }
    }
}

exports.homeRequestHandler = async (cookies, brpClient, irmaApi, dynamoDBClient) => {
    let session = new Session(cookies, dynamoDBClient);
    await session.init();
    if (session.isLoggedIn() == true) {
        return await handleLoggedinRequest(session, brpClient, irmaApi);
    }
    return redirectResponse('/login');
}

async function handleLoggedinRequest(session, brpClient, irmaApi) {
    // BRP request
    const bsn = session.getValue('bsn');
    const brpApi = new BrpApi(brpClient);
    const brpData = await brpApi.getBrpData(bsn);
    const naam = brpData?.Persoon?.Persoonsgegevens?.Naam ? brpData.Persoon.Persoonsgegevens.Naam : 'Onbekende gebruiker';

    if(naam == 'Onbekende gebruiker'){
        // TODO fout afhandelen geen BRP data om uit te geven...
        throw Error("Kon BRP data niet ophalen...")
    }

    // Start IRMA session 
    const irmaSession = irmaApi.startSession(brpData);

    data = {
        title: 'overzicht',
        shownav: true,
        volledigenaam: naam,
        irmaSessie: irmaSession,
    };

    // render page
    const html = await render(data, __dirname + '/templates/home.mustache', {
        'header': `${__dirname}/shared/header.mustache`,
        'footer': `${__dirname}/shared/footer.mustache`
    });
    response = {
        'statusCode': 200,
        'body': html,
        'headers': {
            'Content-type': 'text/html'
        },
        'cookies': [
            session.getCookie(),
        ]
    };
    return response;
}

