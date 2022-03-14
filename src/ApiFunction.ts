import { LambdaToDynamoDB } from '@aws-solutions-constructs/aws-lambda-dynamodb';
import { aws_lambda as Lambda, aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface ApiFunctionProps {
  handler: string;
  description: string;
  source: string;
  table: dynamodb.Table;
  tablePermissions : string;
  environment?: { [key: string]: string };
}

export class ApiFunction extends Construct {

  lambda: Lambda.Function;

  constructor(scope: Construct, id: string, props: ApiFunctionProps) {
    super(scope, id);

    this.lambda = new Lambda.Function(this, 'lambda', {
      runtime: Lambda.Runtime.NODEJS_14_X,
      handler: props.handler,
      description: props.description,
      code: Lambda.Code.fromAsset(props.source),
      environment: {
        ...props.environment,
      },
    });

    // Add dynamodb access to lambda if required
    new LambdaToDynamoDB(this, 'lambda-with-db', {
      existingLambdaObj: this.lambda,
      existingTableObj: props.table,
      tablePermissions: props.tablePermissions,
      tableEnvironmentVariableName: 'SESSION_TABLE',
    });

  }
}