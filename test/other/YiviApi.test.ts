import { YiviApi } from '../../src/app/code/YiviApi';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { AWS } from '@gemeentenijmegen/utils';
import { DigidLoa, loaToNumber } from '../../src/app/code/DigiDLoa';
import { TestUtils } from './TestUtils';

const axiosMock = new MockAdapter(axios);
jest.mock('@gemeentenijmegen/utils/lib/AWS', () => ({
    AWS: {
        getParameter: jest.fn().mockImplementation((name) => `param-${name}`),
        getSecret: jest.fn().mockImplementation((arn) => `secret-${arn}`),
    }
}));

beforeAll(() => {
    console.log = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
    console.error = jest.fn();
    console.time = jest.fn();
});

beforeEach(() => {
    axiosMock.reset();
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

test('Initialization and check intialization', async () => {
    process.env.YIVI_API_ACCESS_KEY_ID_ARN = 'key-id-arn';
    process.env.YIVI_API_SECRET_KEY_ARN = 'secret-arn';
    process.env.YIVI_API_KEY_ARN = 'key-arn';
    process.env.YIVI_API_HOST = 'gw-test.nijmegen.nl';
    process.env.YIVI_API_DEMO = 'demo';

    axiosMock.onPost('/session').reply(200, TestUtils.getYiviSessionExampleResponse());

    const api = new YiviApi();
    await api.init();

    const yiviResp = await api.startSession(TestUtils.getBrpExampleData(), DigidLoa.Hoog);

    // Check if the response is correct
    expect(yiviResp).toStrictEqual(TestUtils.getYiviSessionExampleResponse());
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

test('Check if yivi api adds aws4-singature and irma-authorization header and right LOA', async () => {
    axiosMock.onPost('/session').reply(200, TestUtils.getYiviSessionExampleResponse());

    const client = new YiviApi();
    client.manualInit('gw-test.nijmegen.nl', true, 'someid', 'somesecretkey', 'irma-autharizaiton-header');
    const imraResp = await client.startSession(TestUtils.getBrpExampleData(), DigidLoa.Substantieel);

    // Check if the response is correct
    expect(imraResp).toStrictEqual(TestUtils.getYiviSessionExampleResponse());
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
    const loa = `${loaToNumber(DigidLoa.Substantieel)}`;
    expect(data?.credentials[1]?.attributes?.digidlevel).toBe(loa);
});

test('Check timeout Yivi API', async () => {
    axiosMock.onPost('/session').timeout()
    const client = new YiviApi();
    client.manualInit('gw-test.nijmegen.nl', true, 'someid', 'somesecretkey', 'irma-autharizaiton-header');
    await client.startSession(TestUtils.getBrpExampleData(), DigidLoa.Substantieel);
    expect(console.error).toHaveBeenCalledWith('timeout of 2000ms exceeded');
});
