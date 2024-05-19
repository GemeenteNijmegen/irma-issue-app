const { GemeenteNijmegenCdkApp } = require('@gemeentenijmegen/projen-project-type');

const project = new GemeenteNijmegenCdkApp({
  cdkVersion: '2.22.0',
  defaultReleaseBranch: 'production',
  majorVersion: 1,
  name: 'yivi-issue-app',
  deps: [
    'dotenv',
    '@aws-solutions-constructs/aws-lambda-dynamodb',
    'cdk-remote-stack',
    '@gemeentenijmegen/dnssec-record',
    '@gemeentenijmegen/aws-constructs',

    '@pepperize/cdk-route53-health-check',

    // Lambda packages
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/client-secrets-manager',
    '@aws-sdk/client-ssm',
    '@aws-sdk/client-ses',
    '@aws-sdk/client-cloudwatch-logs',
    '@gemeentenijmegen/apiclient',
    '@gemeentenijmegen/session',
    '@gemeentenijmegen/utils',
    '@gemeentenijmegen/apigateway-http',
    //'@privacybydesign/yivi-frontend', // YIVI check if this package is actually used in the code
    'axios',
    'mustache',
    '@types/mustache',
    'aws4-axios@3.3.0',
    'openid-client',
    '@types/cookie',
    'cookie',
    '@types/aws-lambda',
    'chart.js',
    '@privacybydesign/yivi-frontend',
  ],
  devDeps: [
    'copyfiles',
    '@playwright/test',
    'aws-sdk-client-mock',
    '@glen/jest-raw-loader',
    'axios-mock-adapter',
    'jest-aws-client-mock',
    '@gemeentenijmegen/projen-project-type',
    'copyfiles',
  ],
  jestOptions: {
    jestConfig: {
      setupFiles: ['dotenv/config'],
      moduleFileExtensions: [
        'js', 'json', 'jsx', 'ts', 'tsx', 'node', 'mustache',
      ],
      transform: {
        '\\.[jt]sx?$': 'ts-jest',
        '^.+\\.mustache$': '@glen/jest-raw-loader',
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
    'src/app/static-resources/packages/*',
    'test/playwright/report',
    'test/playwright/tests/report',
    'test/playwright/tests/results',
    'test/playwright/test-results',
    'test/playwright/screenshots',
    'test/__snapshots__/*',
  ],
  bundlerOptions: {
    loaders: {
      mustache: 'text',
    },
  },
  scripts: {
    'lint': 'cfn-lint cdk.out/**/*.template.json -i W3005 W2001 W3045', // W3045: zie CloudFront logs bucket
    'install:chartjs': 'copyfiles -f -E -V node_modules/chart.js/dist/chart.js src/app/static-resources/static/scripts/',
    'install:yivi-frontend': 'copyfiles -f -E -V node_modules/@privacybydesign/yivi-frontend/dist/yivi.js src/app/static-resources/static/scripts/',
  },
});

project.synth();