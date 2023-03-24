import { Environment as CdkEnvironment } from 'aws-cdk-lib';
import { Statics } from './statics';

export interface Configurable {
  readonly configuration: Configuration;
}

/**
 * Make account and region required
 */
export interface Environment extends CdkEnvironment {
  account: string;
  region: string;
}

export interface Configuration {
  readonly deployFromEnvironment: Environment;
  readonly deployToEnvironment: Environment;
  readonly codeStarConnectionArn: string;
  readonly pipelineStackName: string;

  /**
   * The branch name this configuration is used for
   */
  readonly branchName: string;

  /**
   * If set a certificate for <value>.nijmegen.nl will be
   * generated in acm. This domain is also used in the
   * cloudfront domain names.
   * Note: enabling required adding cname records to nijmegen.nl
   */
  readonly nijmegenSubdomain?: string;

  /**
   * includePipelineValidationChcks
   */
  readonly includePipelineValidationChecks: boolean;

  /**
   * Flag to indicate the waf ratelimit should be
   * blocked or counted
   */
  readonly setWafRatelimit: boolean;

  /**
   * A list of CNAME records to register in the hosted zone
   */
  readonly cnameRecords?: {[key: string]: string};

  /**
   * If the issue lambda uses the demo scheme or the production scheme.
   * Note: shoud only be true in production
   */
  readonly useDemoScheme: boolean;

}

export function getConfiguration(branchName: string): Configuration {
  if (Object.keys(configurations).includes(branchName)) {
    return configurations[branchName];
  }
  throw Error(`No configuration found for branch name ${branchName}`);
}

const configurations: { [name: string] : Configuration } = {
  acceptance: {
    branchName: 'acceptance',
    pipelineStackName: 'yivi-issue-pipeline-acceptance',
    deployFromEnvironment: Statics.deploymentEnvironment,
    deployToEnvironment: Statics.acceptanceEnvironment,
    codeStarConnectionArn: Statics.codeStarConnectionArn,
    includePipelineValidationChecks: false,
    setWafRatelimit: false, // False for pentesting?
    useDemoScheme: true,
    nijmegenSubdomain: 'yivi.accp', // yivi.accp.nijmegen.nl
    cnameRecords: {
      '_2efd09bc809f1129572f073cb0873936.yivi-issue.accp.csp-nijmegen.nl': '_37726a837615087fa929e1970e5ad7c2.hsmgrxbjqd.acm-validations.aws',
    },
  },
  production: {
    branchName: 'production',
    pipelineStackName: 'yivi-issue-pipeline-production',
    deployFromEnvironment: Statics.deploymentEnvironment,
    deployToEnvironment: Statics.productionEnvironment,
    codeStarConnectionArn: Statics.codeStarConnectionArn,
    includePipelineValidationChecks: false,
    setWafRatelimit: true,
    useDemoScheme: true, // For now keep this true, so we do not issue valid attributes untill everything works
    nijmegenSubdomain: 'yivi', // yivi.nijmegen.nl
    cnameRecords: undefined,
  },
};