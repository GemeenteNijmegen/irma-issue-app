import { Stack, StackProps, Tags, pipelines, Environment } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AppStage } from './AppStage';
import { ParameterStage } from './ParameterStage';
import { Statics } from './statics';

export interface PipelineStackProps extends StackProps {
    branchName: string;
    deployToEnvironment: Environment;
    defaultsEnvFile: string;
    enableIrmaAuthentication: boolean;
    enableManualAuthentication: boolean;
}

export class PipelineStack extends Stack {
    branchName: string;
    constructor(scope: Construct, id: string, props: PipelineStackProps) {
        super(scope, id, props);
        Tags.of(this).add('cdkManaged', 'yes');
        Tags.of(this).add('Project', Statics.projectName);
        
        this.branchName = props.branchName;
        const pipeline = this.pipeline();

        pipeline.addStage(new ParameterStage(this, 'irma-issue-parameters', { 
            env: props.deployToEnvironment,
            defaultsEnvFile: props.defaultsEnvFile,
        }));
        pipeline.addStage(new AppStage(this, 'irma-issue-api', { 
            env: props.deployToEnvironment, 
            branch: this.branchName,
            enableIrmaAuthentication: props.enableIrmaAuthentication,
            enableManualAuthentication: props.enableManualAuthentication,
        }));
    }

    pipeline(): pipelines.CodePipeline {
        const source = pipelines.CodePipelineSource.connection('GemeenteNijmegen/irma-issue-app', this.branchName, {
            connectionArn: Statics.codeStarConnectionArn,
        });
        const pipeline = new pipelines.CodePipeline(this, `irma-issue-app-${this.branchName}`, {
            pipelineName: `irma-issue-app-${this.branchName}`,
            dockerEnabledForSelfMutation: true,
            dockerEnabledForSynth: true,
            crossAccountKeys: true,
            synth: new pipelines.ShellStep('Synth', {
                input: source,
                env: {
                    BRANCH_NAME: this.branchName,
                },
                commands: [
                    'yarn install --frozen-lockfile',
                    'npx projen build',
                    'npx projen synth',
                ],
            }),
        });
        return pipeline;
    }
}