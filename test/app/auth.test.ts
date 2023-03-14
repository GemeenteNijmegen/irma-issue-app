import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDBClient, GetItemCommand, GetItemCommandOutput } from '@aws-sdk/client-dynamodb';
import { SecretsManagerClient, GetSecretValueCommandOutput, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';
import { handleRequest } from '../../src/app/auth/handleRequest';
import { OpenIDConnect } from '../../src/app/code/OpenIDConnect';

jest.mock('@gemeentenijmegen/utils/lib/AWS', () => ({
  AWS: {
      getParameter: jest.fn().mockImplementation((name) => name),
      getSecret: jest.fn().mockImplementation((arn) => arn),
  }
}));

const OIDC = new OpenIDConnect();

beforeAll( async () => {
  
  if (process.env.VERBOSETESTS!='True') {
    global.console.error = jest.fn();
    global.console.time = jest.fn();
    global.console.log = jest.fn();
  }

  // Set env variables
  process.env.SESSION_TABLE = 'mijnuitkering-sessions';
  process.env.AUTH_URL_BASE_SSM = 'https://authenticatie-accp.nijmegen.nl';
  process.env.APPLICATION_URL_BASE = 'https://testing.example.com/';
  process.env.CLIENT_SECRET_ARN = '123';
  process.env.OIDC_CLIENT_ID_SSM = '1234';
  process.env.OIDC_SCOPE_SSM = 'openid';

  await OIDC.init();

  const output: GetSecretValueCommandOutput = {
    $metadata: {},
    SecretString: 'ditiseennepgeheim',
  };
  secretsMock.on(GetSecretValueCommand).resolves(output);

});

const logger = new Logger({ serviceName: 'YiviAuthLambda'});
const ddbMock = mockClient(DynamoDBClient);
const secretsMock = mockClient(SecretsManagerClient);


jest.mock('openid-client', () => {
  const originalClient = jest.requireActual('openid-client');
  return {
    ...originalClient,
    Issuer: jest.fn(() => {
      const originalIssuer = jest.requireActual('openid-client/lib/issuer');
      return {
        Client: jest.fn(() => {
          return {
            callback: jest.fn(() => {
              return {
                claims: jest.fn(() => {
                  return {
                    aud: '1234',
                    sub: '12345',
                    acr: 'urn:oasis:names:tc:SAML:2.0:ac:classes:MobileTwoFactorContract',
                  };
                }),
              };
            }),
            callbackParams: jest.fn(() => {}),
          };
        }),
        ...originalIssuer,
      };
    }),
  };
});

beforeEach(() => {
  ddbMock.reset();
});

test('Successful auth redirects to home', async () => {
  const dynamoDBClient = new DynamoDBClient({ region: 'eu-west-1' });
  const sessionId = '12345';
  const getItemOutput: Partial<GetItemCommandOutput> = {
    Item: {
      data: {
        M: {
          loggedin: { BOOL: true },
          bsn: { S: '12345678' },
          state: { S: '12345' },
        },
      },
    },
  };
  ddbMock.on(GetItemCommand).resolves(getItemOutput);

  const result = await handleRequest(`session=${sessionId}`, 'state', '12345', dynamoDBClient, logger, OIDC);
  expect(result.statusCode).toBe(302);
  expect(result.headers?.Location).toBe('/');
});


test('Successful auth creates new session', async () => {
  const dynamoDBClient = new DynamoDBClient({ region: 'eu-west-1' });
  const sessionId = '12345';
  const getItemOutput: Partial<GetItemCommandOutput> = {
    Item: {
      data: {
        M: {
          loggedin: { BOOL: false },
          state: { S: '12345' },
        },
      },
    },
  };
  ddbMock.on(GetItemCommand).resolves(getItemOutput);


  const result = await handleRequest(`session=${sessionId}`, 'state', '12345', dynamoDBClient, logger, OIDC);
  expect(result.statusCode).toBe(302);
  expect(result.headers?.Location).toBe('/');
  expect(result.cookies).toContainEqual(expect.stringContaining('session='));
});

test('No session redirects to login', async () => {
  const dynamoDBClient = new DynamoDBClient({ region: 'eu-west-1' });
  const result = await handleRequest('', 'state', 'state', dynamoDBClient, logger, OIDC);
  expect(result.statusCode).toBe(302);
  expect(result.headers?.Location).toBe('/login');
});


test('Incorrect state errors', async () => {
  const dynamoDBClient = new DynamoDBClient({ region: 'eu-west-1' });
  const sessionId = '12345';
  const getItemOutput: Partial<GetItemCommandOutput> = {
    Item: {
      loggedin: {
        BOOL: false,
      },
      state: {
        S: '12345',
      },
    },
  };
  const logger = new Logger({serviceName: 'test'});
  ddbMock.on(GetItemCommand).resolves(getItemOutput);
  const logSpy = jest.spyOn(logger, 'error');
  const result = await handleRequest(`session=${sessionId}`, '12345', 'returnedstate', dynamoDBClient, logger, OIDC);
  expect(result.statusCode).toBe(302);
  expect(result.headers?.Location).toBe('/login');
  expect(logSpy).toHaveBeenCalled();
});