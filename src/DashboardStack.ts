import {
  Stack,
  StackProps,
  aws_cloudwatch as cloudwatch,
  aws_ssm as ssm,
} from 'aws-cdk-lib';
import { LogQueryVisualizationType as Visualization } from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import { Statics } from './statics';


export class DashboardStack extends Stack {

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Import the log group containing the statistics logging through ssm
    const logGroup = ssm.StringParameter.valueForStringParameter(this, Statics.ssmStatisticsLogGroup);

    // Create the widgets
    const timeLine = this.createTimeLineWidget(logGroup);
    const piePerGemeente = this.createIssuePerGemeente(logGroup, Visualization.PIE);
    const tablePerGemeente = this.createIssuePerGemeente(logGroup, Visualization.TABLE);
    const tableDuplicateIssues = this.createDuplicateIssueWidget(logGroup);
    const errorOccurences = this.createErrorOccurencesWidget(logGroup);

    // Create the layout
    const layout = [
      [timeLine],
      [piePerGemeente, tablePerGemeente, tableDuplicateIssues],
      [errorOccurences],
    ];

    // Create the dashboard
    this.createDashboard(layout);

  }

  /**
   * Note: this includes front-end error (from irma.js) that are send
   * using the callback function only. Other lambdas have their own logging
   * and are not included in this widget.
   * @param logGroup
   * @returns
   */
  createErrorOccurencesWidget(logGroup: string) {
    return new cloudwatch.LogQueryWidget({
      title: 'Errors and occurences',
      width: 8,
      height: 12,
      logGroupNames: [logGroup],
      view: Visualization.TABLE,
      queryLines: [
        'fields error, nr_of_occurences',
        'stats count(error) as nr_of_occurences by error',
        'filter not isempty(subject) and not isempty(error) and error not like "undefined"',
      ],
    });
  }

  createDuplicateIssueWidget(logGroup: string) {
    return new cloudwatch.LogQueryWidget({
      title: 'Multiple issue subjects',
      width: 8,
      height: 12,
      logGroupNames: [logGroup],
      view: Visualization.TABLE,
      queryLines: [ // TODO not the best way to list this (however we are running into limitations of cloudwatch here)
        'fields gemeente',
        'filter not isempty(subject) and nr_of_issues_per_subject > 1',
        'stats count(subject) as nr_of_issues_per_subject by gemeente, subject',
      ],
    });
  }

  createTimeLineWidget(logGroup: string) {
    return new cloudwatch.LogQueryWidget({
      title: 'Issue events per hour',
      width: 24,
      height: 6,
      logGroupNames: [logGroup],
      view: Visualization.LINE,
      queryLines: [
        'fields success =  1 as r1, success = 0 as r2',
        'filter not isempty(subject)',
        'stats sum(r1) as successful, sum(r2) as failed by bin(1h)',
      ],
    });
  }

  createIssuePerGemeente(logGroup: string, view: cloudwatch.LogQueryVisualizationType) {
    return new cloudwatch.LogQueryWidget({
      title: 'Issue events per gemeente',
      width: 8,
      height: 12,
      logGroupNames: [logGroup],
      view,
      queryLines: [
        'fields subject, gemeente',
        'filter not isempty(subject)',
        'stats count(subject) as counts by gemeente',
        'sort gemeente',
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