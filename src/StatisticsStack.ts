import { Stack, aws_ssm as SSM, StackProps, aws_kms as KMS } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Statics } from './statics';
import { StatisticsTable } from './StatisticsTable';

export interface StatisticsStackProps extends StackProps {
  key?: KMS.Key;
}

/**
 * Statistics are stored in dynamo db table. Possibly define lambda / other resources here
 * for providing insights in the collected statistics
 */
export class StatisticsStack extends Stack {
  statisticsTable : StatisticsTable;

  constructor(scope: Construct, id: string, props: StatisticsStackProps) {
    super(scope, id);
    this.statisticsTable = new StatisticsTable(this, 'statistics-table', { key: props.key });

    new SSM.StringParameter(this, 'ssm_sessions_1', {
      stringValue: this.statisticsTable.table.tableArn,
      parameterName: Statics.ssmSessionsTableArn,
    });
  }
}