import { aws_dynamodb as DynamoDB, aws_kms as KMS, RemovalPolicy, StackProps } from 'aws-cdk-lib';
import { TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { Statics } from './statics';

export interface StatisticsTableProps extends StackProps {
  /**
   * If no key provided use AWS_MANAGED key
   */
  key?: KMS.Key;
}

export class StatisticsTable extends Construct {
  table: DynamoDB.Table;
  constructor(scope: Construct, id: string, props: StatisticsTableProps) {

    super(scope, id);
    this.table = new DynamoDB.Table(this, 'statistics-table', {
      partitionKey: { name: 'subject', type: DynamoDB.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: DynamoDB.AttributeType.NUMBER },
      billingMode: DynamoDB.BillingMode.PAY_PER_REQUEST,
      tableName: Statics.statisticsTableName,
      timeToLiveAttribute: 'ttl',
      removalPolicy: RemovalPolicy.RETAIN,
      encryptionKey: props.key,
      encryption: props.key ? TableEncryption.CUSTOMER_MANAGED : TableEncryption.AWS_MANAGED,
    });
  }
}