const { awscdk } = require('projen');
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

    // Lambda packages
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/client-secrets-manager',
    '@aws-sdk/client-ssm',
    '@gemeentenijmegen/apiclient',
    '@gemeentenijmegen/session',
    '@gemeentenijmegen/utils',
    '@privacybydesign/irma-frontend',
    'axios@^0.27.2', // TODO upgrade however aws4-axios is not yet compatible with v1
    'mustache',
    '@types/mustache',
    'aws4-axios',
    'openid-client',
    '@types/cookie',
    'cookie',

  ], /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  devDeps: [
    'copyfiles',
    '@playwright/test',
    'aws-sdk-client-mock',
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
      testPathIgnorePatterns: ['/node_modules/', '/cdk.out', '/test/playwright'],
      roots: ['src', 'test'],
    },
  },
  scripts: {
    'install:login': 'copyfiles -f src/app/templates/* assets/app/login/login.lambda/templates && copyfiles -f src/app/templates/* src/app/login/templates',
    'install:issue': 'copyfiles -f src/app/templates/* assets/app/issue/issue.lambda/templates && copyfiles -f src/app/templates/* src/app/issue/templates',
    'install:logout': 'copyfiles -f src/app/templates/* assets/app/logout/logout.lambda/templates && copyfiles -f src/app/templates/* src/app/logout/templates',
  },
  eslintOptions: {
    devdirs: ['src/app/logout/tests', '/test', '/build-tools'],
  },
  gitignore: [
    '.env',
    '.vscode',
    'src/app/**/templates',
    'src/app/**/tests/output',
    '.DS_Store',
    'test/playwright/report',
    'test/playwright/screenshots',
  ],
});

// During bundling copy the templates to lambda deployment directories
project.tasks.tryFind('bundle:app/issue/issue.lambda').exec('npx projen install:issue');
project.tasks.tryFind('bundle:app/login/login.lambda').exec('npx projen install:login');
project.tasks.tryFind('bundle:app/logout/logout.lambda').exec('npx projen install:logout');

project.synth();