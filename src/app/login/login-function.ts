// ~~ Generated by projen. To modify, edit .projenrc.js and run "npx projen".
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

/**
 * Props for LoginFunction
 */
export interface LoginFunctionProps extends lambda.FunctionOptions {
}

/**
 * An AWS Lambda function which executes src/app/login/login.
 */
export class LoginFunction extends lambda.Function {
  constructor(scope: Construct, id: string, props?: LoginFunctionProps) {
    super(scope, id, {
      description: 'src/app/login/login.lambda.ts',
      ...props,
      runtime: new lambda.Runtime('nodejs14.x', lambda.RuntimeFamily.NODEJS),
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../assets/app/login/login.lambda')),
    });
    this.addEnvironment('AWS_NODEJS_CONNECTION_REUSE_ENABLED', '1', { removeInEdge: true });
  }
}