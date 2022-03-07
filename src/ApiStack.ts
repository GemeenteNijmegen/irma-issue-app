import * as Path from 'path';
import * as cdk from 'aws-cdk-lib';
import { aws_apigateway as apiGateway } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';


export interface ApiStackProps extends cdk.StackProps {
  assetsUrl : string;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Construct a home lambda
    const homeLambda = new lambda.Function(this, 'home', {
      runtime: Runtime.NODEJS_14_X,
      handler: 'index.handler',
      description: 'Home lambda for IRMA issue app',
      code: lambda.Code.fromAsset(Path.join(__dirname, 'app', 'home')),
      environment: {
        ASSETS_URL: props.assetsUrl,
      },
    });

    // Create the API gateway itself
    const api = new apiGateway.RestApi(this, 'irma-issue-gateway');

    // Add each of the different resources
    const home = api.root.addResource('home');
    home.addMethod('GET', new apiGateway.LambdaIntegration(homeLambda));

  }
}