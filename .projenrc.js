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
    'postinstall': 'npm run install:home',
  },
  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();