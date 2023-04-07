import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { BrpApi } from '../../src/app/issue/BrpApi';
import { issueRequestHandler } from '../../src/app/issue/issueRequestHandler';
import { ApiClient } from '@gemeentenijmegen/apiclient';
import { YiviApi } from '../../src/app/code/YiviApi';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { mockClient } from 'aws-sdk-client-mock';
import { DigidLoa } from '../../src/app/code/DigiDLoa';
import { TestUtils } from '../other/TestUtils';

const ddbMock = mockClient(DynamoDBClient);
mockClient(CloudWatchLogsClient);
const axiosMock = new MockAdapter(axios);

const brpApi = new BrpApi(new ApiClient('cert', 'key', 'ca'));
const yiviApi = new YiviApi();

// Mock SSM and Secrets manager utility (cannot be moved to TestUtils)
jest.mock('@gemeentenijmegen/utils/lib/AWS', () => ({
    AWS: {
        getParameter: jest.fn().mockImplementation((name) => `${name}`),
        getSecret: jest.fn().mockImplementation((arn) => `${arn}`),
    }
}));

beforeAll(async () => {
    // Mock the logging functions (can be used to check for precense of logging)
    // console.log = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
    console.error = jest.fn();
    console.time = jest.fn();

    process.env.STATISTICS_LOG_GROUP_NAME = 'statistics-group';
    process.env.STATISTICS_LOG_STREAM_NAME = 'statistics-stream',
    process.env.TICKEN_LOG_GROUP_NAME= 'ticken-group'
    process.env.TICKEN_LOG_STREAM_NAME = 'ticken-stream';

    // Setup BRP and Yivi client
    process.env.BRP_API_URL = 'https://example.com/brp/api/test';
    await brpApi.init();
    yiviApi.manualInit('yivi-server-test.nijmegen.nl', true, 'someid', 'somesecretkey', 'irma-autharizaiton-header');
});

beforeEach(() => {
    axiosMock.reset();
    ddbMock.reset();
});

test('Issue page loads successfull', async () => {

    // Mocks
    const dynamoDBClient = TestUtils.getSessionStoreMock(ddbMock);
    const logsClient = new CloudWatchLogsClient({});
    axiosMock.onPost('https://yivi-server-test.nijmegen.nl/session').reply(200, TestUtils.getYiviSessionExampleResponse());
    axiosMock.onPost('https://example.com/brp/api/test').reply(200, TestUtils.getBrpExampleData());

    // Call issue request handler
    const response = await issueRequestHandler('session=12345', brpApi, yiviApi, dynamoDBClient, logsClient);
    
    // Check if the session resonse is encoded in the html
    const data = await brpApi.getBrpData('900026236');
    const manuallyObtainedSessionResponse = await yiviApi.startSession(data, DigidLoa.Midden);
    const base64SessionResponse = Buffer.from(JSON.stringify(manuallyObtainedSessionResponse), 'utf-8').toString('base64');
    expect(response.body).toContain(base64SessionResponse)
});

test('Issue page not logged in', async () => {
    // Session store not logged in
    const dynamoDBClient = TestUtils.getSessionStoreMock(ddbMock, false);
    const logsClient = new CloudWatchLogsClient({});
    
    const response = await issueRequestHandler('session=12345', brpApi, yiviApi, dynamoDBClient, logsClient);
    expect(response.statusCode).toBe(302);
    expect(response.headers?.Location).toBe('/login');
    expect(response.body).toBe('');
});

test('Yivi API timeout', async () => {
    // Mocks
    const dynamoDBClient = TestUtils.getSessionStoreMock(ddbMock);
    const logsClient = new CloudWatchLogsClient({});
    axiosMock.onPost('https://yivi-server-test.nijmegen.nl/session').timeout();
    axiosMock.onPost('https://example.com/brp/api/test').reply(200, TestUtils.getBrpExampleData());

    // Call issue request handler
    await issueRequestHandler('session=12345', brpApi, yiviApi, dynamoDBClient, logsClient);
    expect(console.error).toHaveBeenCalledWith('timeout of 2000ms exceeded');
});


test('BRP API timeout', async () => {
    // Mocks
    const dynamoDBClient = TestUtils.getSessionStoreMock(ddbMock);
    const logsClient = new CloudWatchLogsClient({});
    axiosMock.onPost('https://example.com/brp/api/test').timeout();

    // Call issue request handler
    await issueRequestHandler('session=12345', brpApi, yiviApi, dynamoDBClient, logsClient);
    expect(console.error).toHaveBeenCalledWith('timeout of 2000ms exceeded');
});
