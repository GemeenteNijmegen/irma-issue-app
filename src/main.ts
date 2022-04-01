import { App } from 'aws-cdk-lib';
import { AppStage } from './AppStage';
import { ParameterStage } from './ParameterStage';

const deploymentEnvironment = {
  account: '418648875085',
  region: 'eu-west-1',
};

const sandboxEnvironment = {
  account: '122467643252',
  region: 'eu-west-1',
};

const acceptanceEnvironment = {
  account: '315037222840',
  region: 'eu-west-1',
};

const productionEnvironment = {
  account: '196212984627',
  region: 'eu-west-1',
};

const app = new App();

// TODO: configure different pipelines per environment with different configurations for each environment.
new AppStage(app, 'irma-issue-app', {
  enableManualAuthentication: true, // Never enable in production!
  enableIrmaAuthentication: true,
  branch: 'acceptance',
});

new ParameterStage(app, 'irma-issue-app-parameters', {
  defaultsEnvFile: 'sandbox',
});

app.synth();