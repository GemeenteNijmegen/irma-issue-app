const { awscdk } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  name: 'irma-issue-app',
  gitignore: [
    'src/app/**/node_modules',
    'src/app/**/shared',
  ],
  devDeps: [
    'copyfiles',
  ],
  scripts: {
    'install:home': 'copyfiles -f src/shared/*.js src/app/home/shared && cd src/app/home && npm install',
    'install:issue': 'copyfiles -f src/shared/*.js src/app/issue/shared && cd src/app/issue && npm install',
    'install:manual_auth': 'copyfiles -f src/shared/*.js src/app/manual_auth/shared && cd src/app/manual_auth && npm install',
    'postinstall': 'npm run install:home && npm run install:issue && npm run install:manual_auth',
    'deploy:full': 'npx cdk deploy irma-issue-app/assets-stack irma-issue-app/api-stack irma-issue-app/sessions-stack',
  },
  deps: [
    '@aws-solutions-constructs/aws-lambda-dynamodb@2.0.0',
    'dotenv@16.0.0',
  ],
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();