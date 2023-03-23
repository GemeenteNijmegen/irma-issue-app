import { DynamoDBClient, GetItemCommand, GetItemCommandOutput } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { TestUtils } from '../other/TestUtils';
import { callbackRequestHandler } from '../../src/app/callback/callbackRequestHandler';
import { DigidLoa } from '../../src/app/code/DigiDLoa';

const ddbMock = mockClient(DynamoDBClient);

function constructParams(cookies?: string, result?: string, error?: string) {
    return { cookies, result, error };
}

beforeAll(async () => {
    // Mock the logging functions (can be used to check for precense of logging)
    console.log = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
    console.error = jest.fn();
    console.time = jest.fn();

});

beforeEach(() => {
    ddbMock.reset();
});

test('Only allow while authenticated', async () => {
    const dynamoDBClient = TestUtils.getSessionStoreMock(ddbMock, false);
    const response = await callbackRequestHandler(constructParams(), dynamoDBClient);
    expect(response.statusCode).toBe(403); // Unauthorized
});


test('Send success callback', async () => {
    setupSessionStore();
    const dynamoDBClient = new DynamoDBClient({});
    const response = await callbackRequestHandler(constructParams('session=1234', 'success', undefined), dynamoDBClient);
    expect(response.statusCode).toBe(200);
    expect(console.log).toHaveBeenCalledTimes(1)
});

test('Send fail callback', async () => {
    setupSessionStore();
    const dynamoDBClient = new DynamoDBClient({});
    const response = await callbackRequestHandler(constructParams('session=1234', 'error', 'TimetOut'), dynamoDBClient);
    expect(response.statusCode).toBe(200);
    expect(console.log).toHaveBeenCalledTimes(1)
});

test('Logged out after issueing', async () => {
    setupSessionStore();
    const dynamoDBClient = new DynamoDBClient({});
    await callbackRequestHandler(constructParams('session=1234', 'success', undefined), dynamoDBClient);
    const response = await callbackRequestHandler(constructParams('session=1234', 'success', undefined), dynamoDBClient);
    expect(response.statusCode).toBe(403);
});


function setupSessionStore() {
    const preCallbackSession: Partial<GetItemCommandOutput> = {
        Item: {
            data: {
                M: {
                    loggedin: { BOOL: true },
                    bsn: { S: '1234567' },
                    loa: { S: DigidLoa.Midden },
                    gemeente: { S: 'Nijmegen' },
                },
            },
        },
    };

    const postCallbackSession: Partial<GetItemCommandOutput> = {
        Item: {
            data: {
                M: {
                    issued: { BOOL: true },
                },
            },
        },
    };

    ddbMock.on(GetItemCommand)
        .resolvesOnce(preCallbackSession)
        .resolvesOnce(postCallbackSession);
}