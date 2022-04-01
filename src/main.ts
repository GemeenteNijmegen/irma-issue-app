import { App } from 'aws-cdk-lib';
import { PipelineStackAcceptance } from './PipelineStackAcceptance';
import { PipelineStackDevelopment } from './PipelineStackDevelopment';
import { PipelineStackProduction } from './PipelineStackProduction';

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

if ('BRANCH_NAME' in process.env == false || process.env.BRANCH_NAME == 'development') {
  new PipelineStackDevelopment(app, 'irma-issue-pipeline-development',
    {
      env: sandboxEnvironment,
      branchName: 'development',
      deployToEnvironment: sandboxEnvironment,
      defaultsEnvFile: 'sandbox',
      enableIrmaAuthentication: true,
      enableManualAuthentication: true,
    },
  );
} else if (process.env.BRANCH_NAME == 'acceptance') {
  new PipelineStackAcceptance(app, 'irma-issue-pipeline-acceptance',
    {
      env: deploymentEnvironment,
      branchName: 'development',
      deployToEnvironment: acceptanceEnvironment,
      defaultsEnvFile: 'sandbox',
      enableIrmaAuthentication: true,
      enableManualAuthentication: true,
    },
  );
} else if (process.env.BRANCH_NAME == 'production') {
  new PipelineStackProduction(app, 'irma-issue-pipeline-production',
    {
      env: deploymentEnvironment,
      branchName: 'development',
      deployToEnvironment: productionEnvironment,
      defaultsEnvFile: 'sandbox',
      enableIrmaAuthentication: false, // Never enable in production!
      enableManualAuthentication: false, // Never enable in production!
    },
  );
}

app.synth();