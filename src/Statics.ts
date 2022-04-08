export abstract class Statics {
  static readonly projectName: string = 'irma-issue-app';
  static readonly sessionTableName: string = 'irma-issue-sessions';

  /**
   * IRMA IAM parameters
   */
  static readonly irmaIssueServerSecretKey: string = '/irma-issue-app/irma-issue-server-iam/secret-key';
  static readonly irmaIssueServerAccessKey: string = '/irma-issue-app/irma-issue-server-iam/access-key';
  static readonly irmaIssueServerZone: string = '/irma-issue-app/irma-issue-server-iam/zone';
  static readonly iramIssueServerEndpoint: string = '/irma-issue-app/irma-issue-endpoint';
  static readonly irmaNamespace : string = '/irma-issue-app/irma-namespace';
  static readonly irmaApiKey : string = '/irma-issue-app/irma-api-key';

  /**
   * BRP parameters
   */
  static readonly brpCertificate : string = '/irma-issue-app/brp-certificate';
  static readonly brpCertificateKey: string = '/irma-issue-app/brp-certificate-key';
  static readonly brpEndpoint: string = '/irma-issue-app/brp-endpoint';

  /**
   * Hosted zone reference per environment
   */
  static readonly envRootHostedZoneId: string = '/gemeente-nijmegen/account/hostedzone/id';
  static readonly envRootHostedZoneName: string = '/gemeente-nijmegen/account/hostedzone/name';
  static readonly envRootHostedZoneIdOld: string = '/gemeente-nijmegen/formio/hostedzone/id';
  static readonly envRootHostedZoneNameOld: string = '/gemeente-nijmegen/formio/hostedzone/name';

  /**
   * Our hosted zone reference
   */
  static readonly hostedZoneId: string = '/irma-issue-app/hosted-zone/id';
  static readonly hostedZoneName: string = '/irma-issue-app/hosted-zone/name';


  /**
   * Other parameters to keep stacks from getting entangled
   */
  static readonly ssmSessionsTableArn: string = '/irma-issue-app/sessionstable-arn';
  static readonly ssmDataKeyArn: string = '/irma-issue-app/kms-datakey-arn';


  /**
   * Code star connection to github
   */
  static readonly codeStarConnectionArn: string = 'arn:aws:codestar-connections:eu-west-1:418648875085:connection/4f647929-c982-4f30-94f4-24ff7dbf9766';

  /**
   * Construct subdomain name for this app
   * @param branch name of the git branch acceptance / production
   * @returns subdomain prefix depending on branch
   */
  static subDomain(branch: string) {
    const subdomainMap = {
      acceptance: 'irma-issue.accp',
      production: 'irma-issue',
    };
    const subdomain = subdomainMap[branch as keyof typeof subdomainMap] ?? 'irma-issue-dev';
    return subdomain;
  }

}