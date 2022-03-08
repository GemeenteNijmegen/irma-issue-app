import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiStack } from './ApiStack';
import { AssetsStack } from './AssetsStack';
import { SessionsStack } from './SessionsStack';

export interface AppStageProps extends cdk.StageProps {
  enableManualAuthentication : boolean; // should never be enabled in production!!
  enableIrmaAuthentication : boolean;
}

export class AppStage extends cdk.Stage {

  constructor(scope : Construct, id : string, props : AppStageProps) {
    super(scope, id, props);

    const sessionsStack = new SessionsStack(this, 'sessions-stack');
    const assetsStack = new AssetsStack(this, 'assets-stack');
    new ApiStack(this, 'api-stack', {
      assetsUrl: assetsStack.url,
      enableManualAuthentication: props.enableManualAuthentication,
      enableIrmaAuthentication: props.enableIrmaAuthentication,
      sessionsTable: sessionsStack.sessionsTable,
    });

  }

}