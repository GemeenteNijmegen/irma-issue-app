// ~~ Generated by projen. To modify, edit .projenrc.js and run "npx projen".
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

/**
 * Props for LogoutFunction
 */
export interface LogoutFunctionProps extends lambda.FunctionOptions {
}

/**
 * An AWS Lambda function which executes src/app/logout/logout.
 */
export class LogoutFunction extends lambda.Function {
  constructor(scope: Construct, id: string, props?: LogoutFunctionProps) {
    super(scope, id, {
      description: 'src/app/logout/logout.lambda.ts',
      ...props,
      runtime: new lambda.Runtime('nodejs14.x', lambda.RuntimeFamily.NODEJS),
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../assets/app/logout/logout.lambda')),
    });
    this.addEnvironment('AWS_NODEJS_CONNECTION_REUSE_ENABLED', '1', { removeInEdge: true });
  }
}