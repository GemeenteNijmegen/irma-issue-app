import { YiviApi } from '../../src/app/code/YiviApi';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {AWS } from '@gemeentenijmegen/utils';
import * as dotenv from 'dotenv'
import { DigidLoa, loaToNumber } from '../../src/app/code/DigiDLoa';
dotenv.config()


const axiosMock = new MockAdapter(axios);
jest.mock('@gemeentenijmegen/utils/lib/AWS', () => ({
    AWS: {
        getParameter: jest.fn().mockImplementation((name) => `param-${name}`),
        getSecret: jest.fn().mockImplementation((arn) => `secret-${arn}`),
    }
}));

beforeAll(() => {
   // console.log = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
    console.error = jest.fn();
});

beforeEach(() => {
    axiosMock.reset();
});

test('Check if yivi api adds aws4-singature and irma-authorization header and right LOA', async () => {
    axiosMock.onPost('/session').reply(200, sessionResponse);

    const client = new YiviApi();
    client.manualInit('gw-test.nijmegen.nl', true, 'someid', 'somesecretkey', 'irma-autharizaiton-header');
    const imraResp = await client.startSession(brpData, DigidLoa.Substantieel);

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

    const data = JSON.parse(request.data);
    expect(data?.credentials[1]?.attributes?.digidlevel).toBe(loaToNumber(DigidLoa.Substantieel));
});

test('Initialization', async () => {
    process.env.YIVI_API_ACCESS_KEY_ID_ARN = 'key-id-arn';
    process.env.YIVI_API_SECRET_KEY_ARN = 'secret-arn';
    process.env.YIVI_API_KEY_ARN = 'key-arn';
    process.env.YIVI_API_HOST = '/yivi/api/host';
    process.env.YIVI_API_DEMO = 'demo';

    const api = new YiviApi();
    await api.init();
    expect(api.getHost()).toBe('param-/yivi/api/host');
    expect(AWS.getSecret).toHaveBeenCalledTimes(3);
});

test('Initialization and test', async () => {
    process.env.YIVI_API_ACCESS_KEY_ID_ARN = 'key-id-arn';
    process.env.YIVI_API_SECRET_KEY_ARN = 'secret-arn';
    process.env.YIVI_API_KEY_ARN = 'key-arn';
    process.env.YIVI_API_HOST = 'gw-test.nijmegen.nl';
    process.env.YIVI_API_DEMO = 'demo';

    axiosMock.onPost('/session').reply(200, sessionResponse);

    const api = new YiviApi();
    await api.init();

    const yiviResp = await api.startSession(brpData, DigidLoa.Hoog);

    // Check if the response is correct
    expect(yiviResp).toStrictEqual(sessionResponse);
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
        u: 'https://gw-test.nijmegen.nl/yivi/session/anothertoken',
        yiviqr: 'issuing'
    },
    token: 'sometoken',
    frontendRequest: {
        authorization: 'blabla',
        pairingHint: true,
        minProtocolVersion: '1.0',
        maxProtocolVersion: '1.1'
    }
}