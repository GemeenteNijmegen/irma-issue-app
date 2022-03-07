import { App } from 'aws-cdk-lib';
import { AppStage } from './AppStage';

// For now only deploy to sandbox trough cli no need to define an environment.
// const sandboxEnvironment = {
//   account: '122467643252',
//   region: 'eu-west-1',
// };

const app = new App();

new AppStage(app, 'irma-issue-app');

app.synth();