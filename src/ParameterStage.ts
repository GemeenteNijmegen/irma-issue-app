import * as Path from 'path';
import * as cdk from 'aws-cdk-lib';
import { aws_ssm as SSM, aws_secretsmanager as SecretsManager } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
import { Statics } from './Statics';

export interface ParameterStageProps extends cdk.StageProps {
  defaultsEnvFile: string;
}

/**
 * Stage for deploying the parameter stack
 */
export class ParameterStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: ParameterStageProps) {
    super(scope, id, props);

    new ParameterStack(this, 'params', {
      defaultsEnvFile: props.defaultsEnvFile,
    });
  }
}

export interface ParameterStackProps extends cdk.StackProps {
  defaultsEnvFile: string;
}

/**
 * The stack that holds all parameters for the irma issue app
 */
export class ParameterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ParameterStackProps) {
    super(scope, id);

    // Load environment file with defauls for the configured environment
    const file = props.defaultsEnvFile + '.env';
    const path = Path.join(__dirname, 'params', file);
    dotenv.config({ path: path });

    /**
     * IRMA Server parameters
     */
    new SecretsManager.Secret(this, 'irma-server-iam-secret-key', {
      secretName: Statics.irmaIssueServerSecretKey,
      description: 'AWS IAM uses for irma issue access secret key',
    });

    new SecretsManager.Secret(this, 'irma-server-iam-access-key', {
      secretName: Statics.irmaIssueServerSecretKey,
      description: 'AWS IAM uses for irma issue access secret key',
    });

    new SSM.StringParameter(this, 'irma-server-iam-zone', {
      stringValue: this.getOrDefault('IRMA_ISSUE_SERVER_IAM_ZONE', 'eu-west-1'),
      parameterName: Statics.irmaIssueServerZone,
    });

    new SSM.StringParameter(this, 'irma-server-endpoint', {
      stringValue: this.getOrDefault('IRMA_ISSUE_SERVER_ENDPOINT', 'https://gw-test.nijmegen.nl/irma/session'),
      parameterName: Statics.iramIssueServerEndpoint,
    });

    new SSM.StringParameter(this, 'irma-namespace', {
      stringValue: this.getOrDefault('IRMA_NAMESPACE', 'irma-demo'),
      parameterName: Statics.irmaNamespace,
    });

    new SecretsManager.Secret(this, 'irma-api-key', {
      secretName: Statics.irmaApiKey,
      description: 'API key to for authentication at irma server',
    });

    /**
     * BRP Server parameters
     */
    new SSM.StringParameter(this, 'brp-endpoint', {
      stringValue: this.getOrDefault('BRP_ENDPOINT', 'https://data-test.nijmegen.nl/TenT/Bevraging/Irma'),
      parameterName: Statics.brpEndpoint,
    });

    new SSM.StringParameter(this, 'brp-certificate', {
      stringValue: '<Insert brp certificate trough console>',
      parameterName: Statics.brpCertificate,
    });

    new SecretsManager.Secret(this, 'brp-certificate-key', {
      secretName: Statics.brpCertificateKey,
      description: 'Private key to the brp client certificate',
    });

  }

  getOrDefault(env: string, defaultvalue: string) {
    const x = process.env?.[env];
    if (typeof x === 'undefined') {return defaultvalue;} else {return x;}
  }

}