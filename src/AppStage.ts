import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiStack } from './ApiStack';
import { AssetsStack } from './AssetsStack';
import { CloudFrontStack } from './CloudFrontStack';
import { DnsStack } from './DnsStack';
import { SessionsStack } from './SessionsStack';

export interface AppStageProps extends cdk.StageProps {
  enableManualAuthentication : boolean; // should never be enabled in production!!
  enableIrmaAuthentication : boolean;
  branch: string;
}

export class AppStage extends cdk.Stage {

  constructor(scope : Construct, id : string, props : AppStageProps) {
    super(scope, id, props);

    new DnsStack(this, 'dns-stack', { branch: props.branch });
    const sessionsStack = new SessionsStack(this, 'sessions-stack');
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

  }

}