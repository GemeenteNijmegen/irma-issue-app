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


}