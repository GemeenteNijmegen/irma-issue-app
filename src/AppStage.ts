import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiStack } from './ApiStack';
import { AssetsStack } from './AssetsStack';
import { CloudFrontStack } from './CloudFrontStack';
import { DnsStack } from './DnsStack';
import { KeyStack } from './KeyStack';
import { SessionsStack } from './SessionsStack';

export interface AppStageProps extends cdk.StageProps {
  enableManualAuthentication : boolean; // should never be enabled in production!!
  enableIrmaAuthentication : boolean;
  branch: string;
}

export class AppStage extends cdk.Stage {

  constructor(scope : Construct, id : string, props : AppStageProps) {
    super(scope, id, props);

    const keyStack = new KeyStack(this, 'key-stack');
    const sessionsStack = new SessionsStack(this, 'sessions-stack', { key: keyStack.key });
    new DnsStack(this, 'dns-stack', { branch: props.branch });

    // TODO fix certificates and dsnsec
    // const usEastCertificateStack = new UsEastCertificateStack(this, 'us-cert-stack', { branch: props.branch, env: { region: 'us-east-1' } });
    // const dnssecStack = new DNSSECStack(this, 'dnssec-stack', { branch: props.branch, env: { region: 'us-east-1' } });
    // usEastCertificateStack.addDependency(dnsStack);
    // dnssecStack.addDependency(dnsStack);

    const assetsStack = new AssetsStack(this, 'assets-stack');

    const apiStack = new ApiStack(this, 'api-stack', {
      assetsUrl: assetsStack.url,
      enableManualAuthentication: props.enableManualAuthentication,
      enableIrmaAuthentication: props.enableIrmaAuthentication,
      sessionsTable: sessionsStack.sessionsTable,
    });

    new CloudFrontStack(this, 'cloud-front-stack', {
      branch: props.branch,
      hostDomain: apiStack.getApiGatewayDomain(),
      certificateArn: '',
    });
    // cloudfrontStack.addDependency(usEastCertificateStack);

  }

}