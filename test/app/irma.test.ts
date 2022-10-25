import { IrmaApi } from '../../src/app/code/IrmaApi';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { AwsUtil } from '../../src/app/code/AwsUtil';
import * as dotenv from 'dotenv'
dotenv.config()

const axiosMock = new MockAdapter(axios);

const getSecretMock = jest.spyOn(AwsUtil.prototype, 'getSecret')
.mockImplementation(async (arn: string) => {
    return `secret-${arn}`;
});

beforeAll(() => {
    console.log = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
    console.error = jest.fn();
});

beforeEach(() => {
    axiosMock.reset();
});

test('Check if irma api adds aws4-singature and irma-authorization header', async () => {
    axiosMock.onPost('/session').reply(200, sessionResponse);

    const client = new IrmaApi();
    client.manualInit('gw-test.nijmegen.nl', true, 'someid', 'somesecretkey', 'irma-autharizaiton-header');
    const imraResp = await client.startSession(brpData);

    // Check if the response is correct
    expect(imraResp).toStrictEqual(sessionResponse);
    // Check request config in history
    const request = axiosMock.history['post'][0];
    expect(request).not.toBe(undefined);
    // Validate if the headers are set
    expect(request.headers).not.toBe(undefined);
    if (request.headers) {
        expect(request.headers['irma-authorization']).toBe('irma-autharizaiton-header');
        expect(request.headers['Authorization']).not.toBeUndefined();
        expect(request.headers['X-Amz-Date']).not.toBeUndefined();
    }
});

test('Initialization', async () => {
    process.env.IRMA_API_ACCESS_KEY_ID_ARN = 'key-id-arn';
    process.env.IRMA_API_SECRET_KEY_ARN = 'secret-arn';
    process.env.IRMA_API_KEY_ARN = 'key-arn';
    process.env.IRMA_API_HOST = 'gw-test.nijmegen.nl';
    process.env.IRMA_API_DEMO = 'demo';


    const api = new IrmaApi();
    await api.init();
    expect(api.getHost()).toBe(process.env.IRMA_API_HOST);
    expect(getSecretMock).toHaveBeenCalledTimes(3);
});

test('Initialization and test', async () => {
    process.env.IRMA_API_ACCESS_KEY_ID_ARN = 'key-id-arn';
    process.env.IRMA_API_SECRET_KEY_ARN = 'secret-arn';
    process.env.IRMA_API_KEY_ARN = 'key-arn';
    process.env.IRMA_API_HOST = 'gw-test.nijmegen.nl';
    process.env.IRMA_API_DEMO = 'demo';

    axiosMock.onPost('/session').reply(200, sessionResponse);

    const api = new IrmaApi();
    await api.init();
    expect(getSecretMock).toHaveBeenCalledTimes(3);

    const irmaResp = await api.startSession(brpData);

    // Check if the response is correct
    expect(irmaResp).toStrictEqual(sessionResponse);
    // Check request config in history
    const request = axiosMock.history['post'][0];
    expect(request).not.toBe(undefined);
    // Validate if the headers are set
    expect(request.headers).not.toBe(undefined);
    if (request.headers) {
        expect(request.headers['irma-authorization']).toBe('secret-key-arn');
        expect(request.headers['Authorization']).not.toBeUndefined();
        expect(request.headers['X-Amz-Date']).not.toBeUndefined();
    }

});


const brpData = {
    "Persoon": {
        "BSN": {
            "BSN": "900026236"
        },
        "Persoonsgegevens": {
            "Voorletters": "H.",
            "Voornamen": "Hans",
            "Voorvoegsel": "de",
            "Geslachtsnaam": "Jong",
            "Achternaam": "de Jong",
            "Naam": "H. de Jong",
            "Geboortedatum": "01-01-1956",
            "Geslacht": "M",
            "NederlandseNationaliteit": "Ja",
            "Geboorteplaats": "Nijmegen",
            "Geboorteland": "Nederland"
        },
        "Adres": {
            "Straat": "Kelfkensbos",
            "Huisnummer": "80",
            "Gemeente": "Nijmegen",
            "Postcode": "6511 RN",
            "Woonplaats": "Nijmegen"
        },
        "ageLimits": {
            "over12": "Yes",
            "over16": "Yes",
            "over18": "Yes",
            "over21": "Yes",
            "over65": "Yes"
        }
    }
}

const sessionResponse = {
    sessionPtr: {
        u: 'https://gw-test.nijmegen.nl/irma/session/anothertoken',
        irmaqr: 'issuing'
    },
    token: 'sometoken',
    frontendRequest: {
        authorization: 'blabla',
        pairingHint: true,
        minProtocolVersion: '1.0',
        maxProtocolVersion: '1.1'
    }
}