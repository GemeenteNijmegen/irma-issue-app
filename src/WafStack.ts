import { ArnFormat, aws_ssm as SSM, aws_wafv2, Stack, StackProps } from 'aws-cdk-lib';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { Configurable } from './Configuration';
import { Statics } from './statics';

export interface WafStackProps extends StackProps, Configurable {

}

export class WafStack extends Stack {
  constructor(scope: Construct, id: string, props: WafStackProps) {
    super(scope, id, props);

    let rateBasedStatementAction: object = { block: {} };
    if (!props.configuration.setWafRatelimit) {
      rateBasedStatementAction = { count: {} };
    }

    const acl = new aws_wafv2.CfnWebACL(this, 'waf-yiviIssueApp', {
      defaultAction: { allow: {} },
      description: 'used for the yivi issue app',
      name: 'yiviIssueAppWaf',
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'yiviIssueApp-web-acl',
      },
      rules: [
        {
          priority: 0,
          // Disable for now as we search engines may visit this site and meta data tags must be accessible by social media
          overrideAction: { count: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-ManagedRulesBotControlRuleSet',
          },
          name: 'AWS-ManagedRulesBotControlRuleSet',
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesBotControlRuleSet',
              // We want to be able to allow certain UA's access (internet.nl), count them here and block most later on
              excludedRules: [
                {
                  name: 'SignalNonBrowserUserAgent',
                },
              ],
            },
          },
        },
        // After counting the SignalNonBrowserUserAgent matches, block all except the excluded ua
        // {
        //   priority: 1,
        //   name: 'BlockMostNonBrowserUserAgents',
        //   statement: {
        //     andStatement: {
        //       statements: [
        //         {
        //           labelMatchStatement: {
        //             scope: 'LABEL',
        //             key: 'awswaf:managed:aws:bot-control:signal:non_browser_user_agent',
        //           },
        //         },
        //         {
        //           notStatement: {
        //             statement: {
        //               byteMatchStatement: {
        //                 fieldToMatch: {
        //                   singleHeader: {
        //                     Name: 'user-agent',
        //                   },
        //                 },
        //                 positionalConstraint: 'EXACTLY',
        //                 searchString: 'internetnl/1.0',
        //                 textTransformations: [
        //                   {
        //                     priority: 0,
        //                     type: 'NONE',
        //                   },
        //                 ],
        //               },
        //             },
        //           },
        //         },
        //       ],
        //     },
        //   },
        //   ruleLabels: [],
        //   action: {
        //     block: {},
        //   },
        //   visibilityConfig: {
        //     sampledRequestsEnabled: true,
        //     cloudWatchMetricsEnabled: true,
        //     metricName: 'AWS-ManagedRulesBotControlRuleSet',
        //   },
        // },
        {
          priority: 10,
          action: rateBasedStatementAction,
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-RateBasedStatement',
          },
          name: 'RateBasedStatement',
          statement: {
            rateBasedStatement: {
              aggregateKeyType: 'IP',
              //Valid Range: Minimum value of 100. Maximum value of 2000000000.
              limit: 500,
            },
          },
        },
        {
          priority: 20,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AmazonIpReputationList',
          },
          name: 'AWS-AmazonIpReputationList',
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAmazonIpReputationList',
            },
          },
        },
        {
          priority: 30,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesCommonRuleSet',
          },
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
        },
      ],

      scope: 'CLOUDFRONT',
    });

    new SSM.StringParameter(this, 'yivi-issue-acl-id', {
      stringValue: acl.attrArn,
      parameterName: Statics.ssmWafAclArn,
    });

    this.setupWafLogging(acl);
  }

  private setupWafLogging(acl: aws_wafv2.CfnWebACL) {
    const logGroupArn = this.logGroupArn();

    new aws_wafv2.CfnLoggingConfiguration(this, 'waf-logging', {
      logDestinationConfigs: [logGroupArn],
      resourceArn: acl.attrArn,
    });

  }

  /** WafV2 doesn't return the correct form for its ARN.
   * workaround to format correctly
   * https://github.com/aws/aws-cdk/issues/18253
   */
  private logGroupArn() {
    const logGroup = new LogGroup(this, 'waf-logs', {
      logGroupName: 'aws-waf-logs-yivi-issue-app',
    });

    const logGroupArn = this.formatArn({
      arnFormat: ArnFormat.COLON_RESOURCE_NAME,
      service: 'logs',
      resource: 'log-group',
      resourceName: logGroup.logGroupName,
    });
    return logGroupArn;
  }
}