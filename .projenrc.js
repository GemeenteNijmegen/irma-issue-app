const { GemeenteNijmegenCdkApp } = require('@gemeentenijmegen/projen-project-type');

const project = new GemeenteNijmegenCdkApp({
  cdkVersion: '2.22.0',
  defaultReleaseBranch: 'production',
  majorVersion: 1,
  name: 'yivi-issue-app',
  deps: [
    'dotenv',
    '@aws-cdk/aws-apigatewayv2-alpha',
    '@aws-cdk/aws-apigatewayv2-integrations-alpha',
    '@aws-solutions-constructs/aws-lambda-dynamodb',
    'cdk-remote-stack',
    '@gemeentenijmegen/dnssec-record',

    // Lambda packages
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/client-secrets-manager',
    '@aws-sdk/client-ssm',
    '@aws-sdk/client-ses',
    '@gemeentenijmegen/apiclient',
    '@gemeentenijmegen/session',
    '@gemeentenijmegen/utils',
    '@gemeentenijmegen/apigateway-http',
    //'@privacybydesign/yivi-frontend', // YIVI check if this package is actually used in the code
    'axios@^0.27.2', // TODO upgrade however https://github.com/jamesmbourne/aws4-axios/issues/701
    'mustache',
    '@types/mustache',
    'aws4-axios',
    'openid-client',
    '@types/cookie',
    'cookie',
    '@types/aws-lambda',
  ],
  devDeps: [
    'copyfiles',
    '@playwright/test',
    'aws-sdk-client-mock',
    'jest-raw-loader',
    'axios-mock-adapter',
    'jest-aws-client-mock',
    '@gemeentenijmegen/projen-project-type',
  ],
  jestOptions: {
    jestConfig: {
      setupFiles: ['dotenv/config'],
      moduleFileExtensions: [
        'js', 'json', 'jsx', 'ts', 'tsx', 'node', 'mustache',
      ],
      transform: {
        '\\.[jt]sx?$': 'ts-jest',
        '^.+\\.mustache$': 'jest-raw-loader',
      },
      testPathIgnorePatterns: ['/node_modules/', '/cdk.out', '/test/playwright'],
      roots: ['src', 'test'],
    },
  },
  eslintOptions: {
    devdirs: ['src/app/logout/tests', '/test', '/build-tools'],
  },
  gitignore: [
    'src/app/**/tests/output',
    'test/playwright/report',
    'test/playwright/screenshots',
  ],
  bundlerOptions: {
    loaders: {
      mustache: 'text',
    },
  },
});

project.synth();