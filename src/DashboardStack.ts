import {
  Stack,
  StackProps,
  aws_cloudwatch as cloudwatch,
  aws_ssm as ssm,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Statics } from './statics';


export class DashboardStack extends Stack {

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Import the log group containing the statistics logging through ssm
    const logGroup = ssm.StringParameter.valueForStringParameter(this, Statics.ssmStatisticsLogGroup);

    // Create the widgets
    const piePerGemeente = this.createPieChartPerGemeente(logGroup);

    // Create the layout
    const layout = [
      [piePerGemeente],
    ];

    // Create the dashboard
    this.createDashboard(layout);

  }

  createPieChartPerGemeente(logGroup: string) {
    return new cloudwatch.LogQueryWidget({
      logGroupNames: [logGroup],
      view: cloudwatch.LogQueryVisualizationType.PIE,
      queryLines: [
        'fields subject, gemeente',
        'filter not isempty(subject)',
        'stats count(subject) by gemeente',
      ],
    });
  }

  /**
   * Create the CloudWatch Dashboard
   * @param layout 2d array (each array specifies a row of widges)
   */
  createDashboard(layout: cloudwatch.IWidget[][]) {
    new cloudwatch.Dashboard(this, 'dashboard', {
      dashboardName: 'IRMA-issue-statistics',
      widgets: layout,
    });
  }

}