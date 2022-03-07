const { render } = require('./shared/render');

const gemeentes = [
    'alblasserdam',
    'alkmaar',
    'almere',
    'amersfoort',
    'amsterdam',
    'arnhem',
    'boekel',
    'breda',
    'buren',
    'debilt',
    'denbosch',
    'deventer',
    'dordrecht',
    'eindhoven',
    'emmen',
    'enschede',
    'groningen',
    'haarlem',
    'haarlemmermeer',
    'hardinxveld-giessendam',
    'heerenveen',
    'helmond',
    'hendrik-ido-ambacht',
    'meierijstad',
    'nijmegen',
    'oss',
    'papendrecht',
    'sliedrecht',
    'sudwest-fryslan',
    'utrecht',
    'zwijndrecht'
];

function htmlResponse(body) {
    const response = {
        'statusCode': 200,
        'body': body,
        'headers': { 
            'Content-type': 'text/html'
        }
    };
    return response;
}


exports.handler = async (event, context) => {
    const template = __dirname + '/templates/index.mustache';

    try {
        const html = await render(template, {
            assets: process.env.ASSETS_URL,
            gemeentes: gemeentes
        });
        return htmlResponse(html);
    } catch (err) {
        console.error(err);
        response = {
            'statusCode': 500
        }
        return response;
    }
};