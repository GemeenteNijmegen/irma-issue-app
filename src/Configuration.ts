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
   * Note: key should be withou domain suffix (only subdomain).
   */
  readonly cnameRecords?: {[key: string]: string};

  /**
   * If the issue lambda uses the demo scheme or the production scheme.
   * Note: shoud never be false except in prod.
   */
  readonly useDemoScheme: boolean;

  /**
   * The region where the backend server is located
   */
  readonly issueServerRegion: string;


  /**
   * Use nijmegen record in CloudFront
   */
  readonly useNijmegenRecordInCloudFront: boolean;

}

export function getConfiguration(branchName: string): Configuration {
  if (Object.keys(configurations).includes(branchName)) {
    return configurations[branchName];
  }
  throw Error(`No configuration found for branch name ${branchName}`);
}

const configurations: { [name: string] : Configuration } = {
  'acceptance-new-lz': {
    branchName: 'acceptance-new-lz',
    pipelineStackName: 'yivi-issue-pipeline-acceptance',
    deployFromEnvironment: Statics.gnBuildEnvironment,
    deployToEnvironment: Statics.gnYiviAccpEnvironment,
    codeStarConnectionArn: Statics.codeStarConnectionArnNewLz,
    includePipelineValidationChecks: false,
    setWafRatelimit: false, // False for pentesting?
    useDemoScheme: true,
    nijmegenSubdomain: 'yivi.accp', // yivi.accp.nijmegen.nl
    issueServerRegion: 'eu-west-1',
    cnameRecords: {
      _9699982ccd3555be4d8f02a487a0287e: '_1d0dce24777d3d1257367aa28e6816c7.fgsdscwdjl.acm-validations.aws',
    },
    useNijmegenRecordInCloudFront: false, // Otherwise we cannot deploy the CF dist
  },
  'production-new-lz': {
    branchName: 'production-new-lz',
    pipelineStackName: 'yivi-issue-pipeline-production',
    deployFromEnvironment: Statics.deploymentEnvironment,
    deployToEnvironment: Statics.gnYiviProdEnvironment,
    codeStarConnectionArn: Statics.codeStarConnectionArn,
    includePipelineValidationChecks: false,
    setWafRatelimit: true,
    useDemoScheme: false,
    nijmegenSubdomain: 'yivi', // yivi.nijmegen.nl
    issueServerRegion: 'eu-west-1',
    // cnameRecords: {
    //   '': '',
    // },
    useNijmegenRecordInCloudFront: false, // Otherwise we cannot deploy the CF dist
  },
};