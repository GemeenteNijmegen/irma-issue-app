import { App, Aspects, IAspect, Tags } from 'aws-cdk-lib';
import { IConstruct } from 'constructs';
import * as Dotenv from 'dotenv';
import { PipelineStackAcceptance } from './PipelineStackAcceptance';
import { PipelineStackDevelopment } from './PipelineStackDevelopment';
import { PipelineStackProduction } from './PipelineStackProduction';
import { Statics } from './statics';

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

Dotenv.config();
const app = new App();


if ('BRANCH_NAME' in process.env == false || process.env.BRANCH_NAME == 'development') {
  new PipelineStackDevelopment(app, 'irma-issue-pipeline-development',
    {
      env: deploymentEnvironment,
      branchName: 'development',
      deployToEnvironment: sandboxEnvironment,
    },
  );
} else if (process.env.BRANCH_NAME == 'acceptance') {
  new PipelineStackAcceptance(app, 'irma-issue-pipeline-acceptance',
    {
      env: deploymentEnvironment,
      branchName: 'acceptance',
      deployToEnvironment: acceptanceEnvironment,
    },
  );
} else if (process.env.BRANCH_NAME == 'production') {
  new PipelineStackProduction(app, 'irma-issue-pipeline-production',
    {
      env: deploymentEnvironment,
      branchName: 'production',
      deployToEnvironment: productionEnvironment,
    },
  );
}

class MyAspect implements IAspect {
  visit(node: IConstruct): void {
    //if (node.node.id == 'Resource') {
    //  console.log(node.node.path);
    Tags.of(node).add('Project', Statics.projectName);
    Tags.of(node).add('CdkManaged', 'yes');
    //}
  }

}

Aspects.of(app).add(new MyAspect());

app.synth();