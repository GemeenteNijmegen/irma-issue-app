import { App } from 'aws-cdk-lib';
import * as Dotenv from 'dotenv';
import { getConfiguration } from './Configuration';
import { PipelineStack } from './PipelineStack';

Dotenv.config();
const app = new App();

const branchToBuild = process.env.BRANCH_NAME ?? 'acceptance';
const configuration = getConfiguration(branchToBuild);

console.log('Building branch:', branchToBuild);

new PipelineStack(app, 'irma-issue-pipeline-acceptance',
  {
    env: configuration.deployFromEnvironment,
    configuration: configuration,
  },
);

app.synth();