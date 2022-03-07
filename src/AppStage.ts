import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiStack } from './ApiStack';
import { AssetsStack } from './AssetsStack';


export class AppStage extends cdk.Stage {

  constructor(scope : Construct, id : string, props? : cdk.StageProps) {
    super(scope, id, props);

    const assetsStack = new AssetsStack(this, 'assets-stack');
    new ApiStack(this, 'api-stack', { assetsUrl: assetsStack.url });

  }

}