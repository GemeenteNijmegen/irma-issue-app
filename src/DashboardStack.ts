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
    const statisticsLogGroup = ssm.StringParameter.valueForStringParameter(this, Statics.ssmStatisticsLogGroup);
    const tickenLogGroup = ssm.StringParameter.valueForStringParameter(this, Statics.ssmStatisticsLogGroup);

    // Create the widgets
    const timeLine = this.createTimeLineWidget(statisticsLogGroup);
    const piePerGemeente = this.createIssuePiePerGemeente(statisticsLogGroup);
    const tablePerGemeente = this.createIssueTablePerGemeente(statisticsLogGroup);
    const tableTotalIssued = this.createTotalIssued(statisticsLogGroup);
    const tableDuplicateIssues = this.createDuplicateIssueWidget(statisticsLogGroup);
    const tickenTimeLine = this.createTimelineTickenWidget(tickenLogGroup);

    // Create the layout
    const layout = [
      [timeLine],
      [tableTotalIssued, tickenTimeLine],
      [piePerGemeente, tablePerGemeente, tableDuplicateIssues],
    ];

    // Create the dashboard
    this.createDashboard(layout);

  }

  createDuplicateIssueWidget(logGroup: string) {
    return new cloudwatch.LogQueryWidget({
      title: 'Multiple issue subjects',
      width: 8,
      height: 12,
      logGroupNames: [logGroup],
      view: Visualization.TABLE,
      queryLines: [ // not the best way to list this (however we are running into limitations of cloudwatch here)
        'fields gemeente',
        'filter not isempty(subject) and nr_of_issues_per_subject > 1',
        'stats count(subject) as nr_of_issues_per_subject by gemeente, subject',
        'sort gemeente',
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
        'filter not isempty(subject)',
        'stats count(subject) as issued by bin(1h)',
      ],
    });
  }

  createTimelineTickenWidget(logGroup: string) {
    return new cloudwatch.LogQueryWidget({
      title: 'BRP and DigiD requests per hour',
      width: 16,
      height: 6,
      logGroupNames: [logGroup],
      view: Visualization.LINE,
      queryLines: [
        'fields @message like /TICK\: BRP/ as brp, @message like /TICK\: DigiD/ as digid',
        'stats count(brp) as BRP, count(digid) as DigiD by bin(1h)',
      ],
    });
  }

  createIssuePiePerGemeente(logGroup: string) {
    return new cloudwatch.LogQueryWidget({
      title: 'Issue events per gemeente',
      width: 8,
      height: 12,
      logGroupNames: [logGroup],
      view: cloudwatch.LogQueryVisualizationType.PIE,
      queryLines: [
        'fields subject, gemeente',
        'filter not isempty(subject)',
        'stats count(subject) as counts by gemeente',
        'sort gemeente',
      ],
    });
  }

  createIssueTablePerGemeente(logGroup: string ) {
    return new cloudwatch.LogQueryWidget({
      title: 'Issue events per gemeente',
      width: 8,
      height: 12,
      logGroupNames: [logGroup],
      view: cloudwatch.LogQueryVisualizationType.TABLE,
      queryLines: [
        'filter not isempty(subject)',
        'stats count(subject) as issued by gemeente',
        'sort issued desc',
      ],
    });
  }

  createTotalIssued(logGroup: string ) {
    return new cloudwatch.LogQueryWidget({
      title: 'Total issued in time range',
      width: 8,
      height: 4,
      logGroupNames: [logGroup],
      view: cloudwatch.LogQueryVisualizationType.TABLE,
      queryLines: [
        'filter not isempty(subject)',
        'stats count(subject) as issued',
      ],
    });
  }

  /**
   * Create the CloudWatch Dashboard
   * @param layout 2d array (each array specifies a row of widges)
   */
  createDashboard(layout: cloudwatch.IWidget[][]) {
    new cloudwatch.Dashboard(this, 'dashboard', {
      dashboardName: 'YIVI-issue-statistics',
      widgets: layout,
    });
  }

}