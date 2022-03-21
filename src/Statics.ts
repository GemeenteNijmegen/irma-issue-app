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
  static readonly envRootHostedZoneId: string = '/gemeente-nijmegen/formFio/hostedzone/id';
  static readonly envRootHostedZoneName: string = '/gemeente-nijmegen/formio/hostedzone/name';

  /**
   * Our hosted zone reference
   */
  static readonly hostedZoneId: string = '/irma-issue-app/hosted-zone/id';
  static readonly hostedZoneName: string = '/irma-issue-app/hosted-zone/name';

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