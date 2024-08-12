import { writeFile } from 'fs';
import * as path from 'path';
import { DynamoDBClient, GetItemCommandOutput, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { OpenIDConnect } from '../../src/app/code/OpenIDConnect';
import { handleLoginRequest } from '../../src/app/login/loginRequestHandler';

const ddbMock = mockClient(DynamoDBClient);
jest.mock('@gemeentenijmegen/utils/lib/AWS', () => ({
  AWS: {
    getParameter: jest.fn().mockImplementation((name) => name),
    getSecret: jest.fn().mockImplementation((arn) => arn),
  },
}));
const OIDC = new OpenIDConnect();

beforeAll( async () => {

  if (process.env.VERBOSETESTS != 'True') {
    global.console.error = jest.fn();
    global.console.time = jest.fn();
    global.console.log = jest.fn();
    global.console.debug = jest.fn();
  }

  // Set env variables
  process.env.SESSION_TABLE = 'yivi-issue-sessions';
  process.env.AUTH_URL_BASE_SSM = 'https://authenticatie-accp.nijmegen.nl';
  process.env.APPLICATION_URL_BASE = 'https://testing.example.com/';
  process.env.OIDC_SECRET_ARN = '123';
  process.env.OIDC_CLIENT_ID_SSM = '1234';
  process.env.OIDC_SCOPE_SSM = 'openid';

  await OIDC.init();
});


beforeEach(() => {
  ddbMock.reset();
});


test('index is ok', async () => {
  const dynamoDBClient = new DynamoDBClient({ region: 'eu-west-1' });
  const result = await handleLoginRequest({ cookies: '' }, dynamoDBClient, OIDC);
  expect(result.statusCode).toBe(200);
});


test('Return login page with correct link', async () => {
  const dynamoDBClient = new DynamoDBClient({ region: 'eu-west-1' });
  const result = await handleLoginRequest({ cookies: '' }, dynamoDBClient, OIDC);
  if (!('body' in result)) {
    expect('body' in result).toBe(true);
    return;
  }
  expect(result.body).toContain(`${process.env.AUTH_URL_BASE_SSM}/broker/sp/oidc/authenticate`);
  expect(result.body).toContain(encodeURIComponent(`${process.env.APPLICATION_URL_BASE}auth`));
  expect(result.statusCode).toBe(200);
  writeFile(path.join(__dirname, 'output', 'test.html'), result.body ?? '', () => { });
});

test('No redirect if session cookie doesn\'t exist', async () => {
  const dynamoDBClient = new DynamoDBClient({ region: 'eu-west-1' });

  const result = await handleLoginRequest({ cookies: 'demo=12345' }, dynamoDBClient, OIDC);
  expect(result.statusCode).toBe(200);
});

test('Create session if no session exists', async () => {
  const dynamoDBClient = new DynamoDBClient({ region: 'eu-west-1' });

  await handleLoginRequest({ cookies: 'demo=12345' }, dynamoDBClient, OIDC);

  expect(ddbMock.calls().length).toBe(1);
});

test('Redirect to home if already logged in', async () => {
  const output: Partial<GetItemCommandOutput> = {
    Item: {
      data: {
        M: {
          loggedin: {
            BOOL: true,
          },
        },
      },
    },
  };
  ddbMock.on(GetItemCommand).resolves(output);
  const dynamoDBClient = new DynamoDBClient({ region: 'eu-west-1' });
  const sessionId = '12345';
  const result = await handleLoginRequest({ cookies: `session=${sessionId}` }, dynamoDBClient, OIDC);
  expect(result.statusCode).toBe(302);
  if (!('Location' in (result.headers ?? {}))) {
    expect('Location' in (result.headers ?? {})).toBe(true);
    return;
  }
  expect(result.headers?.Location).toBe('/');
});

test('Unknown session returns login page', async () => {
  const dynamoDBClient = new DynamoDBClient({ region: 'eu-west-1' });
  const output: Partial<GetItemCommandOutput> = {}; //empty output
  ddbMock.on(GetItemCommand).resolves(output);
  const sessionId = '12345';
  const result = await handleLoginRequest({ cookies: `session=${sessionId}` }, dynamoDBClient, OIDC);
  expect(ddbMock.calls().length).toBe(2);
  expect(result.statusCode).toBe(200);
});

test('Known session without login returns login page, without creating new session', async () => {
  const output: Partial<GetItemCommandOutput> = {
    Item: {
      loggedin: {
        BOOL: false,
      },
    },
  };
  ddbMock.on(GetItemCommand).resolves(output);
  const dynamoDBClient = new DynamoDBClient({ region: 'eu-west-1' });
  const sessionId = '12345';
  const result = await handleLoginRequest({ cookies: `session=${sessionId}` }, dynamoDBClient, OIDC);
  expect(ddbMock.calls().length).toBe(2);
  expect(result.statusCode).toBe(200);
});

test('Request without session returns session cookie', async () => {
  const dynamoDBClient = new DynamoDBClient({ region: 'eu-west-1' });
  const result = await handleLoginRequest({ cookies: '' }, dynamoDBClient, OIDC);
  if (!('cookies' in result)) {
    expect('cookies' in result).toBe(true);
    return;
  }
  expect(result.cookies).toEqual(
    expect.arrayContaining([expect.stringMatching('session=')]),
  );
});

test('DynamoDB error', async () => {
  ddbMock.on(GetItemCommand).rejects(new Error('Not supported!'));
  const dynamoDBClient = new DynamoDBClient({ region: 'eu-west-1' });
  let failed = false;
  try {
    await handleLoginRequest({ cookies: 'session=12345' }, dynamoDBClient, OIDC);
  } catch (error) {
    failed = true;
  }
  expect(ddbMock.calls().length).toBe(1);
  expect(failed).toBe(true);
});