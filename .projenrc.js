const { awscdk, TextFile } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.22.0',
  defaultReleaseBranch: 'production',
  release: true,
  majorVersion: 1,
  name: 'irma-issue-app',
  license: 'EUPL-1.2',
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
    '@privacybydesign/irma-frontend',
    'axios@^0.27.2', // TODO upgrade however aws4-axios is not yet compatible with v1
    'mustache',
    '@types/mustache',
    'aws4-axios',
    'openid-client',
    '@types/cookie',
    'cookie',
    '@types/aws-lambda',
    

  ], /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  devDeps: [
    'copyfiles',
    '@playwright/test',
    'aws-sdk-client-mock',
    'jest-raw-loader',
    'axios-mock-adapter',
    'jest-aws-client-mock',
  ], /* Build dependencies for this module. */
  depsUpgradeOptions: {
    workflowOptions: {
      branches: ['development'],
    },
  },
  // packageName: undefined,  /* The "name" in package.json. */
  // release: undefined,      /* Add release management to this project. */
  mutableBuild: true,
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
    '.env',
    '.vscode',
    'src/app/**/tests/output',
    '.DS_Store',
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